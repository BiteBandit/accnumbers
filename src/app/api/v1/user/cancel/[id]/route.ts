import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const providerToken = process.env.SIM5_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !providerToken) {
  throw new Error("Missing required server environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProviderOrder = {
  id: number;
  created_at: string;
  phone: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  sms: Array<{
    created_at: string;
    date: string;
    sender: string;
    text: string;
    code: string;
  }>;
  forwarding: boolean;
  forwarding_number: string;
  country: string;
  [key: string]: unknown;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function parseNumber(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    // This ID is the external 5SIM order ID, not the local rental UUID.
    const { id: externalOrderId } = await params;

    if (!/^\d+$/.test(externalOrderId)) {
      return json(
        { success: false, error: "Invalid order ID" },
        400
      );
    }

    // Authenticate the customer's API key.
    const authorization = req.headers.get("authorization");
    const apiKey = authorization
      ?.match(/^Bearer\s+(.+)$/i)?.[1]
      ?.trim();

    if (!apiKey) {
      return json(
        { success: false, error: "Missing or invalid API key" },
        401
      );
    }

    const { data: keyRecord, error: keyError } =
      await supabaseAdmin
        .from("api_keys")
        .select("id, user_id, status, expires_at, scopes")
        .eq("key", apiKey)
        .maybeSingle();

    if (keyError) {
      console.error("API-key lookup failed:", keyError.message);
      return json(
        { success: false, error: "Authentication could not be completed" },
        500
      );
    }

    if (
      !keyRecord ||
      keyRecord.status !== "active" ||
      (keyRecord.expires_at &&
        new Date(keyRecord.expires_at).getTime() <= Date.now())
    ) {
      return json(
        { success: false, error: "Missing or invalid API key" },
        401
      );
    }

    const scopes = keyRecord.scopes;

    if (
      scopes &&
      typeof scopes === "object" &&
      "cancel" in scopes &&
      (scopes as Record<string, unknown>).cancel !== true
    ) {
      return json(
        { success: false, error: "You are not allowed to cancel rentals" },
        403
      );
    }

    const userId = keyRecord.user_id;

    // Find the user's rental by its external provider order ID.
    const { data: rental, error: rentalError } =
      await supabaseAdmin
        .from("rentals")
        .select("id, user_id, status, amount, external_order_id")
        .eq("external_order_id", externalOrderId)
        .eq("user_id", userId)
        .maybeSingle();

    if (rentalError) {
      console.error("Rental lookup failed:", rentalError.message);
      return json(
        { success: false, error: "Could not retrieve rental" },
        500
      );
    }

    if (!rental) {
      return json(
        { success: false, error: "Rental not found" },
        404
      );
    }

    const currentStatus = String(rental.status ?? "").toLowerCase();

    if (
      ["finished", "timeout", "banned", "cancelled", "canceled"].includes(currentStatus)
    ) {
      return json(
        { success: false, error: "This rental cannot be canceled" },
        409
      );
    }

    /*
     * Load pricing settings from public.settings.
     */
    const { data: settings, error: settingsError } =
      await supabaseAdmin
        .from("settings")
        .select("key, value")
        .in("key", ["markup_multiplier", "usd_to_ngn"]);

    if (settingsError) {
      console.error("Pricing settings lookup failed:", settingsError.message);
      return json(
        { success: false, error: "Pricing could not be calculated" },
        500
      );
    }

    const settingsMap = new Map(
      (settings ?? []).map((setting) => [
        setting.key,
        setting.value,
      ])
    );

    const markupMultiplier = parseNumber(
      settingsMap.get("markup_multiplier")
    );

    const usdToNgn = parseNumber(settingsMap.get("usd_to_ngn"));

    if (
      markupMultiplier === null ||
      markupMultiplier <= 0 ||
      usdToNgn === null ||
      usdToNgn <= 0
    ) {
      console.error("Pricing settings are missing or invalid");
      return json(
        { success: false, error: "Pricing could not be calculated" },
        500
      );
    }

    /*
     * Request cancellation from the provider.
     */
    let providerResponse: Response;

    try {
      providerResponse = await fetch(
        `https://5sim.net/v1/user/cancel/${encodeURIComponent(
          externalOrderId
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }
      );
    } catch (error) {
      console.error(
        "Cancellation request failed:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return json(
        {
          success: false,
          error: "Cancellation could not be confirmed. Please try again.",
        },
        502
      );
    }

    if (!providerResponse.ok) {
      console.error(
        "Cancellation request returned HTTP",
        providerResponse.status
      );

      return json(
        {
          success: false,
          error: "Cancellation could not be completed",
        },
        502
      );
    }

    let providerData: ProviderOrder;

    try {
      providerData = (await providerResponse.json()) as ProviderOrder;
    } catch {
      return json(
        {
          success: false,
          error: "Cancellation could not be confirmed",
        },
        502
      );
    }

    if (
      !providerData ||
      String(providerData.status ?? "").toUpperCase() !== "CANCELED" ||
      !Number.isFinite(Number(providerData.price))
    ) {
      return json(
        {
          success: false,
          error: "Cancellation could not be confirmed",
        },
        502
      );
    }

    /*
     * Convert the provider's price to local markup pricing.
     */
    const convertedPrice = Number(
      (
        Number(providerData.price) *
        markupMultiplier *
        usdToNgn
      ).toFixed(2)
    );

    /*
     * Process the local status update and wallet refund atomically via RPC.
     */
    const { data: refundResult, error: refundError } =
      await supabaseAdmin.rpc("cancel_rental_and_refund", {
        p_rental_id: rental.id,
        p_user_id: userId,
      });

    if (refundError || refundResult?.success !== true) {
      console.error(
        "Refund reconciliation required:",
        refundError?.message ?? "RPC did not confirm success"
      );

      return json(
        {
          success: false,
          error:
            "Cancellation was confirmed, but the refund could not be processed. Please contact support.",
        },
        500
      );
    }

    // Return the provider's complete order object with the markup price applied.
    return json({
      ...providerData,
      price: convertedPrice,
    });
  } catch (error) {
    console.error(
      "Cancellation route failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return json(
      { success: false, error: "An unexpected error occurred" },
      500
    );
  }
}


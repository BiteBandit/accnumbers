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
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: externalOrderId } = await params;

    if (!/^\d+$/.test(externalOrderId)) {
      return json({ success: false, error: "Invalid order ID" }, 400);
    }

    // Authenticate API key via Authorization header or x-api-key
    const authorization = req.headers.get("authorization");
    const apiKey = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || req.headers.get("x-api-key")?.trim();

    if (!apiKey) {
      return json({ success: false, error: "Missing or invalid API key" }, 401);
    }

    const { data: keyRecord, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, status, expires_at, scopes")
      .eq("key", apiKey)
      .maybeSingle();

    if (keyError || !keyRecord || keyRecord.status !== "active") {
      return json({ success: false, error: "Invalid or inactive API key" }, 401);
    }

    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return json({ success: false, error: "API key has expired" }, 401);
    }

    let scopesObj: Record<string, boolean> = {};
    try {
      scopesObj = typeof keyRecord.scopes === "string" ? JSON.parse(keyRecord.scopes) : keyRecord.scopes;
    } catch {
      scopesObj = {};
    }

    if (!scopesObj || (!scopesObj.purchase && !scopesObj.check && !scopesObj.rentals)) {
      return json({ success: false, error: "This API key lacks permission to manage orders." }, 403);
    }

    const userId = keyRecord.user_id;

    // Retrieve local rental record using 'external_order_id' and 'service'
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from("rentals")
      .select("id, user_id, status, amount, service, external_order_id")
      .eq("external_order_id", externalOrderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (rentalError || !rental) {
      return json({ success: false, error: "Rental not found" }, 404);
    }

    const currentStatus = String(rental.status ?? "").toLowerCase();
    if (["finished", "timeout", "banned", "cancelled", "canceled"].includes(currentStatus)) {
      return json({ success: false, error: "This rental has already been finalized or closed" }, 409);
    }

    // Fetch pricing multipliers
    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("key, value")
      .in("key", ["markup_multiplier", "usd_to_ngn"]);

    const settingsMap = new Map((settings ?? []).map((s) => [s.key, s.value]));
    const markupMultiplier = parseNumber(settingsMap.get("markup_multiplier"));
    const usdToNgn = parseNumber(settingsMap.get("usd_to_ngn"));

    if (!markupMultiplier || !usdToNgn) {
      return json({ success: false, error: "Pricing could not be calculated" }, 500);
    }

    // Call upstream 5-SIM Finish API
    let providerResponse: Response;
    try {
      providerResponse = await fetch(
        `https://5sim.net/v1/user/finish/${encodeURIComponent(externalOrderId)}`,
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
    } catch {
      return json({ success: false, error: "Finish could not be confirmed. Please try again." }, 502);
    }

    if (!providerResponse.ok) {
      const errorText = await providerResponse.text();
      return json({ success: false, error: "Finish could not be completed", details: errorText }, 502);
    }

    let providerData: ProviderOrder;
    try {
      providerData = (await providerResponse.json()) as ProviderOrder;
    } catch {
      return json({ success: false, error: "Finish could not be confirmed" }, 502);
    }

    if (!providerData || String(providerData.status ?? "").toUpperCase() !== "FINISHED") {
      return json({ success: false, error: "Finish could not be confirmed by provider" }, 502);
    }

    // Update local rental status to 'finished' (omitting non-existent updated_at column)
    const { error: updateRentalError } = await supabaseAdmin
      .from("rentals")
      .update({ status: "finished" })
      .eq("id", rental.id);

    if (updateRentalError) {
      console.error("Failed to update rental status to finished:", updateRentalError.message);
      return json({ success: false, error: "Finish confirmed, but local status update failed." }, 500);
    }

    const convertedPrice = Number((Number(providerData.price) * markupMultiplier * usdToNgn).toFixed(2));

    return json({
      ...providerData,
      price: convertedPrice,
    });
  } catch (error) {
    console.error("Finish route failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ success: false, error: "An unexpected error occurred" }, 500);
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

interface RouteParams {
  params: Promise<{ id: string }>;
}

const json = (
  body: Record<string, unknown>,
  status = 200
) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });

function getToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization")?.trim();
  const apiKey = request.headers.get("x-api-key")?.trim();

  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : authorization;
  }

  return apiKey || "";
}

function parseScopes(value: unknown): Record<string, boolean> {
  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) : value;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function parseSms(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function validId(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!validId(id)) {
      return json({ error: "Invalid order ID." }, 400);
    }

    if (!supabaseAdmin) {
      console.error("Supabase server configuration is missing.");

      return json(
        { error: "The service is temporarily unavailable." },
        503
      );
    }

    // 1. Authenticate the API key.
    const token = getToken(request);

    if (!token) {
      return json({ error: "A valid API key is required." }, 401);
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id,status,scopes")
      .eq("key", token)
      .maybeSingle();

    if (keyError) {
      console.error("API-key lookup failed:", keyError.message);

      return json(
        { error: "Unable to authenticate this request." },
        500
      );
    }

    if (!keyData || keyData.status !== "active") {
      return json({ error: "Invalid or inactive API key." }, 401);
    }

    const scopes = parseScopes(keyData.scopes);

    if (!scopes.check && !scopes.purchase && !scopes.rentals) {
      return json(
        { error: "This API key does not have permission to check orders." },
        403
      );
    }

    // 2. Search local rentals first.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    let query = supabaseAdmin
      .from("rentals")
      .select(
        "id,idx,external_order_id,user_id,created_at,phone_number,service,amount,status,expires_at,sms,country"
      );

    query = isUuid
      ? query.or(
          `id.eq.${id},external_order_id.eq.${id}`
        )
      : query.or(
          `external_order_id.eq.${id},idx.eq.${id}`
        );

    const { data: rows, error: rentalError } = await query.limit(2);

    if (rentalError) {
      console.error("Rental lookup failed:", rentalError.message);

      return json(
        { error: "Unable to check the order right now." },
        500
      );
    }

    // Do not return a potentially ambiguous order.
    if (rows && rows.length > 1) {
      return json(
        { error: "The order ID is ambiguous. Contact support." },
        409
      );
    }

    const order = rows?.[0];

    if (order) {
      // API keys may only access orders owned by their account.
      if (order.user_id !== keyData.user_id) {
        return json({ error: "Order not found." }, 404);
      }

      const formattedResponse = {
        id:
          (order.external_order_id != null
            ? Number(order.external_order_id) || order.external_order_id
            : null) ??
          order.idx ??
          order.id,
        created_at: order.created_at,
        phone: order.phone_number,
        product: order.service,
        price: Number(order.amount),
        status: String(order.status || "PENDING").toUpperCase(),
        expires: order.expires_at,
        sms: parseSms(order.sms),
        forwarding: false,
        forwarding_number: "",
        country: order.country,
      };

      return json(formattedResponse);
    }

    // 3. Local order not found: check the provider.
    // Only numeric external order IDs are accepted for this fallback.
    if (!/^\d{1,30}$/.test(id)) {
      return json({ error: "Order not found." }, 404);
    }

    const providerApiKey = process.env.SIM5_API_KEY;

    if (!providerApiKey) {
      console.error("Order fallback service is not configured.");

      return json(
        { error: "The order-check service is temporarily unavailable." },
        503
      );
    }

    let upstreamResponse: Response;

    try {
      upstreamResponse = await fetchWithTimeout(
        `https://5sim.net/v1/user/check/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${providerApiKey}`,
            Accept: "application/json",
          },
        }
      );
    } catch (error) {
      console.error(
        "Order-check request failed:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return json(
        { error: "Unable to check the order right now. Try again later." },
        502
      );
    }

    if (upstreamResponse.status === 404) {
      return json({ error: "Order not found." }, 404);
    }

    if (!upstreamResponse.ok) {
      console.error(
        "Order-check service returned HTTP",
        upstreamResponse.status
      );

      return json(
        { error: "Unable to retrieve the order status right now." },
        502
      );
    }

    let data: unknown;

    try {
      data = await upstreamResponse.json();
    } catch {
      return json(
        { error: "The order-check service returned an invalid response." },
        502
      );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return json(
        { error: "The order-check service returned an invalid response." },
        502
      );
    }

    return json(data as Record<string, unknown>);
  } catch (error) {
    console.error(
      "Unexpected order-check error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return json(
      { error: "An unexpected error occurred while checking the order." },
      500
    );
  }
}
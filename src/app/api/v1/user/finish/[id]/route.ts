import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const providerToken = process.env.SIM5_API_KEY;

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
  status: number
) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate configuration.
    if (!supabaseAdmin) {
      return json(
        { error: "Server database configuration is unavailable." },
        500
      );
    }

    if (!providerToken) {
      return json(
        { error: "Order service is temporarily unavailable." },
        503
      );
    }

    // Validate order ID.
    if (
      !id ||
      id.length > 128 ||
      !/^[a-zA-Z0-9_-]+$/.test(id)
    ) {
      return json({ error: "Invalid order ID." }, 400);
    }

    // Authenticate API key.
    const authorization = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");

    let token = "";

    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i);

      if (!match) {
        return json(
          { error: "Use Authorization: Bearer YOUR_API_KEY." },
          401
        );
      }

      token = match[1].trim();
    } else if (apiKeyHeader) {
      token = apiKeyHeader.trim();
    }

    if (!token) {
      return json({ error: "Missing API key." }, 401);
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id, status, expires_at, scopes")
      .eq("key", token)
      .maybeSingle();

    if (keyError) {
      console.error("Finish endpoint: API key lookup failed.");
      return json({ error: "Unable to authenticate API key." }, 500);
    }

    if (!keyData || keyData.status !== "active") {
      return json({ error: "Invalid or inactive API key." }, 401);
    }

    if (
      keyData.expires_at &&
      !Number.isNaN(Date.parse(keyData.expires_at)) &&
      Date.parse(keyData.expires_at) <= Date.now()
    ) {
      return json({ error: "API key has expired." }, 401);
    }

    // Require the specific permission for checking/finishing orders.
    let scopes: Record<string, unknown> = {};

    try {
      const rawScopes = keyData.scopes;

      scopes =
        typeof rawScopes === "string"
          ? JSON.parse(rawScopes)
          : rawScopes && typeof rawScopes === "object"
            ? rawScopes
            : {};
    } catch {
      scopes = {};
    }

    const allowed =
      scopes.check === true ||
      scopes.purchase === true ||
      scopes.rentals === true;

    if (!allowed) {
      return json(
        { error: "This API key lacks permission to manage orders." },
        403
      );
    }

    if (!keyData.user_id) {
      return json(
        { error: "API key is not associated with a user." },
        403
      );
    }

    // Find the order locally and verify ownership before calling the provider.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      );

    const rentalQuery = supabaseAdmin
      .from("rentals")
      .select(
        "id, user_id, external_order_id, status"
      );

    const { data: rental, error: rentalError } = await rentalQuery
      .or(
        isUuid
          ? `id.eq.${id},external_order_id.eq.${id}`
          : `external_order_id.eq.${id}`
      )
      .maybeSingle();

    if (rentalError) {
      console.error("Finish endpoint: rental lookup failed.");
      return json({ error: "Unable to look up the order." }, 500);
    }

    if (!rental) {
      return json({ error: "Order not found." }, 404);
    }

    if (rental.user_id !== keyData.user_id) {
      return json(
        { error: "You do not have permission to finish this order." },
        403
      );
    }

    // Prevent unnecessary calls for orders already finished.
    if (String(rental.status ?? "").toUpperCase() === "FINISHED") {
      return json(
        {
          success: true,
          message: "Order is already finished.",
          id: rental.id,
          status: "FINISHED",
        },
        200
      );
    }

    const upstreamId = rental.external_order_id || id;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let upstreamResponse: Response;

    try {
      upstreamResponse = await fetch(
        `https://5sim.net/v1/user/finish/${encodeURIComponent(upstreamId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return json(
          { error: "Order service timed out. Please try again." },
          504
        );
      }

      return json(
        { error: "Unable to reach the order service." },
        502
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamResponse.ok) {
      // Do not forward upstream response bodies or internal details.
      if (upstreamResponse.status === 404) {
        return json({ error: "Order not found by the order service." }, 404);
      }

      if (
        upstreamResponse.status === 401 ||
        upstreamResponse.status === 403
      ) {
        console.error("Finish endpoint: provider authorization failed.");
        return json(
          { error: "Order service authorization failed." },
          502
        );
      }

      if (upstreamResponse.status === 429) {
        return json(
          { error: "Order service is busy. Please try again shortly." },
          503
        );
      }

      return json(
        { error: "Unable to finish the order at this time." },
        upstreamResponse.status >= 500 ? 502 : 400
      );
    }

    // Parse provider response only after a successful status.
    let upstreamData: unknown;

    try {
      upstreamData = await upstreamResponse.json();
    } catch {
      return json(
        { error: "Invalid response received from the order service." },
        502
      );
    }

    // Sync local status only after the provider confirms success.
    const { data: updatedRental, error: updateError } =
      await supabaseAdmin
        .from("rentals")
        .update({ status: "FINISHED" })
        .eq("id", rental.id)
        .eq("user_id", keyData.user_id)
        .select("id, status")
        .maybeSingle();

    if (updateError || !updatedRental) {
      console.error(
        "Finish endpoint: provider succeeded but local status sync failed."
      );

      return json(
        {
          success: true,
          warning:
            "The order was finished, but its local status could not be synchronized. Please check the order status.",
          id: rental.id,
          provider_response: upstreamData,
        },
        200
      );
    }

    return json(
      {
        success: true,
        message: "Order finished successfully.",
        id: updatedRental.id,
        status: updatedRental.status,
        provider_response: upstreamData,
      },
      200
    );
  } catch {
    console.error("Finish endpoint: unexpected server error.");

    return json({ error: "Internal server error." }, 500);
  }
}
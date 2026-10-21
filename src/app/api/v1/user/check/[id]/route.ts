import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Authenticate user via custom API token/key from headers
    const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

    if (!token) {
      return NextResponse.json(
        { error: "Missing or invalid API token" },
        { status: 401 }
      );
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("key", token)
      .maybeSingle();

    if (keyError || !keyData || keyData.status !== "active") {
      return NextResponse.json(
        { 
          error: "Invalid or inactive API key.", 
          details: keyError?.message || "No matching active key found" 
        },
        { status: 401 }
      );
    }

    let scopesObj: Record<string, boolean> = {};
    try {
      scopesObj = typeof keyData.scopes === "string" ? JSON.parse(keyData.scopes) : keyData.scopes;
    } catch {
      scopesObj = {};
    }

    if (!scopesObj || (!scopesObj.purchase && !scopesObj.check && !scopesObj.rentals)) {
      return NextResponse.json(
        { error: "This API key lacks permission to check orders." },
        { status: 403 }
      );
    }

    // 2. Query Supabase 'rentals' table first
    let rows: any[] | null = null;
    let dbError = null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      const res = await supabaseAdmin
        .from("rentals")
        .select("*")
        .or(`id.eq.${id},external_order_id.eq.${id}`)
        .limit(1);
      rows = res.data;
      dbError = res.error;
    } else {
      const res = await supabaseAdmin
        .from("rentals")
        .select("*")
        .or(`external_order_id.eq.${id},idx.eq.${id}`)
        .limit(1);
      rows = res.data;
      dbError = res.error;
    }

    if (dbError) {
      console.error("Database query error:", dbError.message);
    }

    const order: any = rows && rows.length > 0 ? rows[0] : null;

    if (order) {
      let parsedSms = [];
      try {
        parsedSms = typeof order.sms === "string" ? JSON.parse(order.sms) : (order.sms || []);
      } catch {
        parsedSms = [];
      }

      const formattedResponse = {
        id: Number(order.external_order_id) || order.idx || order.id,
        created_at: order.created_at,
        phone: order.phone_number,
        product: order.service,
        price: Number(order.amount),
        status: order.status ? order.status.toUpperCase() : "PENDING",
        expires: order.expires_at,
        sms: parsedSms,
        forwarding: false,
        forwarding_number: "",
        country: order.country,
      };

      return NextResponse.json(formattedResponse, { status: 200 });
    }

    // 3. Fallback: If not found in local database, query upstream 5-SIM API using server env key
    const sim5ApiKey = process.env.SIM5_API_KEY;
    if (!sim5ApiKey) {
      return NextResponse.json(
        { error: "Order not found in database and upstream server API key is missing." },
        { status: 404 }
      );
    }

    const upstreamResponse = await fetch(`https://5sim.net/v1/user/check/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sim5ApiKey}`,
        Accept: "application/json",
      },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "Order not found in database or upstream provider" },
        { status: upstreamResponse.status }
      );
    }

    const data = await upstreamResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}


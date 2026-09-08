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
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid API token" },
        { status: 401 }
      );
    }

    // 1. Query Supabase 'rentals' table and cast result to prevent 'never' type inference
    const { data: rows, error: dbError } = await supabaseAdmin
      .from("rentals")
      .select("*")
      .or(`external_order_id.eq.${id},id.eq.${id}`)
      .limit(1);

    if (dbError) {
      console.error("Database query error:", dbError.message);
    }

    const typedRows = rows as Array<Record<string, any>> | null;
    const order = typedRows?.[0] || null;

    if (order) {
      let parsedSms = [];
      try {
        parsedSms = typeof order.sms === "string" ? JSON.parse(order.sms) : (order.sms || []);
      } catch {
        parsedSms = [];
      }

      const formattedResponse = {
        id: Number(order.external_order_id) || order.idx,
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

    // 2. Fallback: Query upstream 5-SIM API using your server environment key
    const upstreamResponse = await fetch(`https://5sim.net/v1/user/check/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SIM5_API_KEY}`,
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


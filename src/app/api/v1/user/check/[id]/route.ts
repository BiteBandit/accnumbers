import { NextRequest, NextResponse } from "next/server";
// Import your database client instance here, e.g.:
// import { db } from "@/lib/db";

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

    // 1. Query your database using either the internal UUID/idx or the external_order_id
    // Example using Prisma/Drizzle/SQL client searching by external_order_id or id:
    /*
    const row = await db.query(
      "SELECT * FROM orders WHERE external_order_id = $1 OR id = $1 LIMIT 1",
      [id]
    );
    const order = row[0];
    */
    const order = null; // Replace with your actual database query result

    if (order) {
      // 2. Map database record to match the requested 5sim-compatible API output format
      let parsedSms = [];
      try {
        parsedSms = order.sms ? JSON.parse(order.sms) : [];
      } catch {
        parsedSms = [];
      }

      const formattedResponse = {
        id: Number(order.external_order_id) || order.idx,
        created_at: order.created_at,
        phone: order.phone_number,
        product: order.service,
        price: Number(order.amount),
        status: order.status.toUpperCase(),
        expires: order.expires_at,
        sms: parsedSms,
        forwarding: false,
        forwarding_number: "",
        country: order.country,
      };

      return NextResponse.json(formattedResponse, { status: 200 });
    }

    // 3. Fallback: If not found in your database, fetch directly from the external API
    const token = authHeader.split(" ")[1];
    const upstreamResponse = await fetch(`https://5sim.net/v1/user/check/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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


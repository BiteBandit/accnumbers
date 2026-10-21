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

    // 1. Verify key exists and status is active (not revoked)
    if (keyError || !keyData || keyData.status !== "active") {
      return NextResponse.json(
        { 
          error: "Invalid or inactive API key.", 
          details: keyError?.message || "No matching active key found" 
        },
        { status: 401 }
      );
    }

    // 2. Check if expires_at has passed (skips if expires_at is null)
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "API key has expired." },
        { status: 401 }
      );
    }

    // 3. Parse and verify scopes
    let scopesObj: Record<string, boolean> = {};
    try {
      scopesObj = typeof keyData.scopes === "string" ? JSON.parse(keyData.scopes) : keyData.scopes;
    } catch {
      scopesObj = {};
    }

    if (!scopesObj || (!scopesObj.purchase && !scopesObj.check && !scopesObj.rentals)) {
      return NextResponse.json(
        { error: "This API key lacks permission to manage orders." },
        { status: 403 }
      );
    }

    const providerToken = process.env.SIM5_API_KEY;

    if (!providerToken) {
      return NextResponse.json(
        { error: "Upstream provider authorization token not configured." },
        { status: 500 }
      );
    }

    // 4. Request upstream finish endpoint from 5sim
    const upstreamResponse = await fetch(`https://5sim.net/v1/user/finish/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${providerToken}`,
        "Accept": "application/json"
      }
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return NextResponse.json(
        { error: "Failed to finish order on upstream provider.", details: errorText },
        { status: upstreamResponse.status }
      );
    }

    const upstreamData = await upstreamResponse.json();

    return NextResponse.json(upstreamData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}


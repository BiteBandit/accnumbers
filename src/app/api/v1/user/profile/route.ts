import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const customApiKeyHeader = request.headers.get('x-api-key');
    
    let token = '';

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (customApiKeyHeader) {
      token = customApiKeyHeader.trim();
    }

    if (!token) {
      return NextResponse.json({ error: 'Missing or invalid API token' }, { status: 401 });
    }

    // 1. Verify the API key and fetch its details including status, expires_at, and scopes
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('key', token)
      .single();

    if (keyError || !apiKeyData) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    // 2. Validate Status
    if (apiKeyData.status !== 'active') {
      return NextResponse.json({ error: `API key is inactive (Status: ${apiKeyData.status})` }, { status: 403 });
    }

    // 3. Validate Expiration Date (if expires_at is set)
    if (apiKeyData.expires_at) {
      const expirationDate = new Date(apiKeyData.expires_at);
      const now = new Date();
      if (expirationDate <= now) {
        return NextResponse.json({ error: 'API key has expired' }, { status: 403 });
      }
    }

    // 4. Validate Scopes (Ensuring 'balance' or general profile access scope is enabled)
    try {
      const scopes = typeof apiKeyData.scopes === 'string' 
        ? JSON.parse(apiKeyData.scopes) 
        : apiKeyData.scopes;

      if (scopes && scopes.balance === false) {
        return { error: 'This API key lacks permission to access account details (balance scope is disabled).', status: 403 };
      }
    } catch (parseErr) {
      console.error('[API AUTH] Failed to parse scopes JSON:', parseErr);
      return NextResponse.json({ error: 'Malformed API key scopes configuration.' }, { status: 403 });
    }

    // 5. Fetch user profile / auth details from Supabase Auth admin API
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(apiKeyData.user_id);
    
    // 6. Fetch wallet balance
    const { data: walletData } = await supabaseAdmin
      .from('wallets')
      .select('balance, frozen_balance')
      .eq('user_id', apiKeyData.user_id)
      .single();

    const userEmail = userData?.user?.email || 'user@accnumbers.com';

    // 7. Return the exact 5-SIM style JSON structure
    return NextResponse.json({
      id: apiKeyData.user_id,
      email: userEmail,
      vendor: "accnumbers",
      default_forwarding_number: "",
      balance: Number(walletData?.balance ?? 0),
      rating: 100,
      default_country: {
        name: "nigeria",
        iso: "ng",
        prefix: "+234"
      },
      default_operator: {
        name: "any"
      },
      frozen_balance: Number(walletData?.frozen_balance ?? 0)
    }, { status: 200 });

  } catch (err: any) {
    console.error('[PROFILE_FATAL]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


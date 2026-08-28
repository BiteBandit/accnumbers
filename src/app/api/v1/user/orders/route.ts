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

    // 1. Fetch API key record to validate credentials, status, expiration, and scopes
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

    // 4. Validate Scopes (Ensuring 'purchase' scope is enabled for order/rental management)
    try {
      const scopes = typeof apiKeyData.scopes === 'string' 
        ? JSON.parse(apiKeyData.scopes) 
        : apiKeyData.scopes;

      if (scopes && scopes.purchase === false) {
        return NextResponse.json({ error: 'This API key lacks permission to access order/rental records (purchase scope is disabled).' }, { status: 403 });
      }
    } catch (parseErr) {
      console.error('[API AUTH] Failed to parse scopes JSON:', parseErr);
      return NextResponse.json({ error: 'Malformed API key scopes configuration.' }, { status: 403 });
    }

    // 5. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 6. Query your actual `rentals` table using verified user_id
    const { data: rentalsData, count, error: rentalsError } = await supabaseAdmin
      .from('rentals')
      .select('*', { count: 'exact' })
      .eq('user_id', apiKeyData.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (rentalsError) {
      console.error('[RENTALS_FETCH_ERROR]', rentalsError.message);
      return NextResponse.json({
        Data: [],
        ProductNames: [],
        Statuses: [],
        Total: 0
      }, { status: 200 });
    }

    // 7. Map your `rentals` columns precisely to the 5-SIM schema format
    const formattedData = (rentalsData || []).map((row) => {
      let parsedSms = [];
      try {
        parsedSms = typeof row.sms === 'string' ? JSON.parse(row.sms) : (row.sms || []);
      } catch (e) {
        parsedSms = [];
      }

      return {
        id: row.idx, 
        phone: row.phone_number,
        operator: row.operator || 'any',
        product: row.service, 
        price: Number(row.amount || 0), 
        status: (row.status || 'PENDING').toUpperCase(), 
        expires: row.expires_at,
        sms: parsedSms,
        created_at: row.created_at,
        country: row.country
      };
    });

    return NextResponse.json({
      Data: formattedData,
      ProductNames: [],
      Statuses: [],
      Total: count ?? formattedData.length
    }, { status: 200 });

  } catch (err: any) {
    console.error('[ORDERS_FATAL]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


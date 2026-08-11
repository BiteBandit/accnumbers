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

    // 1. Authenticate user via API key
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('key', token)
      .single();

    if (keyError || !apiKeyData) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 3. Query your actual `rentals` table
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

    // 4. Map your `rentals` columns precisely to the 5-SIM schema format
    const formattedData = (rentalsData || []).map((row) => {
      // Handle case where `sms` might be stored as a stringified JSON or an array
      let parsedSms = [];
      try {
        parsedSms = typeof row.sms === 'string' ? JSON.parse(row.sms) : (row.sms || []);
      } catch (e) {
        parsedSms = [];
      }

      return {
        id: row.idx, // Using your numeric index or use row.id if you prefer UUID
        phone: row.phone_number,
        operator: row.operator || 'any',
        product: row.service, // Maps your 'service' to 5-sim's 'product'
        price: Number(row.amount || 0), // Maps your 'amount' to 5-sim's 'price'
        status: (row.status || 'PENDING').toUpperCase(), // e.g., FINISHED, PENDING
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


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

    // 3. Query your existing `transactions` table
    const { data: txData, count, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', apiKeyData.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      console.error('[TRANSACTIONS_FETCH_ERROR]', txError.message);
      return NextResponse.json({
        Data: [],
        PaymentTypes: [],
        PaymentProviders: [],
        Total: 0
      }, { status: 200 });
    }

    // 4. Map your columns precisely to 5-SIM schema format
    const formattedData = (txData || []).map((row) => ({
      ID: row.idx,
      TypeName: row.type, // e.g., 'debit', 'credit', 'refund'
      ProviderName: row.description?.toLowerCase().includes('paystack') ? 'paystack' : 'system',
      Amount: Number(row.amount || 0),
      Balance: Number(row.balance_after || 0),
      CreatedAt: row.created_at
    }));

    return NextResponse.json({
      Data: formattedData,
      PaymentTypes: [
        { Name: "credit" }, 
        { Name: "debit" }, 
        { Name: "refund" }
      ],
      PaymentProviders: [
        { Name: "paystack" }, 
        { Name: "system" }
      ],
      Total: count ?? formattedData.length
    }, { status: 200 });

  } catch (err: any) {
    console.error('[PAYMENTS_FATAL]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


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

    // 4. Validate Scopes (Ensuring 'balance' scope is enabled out of your 4 allowed scopes)
    try {
      const scopes = typeof apiKeyData.scopes === 'string' 
        ? JSON.parse(apiKeyData.scopes) 
        : apiKeyData.scopes;

      if (scopes && scopes.balance === false) {
        return NextResponse.json({ error: 'This API key lacks permission to access transaction records (balance scope is disabled).' }, { status: 403 });
      }
    } catch (parseErr) {
      console.error('[API AUTH] Failed to parse scopes JSON:', parseErr);
      return NextResponse.json({ error: 'Malformed API key scopes configuration.' }, { status: 403 });
    }

    // 5. Parse query parameters (with pagination support)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 6. Query your existing `transactions` table using verified user_id
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

    // 7. Map your columns precisely to 5-SIM schema format
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


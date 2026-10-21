import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      console.error('[PAYMENTS] Required server environment variables are missing.');
      return jsonError('Internal Server Error', 500);
    }

    // 1. Extract the API key.
    const authHeader = request.headers.get('authorization');
    const customApiKeyHeader = request.headers.get('x-api-key');

    let token = '';

    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (customApiKeyHeader) {
      token = customApiKeyHeader.trim();
    }

    if (!token) {
      return jsonError('Missing or invalid API token', 401);
    }

    // 2. Validate the API key.
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, status, expires_at, scopes')
      .eq('key', token)
      .maybeSingle();

    if (keyError) {
      console.error('[PAYMENTS] API key lookup failed:', keyError.message);
      return jsonError('Internal Server Error', 500);
    }

    if (!apiKeyData) {
      return jsonError('Unauthorized: Invalid API key', 401);
    }

    // 3. Check key status.
    if (apiKeyData.status !== 'active') {
      return jsonError(
        `API key is inactive (Status: ${apiKeyData.status})`,
        403
      );
    }

    // 4. Check expiration.
    if (apiKeyData.expires_at) {
      const expirationDate = Date.parse(apiKeyData.expires_at);

      if (!Number.isFinite(expirationDate)) {
        console.error('[PAYMENTS] Invalid API key expiration configuration.');
        return jsonError('Malformed API key expiration configuration.', 403);
      }

      if (expirationDate <= Date.now()) {
        return jsonError('API key has expired', 403);
      }
    }

    // 5. Require explicit permission to access transaction records.
    let scopes: Record<string, unknown>;

    try {
      const parsedScopes =
        typeof apiKeyData.scopes === 'string'
          ? JSON.parse(apiKeyData.scopes)
          : apiKeyData.scopes;

      if (
        parsedScopes === null ||
        typeof parsedScopes !== 'object' ||
        Array.isArray(parsedScopes)
      ) {
        throw new Error('Invalid scopes object');
      }

      scopes = parsedScopes as Record<string, unknown>;
    } catch {
      console.error('[PAYMENTS] Invalid API key scopes configuration.');
      return jsonError('Malformed API key scopes configuration.', 403);
    }

    if (scopes.balance !== true) {
      return jsonError(
        'This API key lacks permission to access transaction records (balance scope is disabled).',
        403
      );
    }

    // 6. Validate pagination parameters.
    const { searchParams } = new URL(request.url);

    function parseIntegerParam(
      value: string | null,
      fallback: number
    ): number | null {
      if (value === null) return fallback;

      // Accept only non-negative decimal integers.
      if (!/^\d+$/.test(value)) return null;

      const parsed = Number(value);

      return Number.isSafeInteger(parsed) ? parsed : null;
    }

    const limit = parseIntegerParam(
      searchParams.get('limit'),
      DEFAULT_LIMIT
    );

    const offset = parseIntegerParam(
      searchParams.get('offset'),
      0
    );

    if (limit === null || limit < 1 || limit > MAX_LIMIT) {
      return jsonError(
        `Invalid limit. Use an integer between 1 and ${MAX_LIMIT}.`,
        400
      );
    }

    if (offset === null) {
      return jsonError(
        'Invalid offset. Use a non-negative integer.',
        400
      );
    }

    // 7. Fetch only the transaction fields used in the response.
    // Always scope the query to the owner of the authenticated API key.
    const { data: txData, count, error: txError } = await supabaseAdmin
      .from('transactions')
      .select(
        'idx, type, description, amount, balance_after, created_at',
        { count: 'exact' }
      )
      .eq('user_id', apiKeyData.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      console.error('[TRANSACTIONS_FETCH_ERROR]', txError.message);
      return jsonError('Unable to retrieve transaction records', 500);
    }

    // 8. Preserve the existing 5SIM-style response format.
    const formattedData = (txData ?? []).map((row) => ({
      ID: row.idx,
      TypeName: row.type,
      ProviderName: String(row.description ?? '')
        .toLowerCase()
        .includes('paystack')
        ? 'paystack'
        : 'system',
      Amount: Number(row.amount ?? 0),
      Balance: Number(row.balance_after ?? 0),
      CreatedAt: row.created_at,
    }));

    return NextResponse.json(
      {
        Data: formattedData,
        PaymentTypes: [
          { Name: 'credit' },
          { Name: 'debit' },
          { Name: 'refund' },
        ],
        PaymentProviders: [
          { Name: 'paystack' },
          { Name: 'system' },
        ],
        Total: count ?? formattedData.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error(
      '[PAYMENTS_FATAL]',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return jsonError('Internal Server Error', 500);
  }
}


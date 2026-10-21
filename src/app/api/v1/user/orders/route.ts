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
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

function jsonResponse(
  body: unknown,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      console.error('[ORDERS_CONFIG_ERROR] Missing Supabase environment variables');

      return jsonResponse(
        { error: 'Internal Server Error' },
        500
      );
    }

    // 1. Extract API key
    const authHeader = request.headers.get('authorization');
    const customApiKeyHeader = request.headers.get('x-api-key');

    let token = '';

    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (customApiKeyHeader) {
      token = customApiKeyHeader.trim();
    }

    if (!token) {
      return jsonResponse(
        { error: 'Missing or invalid API token' },
        401
      );
    }

    // 2. Validate API key
    const { data: apiKeyData, error: keyError } =
      await supabaseAdmin
        .from('api_keys')
        .select('user_id, status, expires_at, scopes')
        .eq('key', token)
        .maybeSingle();

    if (keyError) {
      console.error('[ORDERS_AUTH_ERROR]', keyError.message);

      return jsonResponse(
        { error: 'Internal Server Error' },
        500
      );
    }

    if (!apiKeyData) {
      return jsonResponse(
        { error: 'Unauthorized: Invalid API key' },
        401
      );
    }

    // 3. Validate API key status
    if (apiKeyData.status !== 'active') {
      return jsonResponse(
        {
          error: `API key is inactive (Status: ${apiKeyData.status})`,
        },
        403
      );
    }

    // 4. Validate expiration
    if (apiKeyData.expires_at) {
      const expirationTime = Date.parse(apiKeyData.expires_at);

      if (
        !Number.isFinite(expirationTime) ||
        expirationTime <= Date.now()
      ) {
        return jsonResponse(
          { error: 'API key has expired' },
          403
        );
      }
    }

    // 5. Validate purchase scope
    let scopes: Record<string, unknown>;

    try {
      const rawScopes = apiKeyData.scopes;

      scopes =
        typeof rawScopes === 'string'
          ? JSON.parse(rawScopes)
          : rawScopes;

      if (
        !scopes ||
        typeof scopes !== 'object' ||
        Array.isArray(scopes)
      ) {
        throw new Error('Invalid scopes configuration');
      }
    } catch (parseError) {
      console.error(
        '[API AUTH] Failed to parse scopes JSON:',
        parseError
      );

      return jsonResponse(
        { error: 'Malformed API key scopes configuration.' },
        403
      );
    }

    if (scopes.purchase !== true) {
      return jsonResponse(
        {
          error:
            'This API key lacks permission to access order/rental records (purchase scope is disabled).',
        },
        403
      );
    }

    // 6. Validate pagination
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get('limit') ?? '15';
    const offsetParam = searchParams.get('offset') ?? '0';

    if (
      !/^\d+$/.test(limitParam) ||
      !/^\d+$/.test(offsetParam)
    ) {
      return jsonResponse(
        { error: 'Invalid pagination parameters.' },
        400
      );
    }

    const limit = Number(limitParam);
    const offset = Number(offsetParam);

    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    ) {
      return jsonResponse(
        {
          error:
            'Invalid pagination parameters. Limit must be between 1 and 100, and offset must be a non-negative integer.',
        },
        400
      );
    }

    // 7. Fetch only this API key owner's rentals
    const { data: rentalsData, count, error: rentalsError } =
      await supabaseAdmin
        .from('rentals')
        .select(
          'idx, phone_number, operator, service, amount, status, expires_at, sms, created_at, country',
          { count: 'exact' }
        )
        .eq('user_id', apiKeyData.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (rentalsError) {
      console.error(
        '[RENTALS_FETCH_ERROR]',
        rentalsError.message
      );

      return jsonResponse(
        { error: 'Unable to retrieve order/rental records' },
        500
      );
    }

    // 8. Format rentals using the existing response schema
    const formattedData = (rentalsData ?? []).map((row) => {
      let parsedSms: unknown[] = [];

      try {
        const smsValue =
          typeof row.sms === 'string'
            ? JSON.parse(row.sms)
            : row.sms;

        parsedSms = Array.isArray(smsValue)
          ? smsValue
          : [];
      } catch {
        parsedSms = [];
      }

      return {
        id: row.idx,
        phone: row.phone_number,
        operator: row.operator || 'any',
        product: row.service,
        price: Number(row.amount ?? 0),
        status: String(row.status || 'PENDING').toUpperCase(),
        expires: row.expires_at,
        sms: parsedSms,
        created_at: row.created_at,
        country: row.country,
      };
    });

    // 9. Return results without caching private account data
    return jsonResponse({
      Data: formattedData,
      ProductNames: [],
      Statuses: [],
      Total: count ?? formattedData.length,
    });
  } catch (error) {
    console.error('[ORDERS_FATAL]', error);

    return jsonResponse(
      { error: 'Internal Server Error' },
      500
    );
  }
}
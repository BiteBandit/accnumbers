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
      console.error('[PROFILE] Required server environment variables are missing.');
      return jsonError('Service temporarily unavailable', 500);
    }

    // 1. Extract the API key from Bearer or x-api-key authentication.
    const authorization = request.headers.get('authorization');
    const customApiKey = request.headers.get('x-api-key');

    let token = '';

    if (authorization?.toLowerCase().startsWith('bearer ')) {
      token = authorization.slice(7).trim();
    }

    if (!token && customApiKey) {
      token = customApiKey.trim();
    }

    if (!token) {
      return jsonError('Missing or invalid API token', 401);
    }

    // 2. Find the API key. Retrieve only the fields we need.
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, status, expires_at, scopes')
      .eq('key', token)
      .maybeSingle();

    if (keyError) {
      console.error('[PROFILE] API key lookup failed:', keyError.message);
      return jsonError('Unable to authenticate request', 500);
    }

    if (!apiKeyData) {
      return jsonError('Unauthorized: Invalid API key', 401);
    }

    // 3. Check the key's status.
    if (apiKeyData.status !== 'active') {
      return jsonError('API key is inactive', 403);
    }

    // 4. Check expiry.
    if (apiKeyData.expires_at) {
      const expiresAt = Date.parse(apiKeyData.expires_at);

      if (!Number.isFinite(expiresAt)) {
        console.error('[PROFILE] Invalid API key expiration value.');
        return jsonError('API key configuration is invalid', 403);
      }

      if (expiresAt <= Date.now()) {
        return jsonError('API key has expired', 403);
      }
    }

    // 5. Require explicit permission to access the profile balance.
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
        throw new Error('Scopes must be an object');
      }

      scopes = parsedScopes as Record<string, unknown>;
    } catch (error) {
      console.error('[PROFILE] Invalid API key scopes configuration.');
      return jsonError('API key permissions are misconfigured', 403);
    }

    if (scopes.balance !== true) {
      return jsonError(
        'This API key does not have permission to access account balance',
        403
      );
    }

    // 6. Retrieve the API key owner's Auth user.
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(apiKeyData.user_id);

    if (userError) {
      console.error('[PROFILE] User lookup failed:', userError.message);
      return jsonError('Unable to retrieve account profile', 500);
    }

    if (!user) {
      return jsonError('API key owner account is unavailable', 403);
    }

    // 7. Retrieve the wallet balance.
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', apiKeyData.user_id)
      .maybeSingle();

    if (walletError) {
      console.error('[PROFILE] Wallet lookup failed:', walletError.message);
      return jsonError('Unable to retrieve wallet balance', 500);
    }

    // Do not report a fake zero balance when the wallet record is missing.
    if (!walletData || walletData.balance === null) {
      console.error('[PROFILE] Wallet record or balance is missing.');
      return jsonError('Wallet balance is unavailable', 500);
    }

    const currentBalance = Number(walletData.balance);

    if (!Number.isFinite(currentBalance)) {
      console.error('[PROFILE] Wallet balance is not a valid number.');
      return jsonError('Wallet balance is unavailable', 500);
    }

    // 8. Preserve the existing profile response format.
    return NextResponse.json(
      {
        id: apiKeyData.user_id,
        email: user.email ?? null,
        vendor: 'accnumbers',
        default_forwarding_number: '',
        balance: currentBalance,
        rating: 100,
        default_country: {
          name: 'nigeria',
          iso: 'ng',
          prefix: '+234',
        },
        default_operator: {
          name: 'any',
        },
        frozen_balance: 0,
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
      '[PROFILE] Unexpected server error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return jsonError('Internal Server Error', 500);
  }
}


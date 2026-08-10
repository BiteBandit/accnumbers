import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (bypasses RLS for secure server-to-server validation)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Extract API key from either Authorization header or x-api-key header
    const authHeader = request.headers.get('authorization');
    const customApiKeyHeader = request.headers.get('x-api-key');
    
    let token = '';

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (customApiKeyHeader) {
      token = customApiKeyHeader.trim();
    }

    // 2. Validate token existence
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing API key. Provide it via "Authorization: Bearer <key>" or "x-api-key: <key>" header.' 
        }, 
        { status: 401 }
      );
    }

    // 3. Verify the API key against the database
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, name')
      .eq('key', token)
      .single();

    if (keyError || !apiKeyData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: Invalid or revoked API key.' 
        }, 
        { status: 401 }
      );
    }

    // 4. Fetch wallet balance for the authenticated user
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', apiKeyData.user_id)
      .single();

    if (walletError) {
      console.error('[API_PROFILE_ERROR] Failed to fetch wallet:', walletError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error retrieving wallet data.' 
        }, 
        { status: 500 }
      );
    }

    // 5. Return successful response
    return NextResponse.json({
      success: true,
      data: {
        balance: Number(walletData?.balance ?? 0),
        currency: 'NGN',
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error('[API_PROFILE_FATAL]', err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error' 
      }, 
      { status: 500 }
    );
  }
}


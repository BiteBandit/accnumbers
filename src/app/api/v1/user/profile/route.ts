import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // --- DEBUG LOGS ---
    const allHeaders = Object.fromEntries(request.headers.entries());
    console.log('[DEBUG] Incoming Headers:', JSON.stringify(allHeaders, null, 2));

    const authHeader = request.headers.get('authorization');
    const customApiKeyHeader = request.headers.get('x-api-key');
    
    let token = '';

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (customApiKeyHeader) {
      token = customApiKeyHeader.trim();
    }

    console.log('[DEBUG] Extracted Token:', token ? token.substring(0, 10) + '...' : 'NONE FOUND');

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing API key. Provide it via "Authorization: Bearer <key>" or "x-api-key: <key>" header.' 
        }, 
        { status: 401 }
      );
    }

    // Verify the API key against the database
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, name')
      .eq('key', token)
      .single();

    if (keyError) {
      console.error('[DEBUG] Database Key Error:', keyError.message);
    }

    if (keyError || !apiKeyData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: Invalid or revoked API key.' 
        }, 
        { status: 401 }
      );
    }

    console.log('[DEBUG] Key found for user_id:', apiKeyData.user_id);

    // Fetch wallet balance for the authenticated user
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', apiKeyData.user_id)
      .single();

    if (walletError) {
      console.error('[DEBUG] Database Wallet Error:', walletError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error retrieving wallet data.' 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(walletData?.balance ?? 0),
        currency: 'NGN',
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error('[DEBUG] Fatal Route Error:', err.message || err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        details: err.message 
      }, 
      { status: 500 }
    );
  }
}


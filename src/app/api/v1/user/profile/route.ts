import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role or public client depending on auth strategy
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid API token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  // Verify the API key against the database
  const { data: apiKeyData, error: keyError } = await supabaseAdmin
    .from('api_keys')
    .select('user_id')
    .eq('key', token)
    .single();

  if (keyError || !apiKeyData) {
    return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
  }

  // Fetch wallet balance for the user
  const { data: walletData } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', apiKeyData.user_id)
    .single();

  return NextResponse.json({
    status: 'success',
    balance: walletData?.balance || 0,
  }, { status: 200 });
}


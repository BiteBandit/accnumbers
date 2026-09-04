import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a dedicated server-side admin client to bypass RLS for all internal queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function getPricingConfig() {
  try {
    const { data } = await supabaseAdmin.from('settings').select('key, value');
    if (!data) return { defaultMarkup: 1.0, usdToNgnRate: 1500 };

    const markupRow = data.find((row) => row.key === 'markup_multiplier');
    const usdToNgnRow = data.find((row) => row.key === 'usd_to_ngn' || row.key === 'usdt_rate');

    return {
      defaultMarkup: markupRow ? Number(markupRow.value) : 1.0,
      usdToNgnRate: usdToNgnRow ? Number(usdToNgnRow.value) : 1500,
    };
  } catch (err) {
    console.error('[API CONFIG] Error loading settings from Supabase:', err);
    return { defaultMarkup: 1.0, usdToNgnRate: 1500 };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ country: string; operator: string; product: string }> }
) {
  try {
    const resolvedParams = await params;
    const country = resolvedParams?.country?.toLowerCase() || '';
    const operator = resolvedParams?.operator?.toLowerCase() || '';
    const product = resolvedParams?.product?.toLowerCase() || '';

    if (!country || !operator || !product) {
      return NextResponse.json(
        { error: 'Missing country, operator, or product path parameters.' },
        { status: 400 }
      );
    }

    // Authenticate user via custom API token/key from headers
    const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing or invalid API token' },
        { status: 401 }
      );
    }

    // Validate API key and check status using supabaseAdmin
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('key', token)
      .single();

    if (keyError || !keyData || keyData.status !== 'active') {
      return NextResponse.json(
        { 
          error: 'Invalid or inactive API key.', 
          details: keyError?.message || 'No matching active key found' 
        },
        { status: 401 }
      );
    }

    let scopesObj: Record<string, boolean> = {};
    try {
      scopesObj = typeof keyData.scopes === 'string' ? JSON.parse(keyData.scopes) : keyData.scopes;
    } catch (e) {
      scopesObj = {};
    }

    if (!scopesObj || !scopesObj.purchase) {
      return NextResponse.json(
        { error: 'This API key lacks permission to purchase numbers (purchase scope is disabled).' },
        { status: 403 }
      );
    }

    const userId = keyData.user_id;
    const apiKey = process.env.SIM5_API_KEY || process.env.GRIZZLY_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing in server environment variables.' },
        { status: 500 }
      );
    }

    const { defaultMarkup, usdToNgnRate } = await getPricingConfig();

    // Fetch upstream product catalog price first to evaluate wallet balance
    const catalogRes = await fetch(`https://5sim.net/v1/guest/products/${country}/${operator}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const catalogText = await catalogRes.text();
    let catalogData;
    try {
      catalogData = JSON.parse(catalogText);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse provider pricing catalog.' }, { status: 502 });
    }

    const productDetails = catalogData?.[product];
    const baseUsdPrice = Number(productDetails?.Price || productDetails?.cost || productDetails?.price || 0);
    
    if (!productDetails || baseUsdPrice <= 0) {
      return NextResponse.json({ error: 'Selected product is out of stock or unavailable.' }, { status: 400 });
    }

    const finalPrice = Math.ceil(baseUsdPrice * defaultMarkup * usdToNgnRate);

    // Check user wallet balance from the wallets table using supabaseAdmin
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !walletData || Number(walletData.balance) < finalPrice) {
      return NextResponse.json(
        { 
          error: 'Insufficient wallet balance to complete this purchase.',
          details: walletError?.message || `Current wallet balance (${walletData?.balance ?? 'unknown'}) is less than required price (${finalPrice})`
        },
        { status: 400 }
      );
    }

    // Call Upstream Buy Activation Endpoint
    const providerRes = await fetch(`https://5sim.net/v1/user/buy/activation/${country}/${operator}/${product}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const textBody = await providerRes.text();
    if (!providerRes.ok || !textBody) {
      return NextResponse.json(
        { error: 'Upstream provider failed to fulfill the purchase order.', details: textBody },
        { status: 502 }
      );
    }

    let upstreamOrder;
    try {
      upstreamOrder = JSON.parse(textBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Failed to parse provider purchase response payload.' },
        { status: 502 }
      );
    }

    const currentBalance = Number(walletData.balance);
    const newBalance = currentBalance - finalPrice;

    // 1. Deduct user balance in wallets table
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[API BUY] Error updating user wallet balance:', updateError);
    }

    const externalOrderId = String(upstreamOrder.id || upstreamOrder.ID || '');
    const phoneVal = upstreamOrder.phone || upstreamOrder.number || '';
    const expiresVal = upstreamOrder.expires || new Date(Date.now() + 20 * 60 * 1000).toISOString();

    // 2. Insert record into rentals table matching your existing schema
    const rentalRecord = {
      user_id: userId,
      service: product,
      country: country,
      phone_number: phoneVal,
      status: 'pending',
      amount: finalPrice.toFixed(2),
      external_order_id: externalOrderId,
      operator: operator,
      expires_at: expiresVal,
      sms: [],
    };

    const { data: insertedRental, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .insert([rentalRecord])
      .select()
      .single();

    if (rentalError) {
      console.error('[API BUY] Error saving record to rentals table:', rentalError);
    }

    // 3. Log debit entry into transactions table
    const transactionRecord = {
      user_id: userId,
      description: `Virtual number rental for ${product.toUpperCase()} (${country.toUpperCase()})`,
      reference: `rental_${insertedRental?.id || externalOrderId}`,
      type: 'debit',
      amount: finalPrice.toFixed(2),
      balance_after: newBalance.toFixed(2),
      status: 'completed',
    };

    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([transactionRecord]);

    if (txError) {
      console.error('[API BUY] Error logging transaction:', txError);
    }

    // 4. Send an in-app notification to the user
    const notificationRecord = {
      user_id: userId,
      title: 'Number Purchased',
      message: `Successfully purchased a virtual number for ${product.toUpperCase()} for ₦${finalPrice}.`,
      read: false,
    };

    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert([notificationRecord]);

    if (notifError) {
      console.error('[API BUY] Error sending notification:', notifError);
    }

    const responsePayload = {
      id: upstreamOrder.id || upstreamOrder.ID,
      phone: phoneVal,
      operator: operator,
      product: product,
      price: finalPrice,
      status: 'PENDING',
      expires: expiresVal,
      sms: [],
      created_at: insertedRental?.created_at || new Date().toISOString(),
      country: country,
    };

    const response = NextResponse.json(responsePayload, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error: any) {
    console.error('[API BUY ACTIVATION CRITICAL ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing purchase.' },
      { status: 500 }
    );
  }
}


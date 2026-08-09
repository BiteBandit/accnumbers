import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use admin service role to securely bypass RLS restrictions on server-side actions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function getSettingsRates() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    if (error || !data) {
      return { markupMultiplier: 1.0, usdToNgn: 1500.0 };
    }

    let markupMultiplier = 1.0;
    let usdToNgn = 1500.0;

    data.forEach((row: any) => {
      if (row.key === 'markup_multiplier') markupMultiplier = Number(row.value) || 1.0;
      if (row.key === 'usd_to_ngn' || row.key === 'usdt_rate') usdToNgn = Number(row.value) || 1500.0;
    });

    console.log('[API 5SIM BUY] Loaded Settings Rates:', { markupMultiplier, usdToNgn });
    return { markupMultiplier, usdToNgn };
  } catch (err: any) {
    console.error('[API 5SIM BUY] Error loading settings:', err);
    return { markupMultiplier: 1.0, usdToNgn: 1500.0 };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, country, operator, service } = body;

    console.log('[API 5SIM BUY] Incoming purchase request payload:', { userId, country, operator, service });

    if (!userId || !country || !operator || !service) {
      console.warn('[API 5SIM BUY] Validation failed: Missing parameters.');
      return NextResponse.json({ success: false, error: 'Missing required purchase parameters.' }, { status: 400 });
    }

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('[API 5SIM BUY] Wallet lookup error:', walletError);
      return NextResponse.json({ success: false, error: 'Wallet not found for user.' }, { status: 404 });
    }

    const { markupMultiplier, usdToNgn } = await getSettingsRates();

    // Clean and sanitize API key from env
    const rawApiKey = 
      process.env.SIM5_API_KEY || 
      process.env.GRIZZLY_API_KEY || 
      process.env.SIM5_KEY || 
      process.env.NEXT_PUBLIC_SIM5_API_KEY || '';

    const SIM5_API_KEY = rawApiKey.trim().replace(/^["'](.+)["']$/, '$1');

    if (!SIM5_API_KEY) {
      console.error('[API 5SIM BUY] CRITICAL: No 5SIM API key found in environment variables.');
      return NextResponse.json({ success: false, error: 'API key is missing in server environment variables.' }, { status: 500 });
    }

    console.log(`[API 5SIM BUY] API Key verified (Length: ${SIM5_API_KEY.length}, Starts with: ${SIM5_API_KEY.substring(0, 6)}...)`);

    const sim5Endpoint = `https://5sim.net/v1/user/buy/activation/${country}/${operator}/${service}`;
    console.log(`[API 5SIM BUY] Dispatching fetch request to 5SIM endpoint: ${sim5Endpoint}`);

    const sim5Response = await fetch(sim5Endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SIM5_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log(`[API 5SIM BUY] 5SIM Response Status Code: ${sim5Response.status} ${sim5Response.statusText}`);

    const responseText = await sim5Response.text();
    console.log('[API 5SIM BUY] Raw 5SIM Response Text Sample:', responseText.substring(0, 400));

    if (!sim5Response.ok || !responseText || responseText.trim() === '' || responseText.startsWith('<!DOCTYPE')) {
      console.error('[API 5SIM BUY] Upstream provider rejected request or returned HTML page instead of JSON.');
      return NextResponse.json({ 
        success: false, 
        error: `5SIM Error (${sim5Response.status}): Provider rejected order or out of stock.` 
      }, { status: 400 });
    }

    let orderData;
    try {
      orderData = JSON.parse(responseText);
    } catch (e) {
      console.error('[API 5SIM BUY] JSON Parse Failed. Non-JSON response received:', responseText);
      const cleanMessage = responseText.trim() === 'no free phones' 
        ? 'No free numbers currently available for this operator. Please try another one.' 
        : responseText;
        
      return NextResponse.json({ success: false, error: cleanMessage }, { status: 400 });
    }

    if (!orderData || !orderData.phone) {
      console.error('[API 5SIM BUY] 5SIM JSON payload missing phone number:', orderData);
      return NextResponse.json({ success: false, error: '5SIM returned no active phone number structure.' }, { status: 400 });
    }

    const baseUsdCost = Number(orderData.price) || 0;
    const finalUsdPrice = Number((baseUsdCost * markupMultiplier).toFixed(2));
    const finalNairaPrice = Math.ceil(finalUsdPrice * usdToNgn);

    console.log(`[API 5SIM BUY] Pricing Calculated -> Base USD: ${baseUsdCost}, Final USD: ${finalUsdPrice}, Final NGN: ${finalNairaPrice}`);
    console.log(`[API 5SIM BUY] User Wallet Balance: ${wallet.balance}`);

    if (Number(wallet.balance) < finalNairaPrice) {
      console.warn('[API 5SIM BUY] Insufficient wallet balance for user.');
      return NextResponse.json({ success: false, error: 'Insufficient wallet balance for this purchase.' }, { status: 400 });
    }

    const newBalance = Number(wallet.balance) - finalNairaPrice;

    // 1. Update wallet balance
    const { error: updateWalletError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateWalletError) {
      console.error('[API 5SIM BUY] Failed to update wallet balance in Supabase:', updateWalletError);
      return NextResponse.json({ success: false, error: 'Failed to update wallet balance.' }, { status: 500 });
    }

    // 2. Insert rental record
    const { data: rentalRecord, error: rentalError } = await supabaseAdmin
      .from('rentals')
      .insert({
        user_id: userId,
        service: service,
        country: country,
        operator: operator,
        phone_number: orderData.phone,
        amount: finalNairaPrice,
        status: orderData.status || 'pending',
        external_order_id: orderData.id ? orderData.id.toString() : null,
      })
      .select()
      .single();

    if (rentalError) {
      console.error('[API 5SIM BUY] Failed to insert rental record into Supabase:', rentalError);
      return NextResponse.json({ success: false, error: 'Failed to save rental session.' }, { status: 500 });
    }

    // 3. Log debit transaction entry with balance_after tracking
    const { error: txError } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      type: 'debit',
      amount: finalNairaPrice,
      balance_after: newBalance,
      description: `Virtual number rental for ${service.toUpperCase()} (${country.toUpperCase()})`,
      status: 'completed',
      reference: `rental_${rentalRecord.id}`,
      created_at: new Date().toISOString()
    });

    if (txError) {
      console.error('[API 5SIM BUY] Warning: Failed to log transaction entry:', txError);
    }

    // 4. Push notification entry for the user
    const { error: notifError } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: 'Number Purchased',
      message: `Successfully purchased a virtual number for ${service.toUpperCase()} for ₦${finalNairaPrice.toLocaleString()}.`,
      read: false,
      created_at: new Date().toISOString()
    });

    if (notifError) {
      console.error('[API 5SIM BUY] Warning: Failed to send notification entry:', notifError);
    }

    console.log('[API 5SIM BUY] Purchase successful! Created rental ID:', rentalRecord.id);

    return NextResponse.json({ 
      success: true, 
      rentalId: rentalRecord.id,
      provider: '5sim',
      order: orderData,
      pricing: {
        baseUsdCost,
        finalUsdPrice,
        finalNairaPrice
      }
    });

  } catch (error: any) {
    console.error('[API 5SIM BUY CRITICAL ERROR]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error.' }, { status: 500 });
  }
}


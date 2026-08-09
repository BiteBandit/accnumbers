import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, email, reference, user_id, promo_code_id, bonus_amount } = body;

    if (!amount || !email || !reference || !user_id) {
      return NextResponse.json({ error: 'Missing required payment fields.' }, { status: 400 });
    }

    let validatedBonus = 0;
    let validatedPromoId = null;

    if (promo_code_id) {
      const { data: promoData, error: promoError } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .eq('id', promo_code_id)
        .eq('is_active', true)
        .single();

      if (!promoError && promoData) {
        if (amount >= promoData.min_deposit) {
          if (promoData.max_uses === null || promoData.uses_count < promoData.max_uses) {
            validatedPromoId = promoData.id;
            if (promoData.discount_type === 'percentage') {
              validatedBonus = (amount * promoData.discount_value) / 100;
            } else {
              validatedBonus = promoData.discount_value;
            }
          }
        }
      }
    }

    // Fetch current wallet balance to satisfy the balance_after constraint
    const { data: walletData } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user_id)
      .single();

    const currentBalance = walletData?.balance || 0;

    // 1. Insert the pending transaction row with the current balance
    const { error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id,
        type: 'credit',
        amount,
        reference,
        status: 'pending',
        balance_after: currentBalance,
        description: validatedBonus > 0 
          ? `Paystack Deposit (₦${amount}) + Bonus (₦${validatedBonus})`
          : `Paystack Deposit (₦${amount})`
      });

    if (insertError) {
      console.error('Failed to create transaction row:', insertError);
      return NextResponse.json({ error: 'Failed to initialize transaction record.' }, { status: 500 });
    }

    // 2. Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/wallet/verify`,
        metadata: {
          user_id,
          promo_code_id: validatedPromoId,
          bonus_amount: validatedBonus,
          original_amount: amount
        }
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      // If Paystack fails, update transaction status to failed
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('reference', reference);

      return NextResponse.json({ error: paystackData.message || 'Payment initialization failed.' }, { status: 400 });
    }

    return NextResponse.json({
      checkout_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    });

  } catch (err: any) {
    console.error('Initialize payment error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}


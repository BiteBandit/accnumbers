import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Missing reference' }, { status: 400 });
    }

    // Verify transaction with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ success: false, error: 'Transaction was not successful on Paystack' });
    }

    const txDetails = paystackData.data;
    
    // Extract metadata values sent during initialization
    const metadata = txDetails.metadata || {};
    const promoCodeId = metadata.promo_code_id;
    const bonusAmount = Number(metadata.bonus_amount) || 0;

    // Use strictly original_amount from metadata without a hardcoded fallback value
    const amountPaid = Number(metadata.original_amount) || 0;

    if (amountPaid <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid deposit amount in metadata' }, { status: 400 });
    }

    const userEmail = txDetails.customer.email;

    // Find user ID from email
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const currentUser = userData?.users.find((u) => u.email === userEmail);

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
    }

    // Check if transaction was already processed
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    if (existingTx && existingTx.status === 'success') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Calculate total credit including any promotional bonus
    const totalCreditAmount = amountPaid + bonusAmount;

    // Fetch current wallet balance
    const { data: walletData } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', currentUser.id)
      .single();

    const currentBalance = walletData?.balance || 0;
    const newBalance = currentBalance + totalCreditAmount;

    // Update wallet balance with base amount + bonus
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', currentUser.id);

    // Update transaction record status and balance_after
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'success',
        balance_after: newBalance
      })
      .eq('reference', reference);

    // If a promo code was successfully used, increment its uses_count in the database
    if (promoCodeId) {
      const { data: promoRecord } = await supabaseAdmin
        .from('promo_codes')
        .select('uses_count')
        .eq('id', promoCodeId)
        .single();

      if (promoRecord) {
        await supabaseAdmin
          .from('promo_codes')
          .update({ uses_count: (promoRecord.uses_count || 0) + 1 })
          .eq('id', promoCodeId);
      }
    }

    // Create an entry in the notifications table including bonus information if applicable
    const notificationMessage = bonusAmount > 0
      ? `Your deposit of ₦${amountPaid.toLocaleString()} via Paystack plus a promo bonus of ₦${bonusAmount.toLocaleString()} has been confirmed and added to your balance.`
      : `Your deposit of ₦${amountPaid.toLocaleString()} via Paystack has been confirmed and added to your balance.`;

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: currentUser.id,
        title: 'Wallet Credited Successfully',
        message: notificationMessage,
        read: false
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


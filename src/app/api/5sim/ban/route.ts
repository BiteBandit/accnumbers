import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { rentalId, externalOrderId, userId, amount } = await request.json();

    if (!externalOrderId || !userId || !rentalId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.SIM5_API_KEY;
    
    // 1. Call 5SIM ban API endpoint
    const response = await fetch(`https://5sim.net/v1/user/ban/${externalOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.warn('5SIM ban provider notice:', responseText);
    }

    // 2. ATOMIC GUARD: Update status to 'banned' ONLY if it's not already terminal
    const terminalStatuses = ['banned', 'CANCELED', 'CANCELLED', 'expired', 'timeout', 'finished', 'COMPLETED'];
    
    const { data: updatedRental, error: rentalUpdateError } = await supabaseAdmin
      .from('rentals')
      .update({ status: 'banned', updated_at: new Date().toISOString() })
      .eq('id', rentalId)
      .not('status', 'in', `(${terminalStatuses.map(s => `"${s}"`).join(',')})`)
      .select()
      .maybeSingle();

    // If update failed or row was already processed, reject early to stop double-processing
    if (rentalUpdateError || !updatedRental) {
      return NextResponse.json({ 
        success: false, 
        error: 'This order has already been processed and refunded.' 
      }, { status: 400 });
    }

    // 3. Refund user wallet securely with a unique transaction reference guard
    const refundAmount = Number(amount || 0);
    const refundReference = `REFUND-BAN-${externalOrderId}`;

    if (refundAmount > 0) {
      const { data: existingTx } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('reference', refundReference)
        .maybeSingle();

      if (!existingTx) {
        const { data: walletData, error: walletFetchError } = await supabaseAdmin
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (!walletFetchError && walletData) {
          const currentBalance = Number(walletData.balance || 0);
          const newBalance = currentBalance + refundAmount;

          const { error: txInsertError } = await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            type: 'refund',
            amount: refundAmount,
            balance_after: newBalance,
            description: `Refund for banned virtual number rental`,
            reference: refundReference,
            status: 'success',
            created_at: new Date().toISOString()
          });

          if (txInsertError) {
            if (txInsertError.code === '23505') {
              console.log(`[Ban API] 🛡️ Race condition caught: Duplicate ban refund blocked by unique constraint.`);
            } else {
              throw new Error(`Failed to log ban transaction: ${txInsertError.message}`);
            }
          } else {
            const { error: walletUpdateError } = await supabaseAdmin
              .from('wallets')
              .update({ balance: newBalance, updated_at: new Date().toISOString() })
              .eq('user_id', userId);

            if (walletUpdateError) {
              throw new Error(`Failed to update wallet balance: ${walletUpdateError.message}`);
            }

            await supabaseAdmin.from('notifications').insert({
              user_id: userId,
              title: 'Number Banned & Refunded',
              message: `Your banned number order was closed. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
              read: false,
              created_at: new Date().toISOString()
            });
          }
        }
      } else {
        console.log(`[Ban API] 🛡️ Duplicate ban refund attempt blocked for reference: ${refundReference}`);
      }
    }

    return NextResponse.json({ success: true, providerResponse: responseText });
  } catch (err: any) {
    console.error('Ban route exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}


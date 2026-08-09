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

    const apiKey = process.env.SIM5_API_KEY || process.env.NEXT_PUBLIC_SIM5_API_KEY;
    
    // 1. Attempt cancellation on the 5SIM provider side
    const response = await fetch(`https://5sim.net/v1/user/cancel/${externalOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();

    // 2. If 5SIM rejects because it's already finished/expired/cancelled, 
    // we still want to sync our database so the user isn't stuck.
    const isAlreadyProcessedError = 
      !response.ok && (
        responseText.includes('1') || 
        response.status === 400
      );

    if (!response.ok && !isAlreadyProcessedError) {
      console.error('5SIM Cancel Rejection:', responseText);
      return NextResponse.json({ 
        success: false, 
        error: `5SIM failed to cancel order: ${responseText}` 
      }, { status: 400 });
    }

    // 3. ATOMIC GUARD: Update status to 'cancelled' ONLY if it's not already terminal
    const terminalStatuses = ['cancelled', 'CANCELED', 'banned', 'expired', 'timeout', 'finished', 'COMPLETED'];
    
    const { data: updatedRental, error: rentalUpdateError } = await supabaseAdmin
      .from('rentals')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', rentalId)
      .not('status', 'in', `(${terminalStatuses.map(s => `"${s}"`).join(',')})`)
      .select()
      .maybeSingle();

    if (rentalUpdateError || !updatedRental) {
      return NextResponse.json({ 
        success: false, 
        error: 'This order has already been processed or closed.' 
      }, { status: 400 });
    }

    // 4. Refund the user's wallet securely with a unique transaction reference guard
    const refundAmount = Number(amount || 0);
    const refundReference = `REFUND-CANCEL-${externalOrderId}`;

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
            description: `Refund for cancelled virtual number rental`,
            reference: refundReference,
            status: 'success',
            created_at: new Date().toISOString()
          });

          if (txInsertError) {
            if (txInsertError.code === '23505') {
              console.log(`[Cancel API] 🛡️ Race condition caught: Duplicate cancel refund blocked by unique constraint.`);
            } else {
              throw new Error(`Failed to log cancel transaction: ${txInsertError.message}`);
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
              title: 'Number Cancelled & Refunded',
              message: `Your order was cancelled successfully. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
              read: false,
              created_at: new Date().toISOString()
            });
          }
        }
      } else {
        console.log(`[Cancel API] 🛡️ Duplicate cancel refund attempt blocked for reference: ${refundReference}`);
      }
    }

    return NextResponse.json({ success: true, providerResponse: responseText });
  } catch (err: any) {
    console.error('Cancel route exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}


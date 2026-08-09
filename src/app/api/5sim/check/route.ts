import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      console.log('[5SIM Check API] ❌ Error: Missing order ID parameter');
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 });
    }

    // 1. Fetch the rental record from Supabase
    let query = supabaseAdmin.from('rentals').select('*');
    if (!isNaN(Number(orderId))) {
      query = query.or(`external_order_id.eq.${orderId},idx.eq.${Number(orderId)}`);
    } else {
      query = query.eq('id', orderId);
    }

    const { data: rentalRecord, error: dbError } = await query.maybeSingle();

    if (dbError || !rentalRecord) {
      console.error('[5SIM Check API] ❌ Database fetch error or record not found:', dbError);
      return NextResponse.json({ success: false, error: 'Rental order not found in database' }, { status: 404 });
    }

    const queryOrderId = rentalRecord.external_order_id || orderId;
    const apiKey = process.env.SIM5_API_KEY || process.env.NEXT_PUBLIC_SIM5_API_KEY;

    // 2. Call 5SIM check order endpoint
    const response = await fetch(`https://5sim.net/v1/user/check/${queryOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[5SIM Check API] ❌ 5SIM API error: ${errorText}`);
      return NextResponse.json({ success: false, error: `5SIM check failed: ${errorText}` }, { status: 400 });
    }

    const orderData = await response.json();
    console.log('[5SIM Check API] 📥 Raw 5SIM response:', JSON.stringify(orderData));

    // 3. Extract SMS and OTP Code via Regex safely
    const smsArray = orderData.sms || [];
    let extractedCode = rentalRecord.sms_code || null;
    
    if (Array.isArray(smsArray) && smsArray.length > 0) {
      const latestMsg = smsArray[smsArray.length - 1];
      const messageText = typeof latestMsg === 'string' ? latestMsg : (latestMsg?.text || latestMsg?.message || '');
      const match = messageText.match(/\b\d{4,8}\b/);
      if (match) {
        extractedCode = match[0];
      }
    }

    // 4. SAFE STATUS MAPPING: Prevent premature "received"/"finished" if no SMS exists yet
    const rawProviderStatus = orderData.status || 'pending';
    let directStatus = rawProviderStatus.toLowerCase();

    if ((directStatus === 'received' || directStatus === 'finished') && (!smsArray || smsArray.length === 0)) {
      console.log(`[5SIM Check API] ⚠️ Provider returned "${rawProviderStatus}" but SMS array is empty. Forcing status to "pending".`);
      directStatus = 'pending';
    }

    console.log(`[5SIM Check API] 🔄 Status from 5SIM: "${rawProviderStatus}" -> Saved as: "${directStatus}"`);

    const previousStatus = rentalRecord.status?.toLowerCase() || 'pending';

    // 5. Update database directly
    const updatePayload: any = {
      status: directStatus,
      sms: smsArray,
      sms_code: extractedCode,
    };

    if (orderData.expires) {
      updatePayload.expires_at = orderData.expires;
    }

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('rentals')
      .update(updatePayload)
      .eq('id', rentalRecord.id)
      .select();

    if (updateError) {
      console.error('[5SIM Check API] ❌ Failed to update Supabase:', updateError);
    } else {
      console.log(`[5SIM Check API] ✅ Supabase update result snapshot:`, JSON.stringify(updatedRows));
    }

    // 6. Handle automatic refunds for refundable terminal states (timeout, expired, cancelled, banned)
    const terminalRefundableStates = ['timeout', 'expired', 'canceled', 'cancelled', 'banned'];
    const isSystemRefundable = terminalRefundableStates.includes(directStatus);
    
    // Check if previous status wasn't already a terminal state to prevent repeating refunds on already processed rows
    const previousWasTerminal = terminalRefundableStates.includes(previousStatus) || ['finished', 'completed'].includes(previousStatus);

    if (!previousWasTerminal && isSystemRefundable && rentalRecord.user_id) {
      const serviceName = rentalRecord.service || 'Virtual Number';
      const rentalAmount = Number(rentalRecord.amount || 0);
      const refundReference = `REFUND-AUTO-${directStatus.toUpperCase()}-${queryOrderId}`;

      if (rentalAmount > 0) {
        // CRITICAL DUPLICATE CHECK: Look up transactions database first before modifying balance
        const { data: existingTx } = await supabaseAdmin
          .from('transactions')
          .select('id')
          .eq('reference', refundReference)
          .maybeSingle();

        if (!existingTx) {
          console.log(`[5SIM Check API] 💸 Processing secure automatic refund for status "${directStatus}" (Amount: ${rentalAmount})...`);

          // Fetch fresh wallet balance right before execution
          const { data: walletData, error: walletFetchError } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('user_id', rentalRecord.user_id)
            .single();

          if (walletFetchError || !walletData) {
            console.error('[5SIM Check API] ❌ Failed to fetch wallet for refund:', walletFetchError);
          } else {
            const currentBalance = Number(walletData.balance || 0);
            const newBalance = currentBalance + rentalAmount;

            const { error: txInsertError } = await supabaseAdmin.from('transactions').insert({
              user_id: rentalRecord.user_id,
              type: 'refund',
              amount: rentalAmount,
              balance_after: newBalance,
              description: `Refund for ${serviceName} rental status: ${directStatus}`,
              reference: refundReference,
              status: 'success',
              created_at: new Date().toISOString()
            });

            // Handle database-level Unique Constraint Violation (PostgreSQL Error Code '23505')
            if (txInsertError) {
              if (txInsertError.code === '23505') {
                console.log(`[5SIM Check API] 🛡️ Race condition caught: Duplicate refund blocked by database unique constraint.`);
              } else {
                console.error('[5SIM Check API] ❌ Transaction insert failed:', txInsertError);
              }
            } else {
              // Update the wallets table balance only if transaction log succeeded
              const { error: walletUpdateError } = await supabaseAdmin
                .from('wallets')
                .update({ 
                  balance: newBalance,
                  updated_at: new Date().toISOString() 
                })
                .eq('user_id', rentalRecord.user_id);

              if (walletUpdateError) {
                console.error('[5SIM Check API] ❌ Failed to update wallet balance:', walletUpdateError);
              } else {
                // Send notification
                await supabaseAdmin.from('notifications').insert({
                  user_id: rentalRecord.user_id,
                  title: `Rental Refund (${directStatus.toUpperCase()})`,
                  message: `Your order for ${serviceName} ended with status "${directStatus}". Funds of ₦${rentalAmount.toLocaleString()} have been refunded to your wallet.`,
                  read: false,
                  created_at: new Date().toISOString()
                });

                console.log(`[5SIM Check API] ✅ Automatic refund successfully processed. Previous Balance: ${currentBalance} + Refund: ${rentalAmount} = New Wallet Balance: ${newBalance}`);
              }
            }
          }
        } else {
          console.log(`[5SIM Check API] 🛡️ Duplicate refund attempt blocked for reference: ${refundReference}`);
        }
      }
    }

    let expiresAt = rentalRecord.expires_at;
    if (!expiresAt && orderData.expires) {
      expiresAt = orderData.expires;
    } else if (!expiresAt && rentalRecord.created_at) {
      const createdAtMs = new Date(rentalRecord.created_at).getTime();
      expiresAt = new Date(createdAtMs + 20 * 60 * 1000).toISOString();
    }

    return NextResponse.json({
      success: true,
      status: directStatus,
      rawStatus: orderData.status,
      sms: smsArray,
      sms_code: extractedCode,
      price: orderData.price,
      expires: expiresAt || null,
    });
  } catch (err: any) {
    console.error('[5SIM Check API] 💥 Critical Exception Caught:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}


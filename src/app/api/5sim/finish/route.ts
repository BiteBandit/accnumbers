import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { rentalId, externalOrderId } = await request.json();

    if (!externalOrderId || !rentalId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.SIM5_API_KEY;
    
    // Call 5SIM finish API endpoint
    const response = await fetch(`https://5sim.net/v1/user/finish/${externalOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.warn('5SIM finish provider notice:', responseText);
    }

    // Update local rental status to 'finished'
    const { error: rentalUpdateError } = await supabaseAdmin
      .from('rentals')
      .update({ status: 'finished' })
      .eq('id', rentalId);

    if (rentalUpdateError) {
      throw new Error(`Failed to update rental status: ${rentalUpdateError.message}`);
    }

    return NextResponse.json({ success: true, providerResponse: responseText });
  } catch (err: any) {
    console.error('Finish route exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.SIM5_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ success: false, balance: 'API Key Missing' }, { status: 400 });
  }

  try {
    const response = await fetch('https://5sim.net/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to communicate with 5sim API');
    }

    const data = await response.json();
    const balanceVal = data.balance ?? data.money ?? 0;

    return NextResponse.json({ 
      success: true, 
      balance: `$${balanceVal}` // Preserves all exact decimal digits returned by the API
    });
  } catch (error: any) {
    console.error('5sim balance check error:', error);
    return NextResponse.json({ success: false, balance: 'Connection Error' }, { status: 500 });
  }
}


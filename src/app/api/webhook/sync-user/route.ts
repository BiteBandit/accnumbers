import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Supabase webhook payload structure for an INSERT event
    if (payload.type !== 'INSERT' || !payload.record) {
      return NextResponse.json({ message: 'Ignored event type' }, { status: 200 });
    }

    const { email, display_name } = payload.record;

    if (!email) {
      return NextResponse.json({ error: 'No email found in record' }, { status: 400 });
    }

    // Call Resend to create the contact
    const { data, error } = await resend.contacts.create({
      email,
      firstName: display_name || '',
      lastName: '',
      unsubscribed: false,
    });

    if (error) {
      console.error('Resend sync error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


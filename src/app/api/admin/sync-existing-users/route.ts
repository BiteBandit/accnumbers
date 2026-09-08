import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase with your service role key so you can read all profiles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch all existing users from your public.profiles table
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('email, display_name');

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles found to sync.' });
    }

    const results = [];

    // 2. Loop through each profile and add them to Resend using display_name mapped to firstName
    for (const profile of profiles) {
      if (!profile.email) continue;

      const { data, error } = await resend.contacts.create({
        email: profile.email,
        firstName: profile.display_name || '',
        unsubscribed: false,
      });

      results.push({ email: profile.email, success: !error, error: error?.message });
    }

    return NextResponse.json({ 
      message: `Processed ${profiles.length} profiles.`, 
      results 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


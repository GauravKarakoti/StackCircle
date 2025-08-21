import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import cron from 'node-cron';

// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // <-- Add this
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseAnonKey || !resendApiKey || !supabaseServiceKey) { // <-- Add service key check
  throw new Error(
    'Supabase URL, Anon Key, Service Key, and Resend API Key must be provided'
  );
}

// Client for public, RLS-protected access (e.g., for GET requests)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client that bypasses RLS for server-side operations (e.g., for POST requests)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); // <-- Create admin client

const resend = new Resend(resendApiKey);

/**
 * Handle GET requests to fetch subscription status
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const circleId = searchParams.get('circleId');

    if (!walletAddress || !circleId) {
        return NextResponse.json({ error: 'Missing walletAddress or circleId' }, { status: 400 });
    }

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('wallet_address', walletAddress)
            .single();

        if (userError && userError.code !== 'PGRST116') throw userError;
        
        if (!user) {
            return NextResponse.json({ isSubscribed: false });
        }

        const { data: reminder, error: reminderError } = await supabase
            .from('reminders')
            .select('settings, is_active')
            .eq('user_id', user.id)
            .eq('circle_id', circleId)
            .single();
        
        if (reminderError && reminderError.code !== 'PGRST116') throw reminderError;

        if (reminder && reminder.is_active) {
            return NextResponse.json({ isSubscribed: true, settings: reminder.settings });
        }

        return NextResponse.json({ isSubscribed: false });

    } catch (error) {
        console.error('API GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


/**
 * Handle POST requests to create/update reminders
 */
export async function POST(request) {
  try {
    const { circleId, isSubscribed, settings, walletAddress } = await request.json();

    if (!circleId || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use the supabaseAdmin client to bypass RLS
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      const { data: newUser, error: newUserError } = await supabaseAdmin // <-- Use ADMIN client
        .from('users')
        .insert([{ wallet_address: walletAddress, email: settings.email }])
        .select('id')
        .single();
      if (newUserError) throw newUserError;
      user = newUser;
    }

    // Use the supabaseAdmin client for upsert/update
    if (isSubscribed) {
      const { error: upsertError } = await supabaseAdmin // <-- Use ADMIN client
        .from('reminders')
        .upsert({
            user_id: user.id,
            circle_id: circleId,
            settings,
            is_active: true,
        }, { onConflict: ['user_id', 'circle_id'] });
      if (upsertError) throw upsertError;
    } else {
      const { error: updateError } = await supabaseAdmin // <-- Use ADMIN client
        .from('reminders')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('circle_id', circleId);
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reminder API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// This cron job will run at 9:00 AM every day.
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminder cron job...');
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(`
        *,
        users (
            email,
            wallet_address
        )
    `)
    .eq('is_active', true)
    .eq('settings->>frequency', 'daily');

  if (error) {
      console.error('Error fetching daily reminders:', error);
      return;
  }
  
  if (reminders) {
    for (const reminder of reminders) {
      await sendReminderEmail(reminder);
    }
  }
});

async function sendReminderEmail(reminder) {
  const user = reminder.users;
  if (!user || !user.email) {
      console.log(`Skipping reminder for user_id ${reminder.user_id} due to missing email.`);
      return;
  }

  const { settings, circle_id } = reminder;
  let subject = `Your Daily Digest for Savings Circle #${circle_id}`;
  let body = `
    <html>
      <body>
        <h2>Hi there!</h2>
        <p>Here are your reminders for Savings Circle #${circle_id}:</p>
        <ul>
            ${settings.contribution ? '<li>A contribution is due soon. Don\'t forget to stack!</li>' : ''}
            ${settings.proposal ? '<li>There are new governance proposals to vote on.</li>' : ''}
            ${settings.streak ? '<li>Keep up your contribution streak! You are doing great.</li>' : ''}
        </ul>
        <p>You can manage your notification settings at any time.</p>
        <p>Happy Stacking!</p>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Citrea Reminders <reminders@yourdomain.com>', // Replace with your verified domain
      to: user.email,
      subject: subject,
      html: body,
    });
    console.log(`Sent daily reminder to ${user.email} for circle ${circle_id}`);
  } catch (error) {
    console.error(`Failed to send email to ${user.email}:`, error);
  }
}
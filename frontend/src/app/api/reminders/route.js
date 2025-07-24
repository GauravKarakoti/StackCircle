import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key must be provided in environment variables'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Handle POST requests to create/update reminders
 */
export async function POST(request) {
  try {
    const { circleId, isSubscribed, settings, walletAddress } = await request.json();

    if (!circleId || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    // Supabase returns error code PGRST116 when no row is found
    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .insert([{ wallet_address: walletAddress }])
        .select('id')
        .single();
      if (newUserError) throw newUserError;
      user = newUser;
    }

    // Update subscription
    if (isSubscribed) {
      const { error: upsertError } = await supabase
        .from('reminders')
        .upsert(
          {
            user_id: user.id,
            circle_id: circleId,
            settings,
            is_active: true,
          },
          { onConflict: ['user_id', 'circle_id'] }
        );
      if (upsertError) throw upsertError;
    } else {
      const { error: updateError } = await supabase
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
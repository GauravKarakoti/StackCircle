-- Drop tables if they exist to start fresh (optional, for development)
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS users;

-- Create a table for users to store their wallet address and email
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT, -- Storing email for sending notifications
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a table for reminder subscriptions
CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circle_id INTEGER NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- A user can only have one reminder setting per circle
  UNIQUE(user_id, circle_id)
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before any update on the reminders table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON reminders
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Enable Row Level Security (RLS) for the tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies to allow users to manage their own data
-- Note: These are basic policies. You should tailor them to your specific security needs.

-- Users can view their own user record
CREATE POLICY "Allow individual user read access" ON users
FOR SELECT USING (auth.jwt() ->> 'address' = wallet_address);

-- Users can update their own email
CREATE POLICY "Allow individual user update access" ON users
FOR UPDATE USING (auth.jwt() ->> 'address' = wallet_address);

-- Users can manage their own reminder settings
CREATE POLICY "Allow individual user access to their reminders" ON reminders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = reminders.user_id
    AND users.wallet_address = (auth.jwt() ->> 'address')
  )
);
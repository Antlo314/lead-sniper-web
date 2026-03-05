-- Run this snippet in your Supabase SQL Editor to initialize the Lead Sniper CRM

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  original_link text UNIQUE NOT NULL,
  platform text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  published timestamp with time zone NOT NULL,
  score integer DEFAULT 0,
  extracted_budget text,
  pitch text,
  stage text DEFAULT 'Saved',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: RLS (Row Level Security) is disabled by default for rapid MVP development.
-- For production, you should enable RLS and wrap the table to standard auth.users.

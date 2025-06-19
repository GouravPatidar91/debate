
-- Create debate_requests table to handle user-to-user debate invitations
CREATE TABLE public.debate_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users,
  receiver_id UUID NOT NULL REFERENCES auth.users,
  topic TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_presence table to track online users
CREATE TABLE public.user_presence (
  user_id UUID NOT NULL REFERENCES auth.users PRIMARY KEY,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'in_debate')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active_debates table to track ongoing debates between users
CREATE TABLE public.active_debates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL REFERENCES auth.users,
  participant_2_id UUID NOT NULL REFERENCES auth.users,
  topic TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  winner_id UUID REFERENCES auth.users,
  debate_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for debate_requests
ALTER TABLE public.debate_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view their debate requests" 
  ON public.debate_requests 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create debate requests
CREATE POLICY "Users can create debate requests" 
  ON public.debate_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Users can update requests they received (accept/decline)
CREATE POLICY "Users can update received requests" 
  ON public.debate_requests 
  FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- Enable RLS for user_presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view presence data
CREATE POLICY "Authenticated users can view presence" 
  ON public.user_presence 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Users can update their own presence
CREATE POLICY "Users can update their own presence" 
  ON public.user_presence 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Enable RLS for active_debates
ALTER TABLE public.active_debates ENABLE ROW LEVEL SECURITY;

-- Users can view debates they participate in
CREATE POLICY "Users can view their debates" 
  ON public.active_debates 
  FOR SELECT 
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Users can create debates they participate in
CREATE POLICY "Users can create their debates" 
  ON public.active_debates 
  FOR INSERT 
  WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Users can update debates they participate in
CREATE POLICY "Users can update their debates" 
  ON public.active_debates 
  FOR UPDATE 
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Enable real-time for all tables
ALTER TABLE public.debate_requests REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER TABLE public.active_debates REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.debate_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_debates;

-- Function to automatically update user presence on auth changes
CREATE OR REPLACE FUNCTION public.handle_user_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, is_online, last_seen)
  VALUES (new.id, true, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_online = true,
    last_seen = now(),
    updated_at = now();
  RETURN new;
END;
$$;

-- Trigger to update presence when user signs in
CREATE TRIGGER on_auth_user_presence
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_presence();


-- Create a table to store user profiles (extended from auth)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Create a table to store debate results
CREATE TABLE public.debate_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  duration INTEGER NOT NULL, -- in seconds
  metrics JSONB NOT NULL, -- store all metrics as JSON
  comparison JSONB NOT NULL, -- store comparison data as JSON
  improvements TEXT[] NOT NULL, -- array of improvement suggestions
  topic TEXT,
  debate_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for leaderboard entries (aggregated data)
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_debates INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  last_match_score INTEGER,
  last_debate_date TIMESTAMP WITH TIME ZONE,
  rank INTEGER,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for debate_results
CREATE POLICY "Users can view own debate results" ON public.debate_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debate results" ON public.debate_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debate results" ON public.debate_results FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for leaderboard_entries
CREATE POLICY "Everyone can view leaderboard" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Users can update own leaderboard entry" ON public.leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leaderboard entry" ON public.leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update leaderboard when debate result is shared
CREATE OR REPLACE FUNCTION public.update_leaderboard_on_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_profile public.profiles%ROWTYPE;
  current_entry public.leaderboard_entries%ROWTYPE;
  new_total_score INTEGER;
  new_total_debates INTEGER;
  new_wins INTEGER;
  new_win_rate NUMERIC(5,2);
BEGIN
  -- Only process if the result is being marked as shared
  IF NEW.is_shared = true AND OLD.is_shared = false THEN
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE id = NEW.user_id;
    
    -- Get current leaderboard entry or create default values
    SELECT * INTO current_entry FROM public.leaderboard_entries WHERE user_id = NEW.user_id;
    
    IF current_entry IS NULL THEN
      -- Create new leaderboard entry
      new_total_score := NEW.score;
      new_total_debates := 1;
      new_wins := CASE WHEN NEW.score >= 70 THEN 1 ELSE 0 END;
      new_win_rate := CASE WHEN NEW.score >= 70 THEN 100.00 ELSE 0.00 END;
      
      INSERT INTO public.leaderboard_entries (
        user_id, username, total_score, total_debates, wins, win_rate,
        last_match_score, last_debate_date, trend
      ) VALUES (
        NEW.user_id,
        user_profile.display_name,
        new_total_score,
        new_total_debates,
        new_wins,
        new_win_rate,
        NEW.score,
        NEW.debate_date,
        CASE WHEN NEW.score >= 70 THEN 'up' ELSE 'down' END
      );
    ELSE
      -- Update existing leaderboard entry
      new_total_score := current_entry.total_score + NEW.score;
      new_total_debates := current_entry.total_debates + 1;
      new_wins := current_entry.wins + CASE WHEN NEW.score >= 70 THEN 1 ELSE 0 END;
      new_win_rate := (new_wins::NUMERIC / new_total_debates::NUMERIC) * 100;
      
      UPDATE public.leaderboard_entries
      SET 
        total_score = new_total_score,
        total_debates = new_total_debates,
        wins = new_wins,
        win_rate = new_win_rate,
        last_match_score = NEW.score,
        last_debate_date = NEW.debate_date,
        trend = CASE 
          WHEN NEW.score > COALESCE(last_match_score, 0) THEN 'up'
          WHEN NEW.score < COALESCE(last_match_score, 0) THEN 'down'
          ELSE 'stable'
        END,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
    
    -- Update ranks for all users
    WITH ranked_users AS (
      SELECT 
        user_id,
        ROW_NUMBER() OVER (ORDER BY total_score DESC, win_rate DESC, total_debates DESC) as new_rank
      FROM public.leaderboard_entries
    )
    UPDATE public.leaderboard_entries 
    SET rank = ranked_users.new_rank
    FROM ranked_users 
    WHERE leaderboard_entries.user_id = ranked_users.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update leaderboard when debate result is shared
CREATE TRIGGER on_debate_result_shared
  AFTER UPDATE ON public.debate_results
  FOR EACH ROW EXECUTE FUNCTION public.update_leaderboard_on_share();

-- Enable realtime for leaderboard updates
ALTER TABLE public.leaderboard_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_entries;

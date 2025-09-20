-- Daily Streak Leaderboard Table Creation
-- Copy and paste this into your Supabase SQL Editor

-- Create daily_streak_leaderboard table for streak rankings
CREATE TABLE IF NOT EXISTS daily_streak_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_xp_from_streaks INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0, -- Total XP from main system
    total_claims INTEGER DEFAULT 0,
    last_claim_date DATE,
    rank_current INTEGER,
    rank_longest INTEGER,
    rank_total_xp INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_wallet_address ON daily_streak_leaderboard(wallet_address);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_current_streak ON daily_streak_leaderboard(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_longest_streak ON daily_streak_leaderboard(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_total_xp ON daily_streak_leaderboard(total_xp_from_streaks DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_total_xp_main ON daily_streak_leaderboard(total_xp DESC);

-- Disable Row Level Security for development
ALTER TABLE daily_streak_leaderboard DISABLE ROW LEVEL SECURITY;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_daily_streak_leaderboard_updated_at 
    BEFORE UPDATE ON daily_streak_leaderboard
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON daily_streak_leaderboard TO authenticated;

-- Enable realtime (optional - for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE daily_streak_leaderboard;

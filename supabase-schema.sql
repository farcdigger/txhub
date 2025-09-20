-- Supabase Database Schema for BaseHub Farcaster Mini App
-- Copy and paste these commands into your Supabase SQL Editor

-- 1. Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_transactions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create transactions table for history
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    game_type TEXT NOT NULL,
    xp_earned INTEGER NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_wallet_address ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_players_total_xp ON players(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address ON transactions(wallet_address);

-- 4. Disable Row Level Security for development
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 5. Create function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger to auto-update updated_at
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant necessary permissions
GRANT ALL ON players TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- 8. Create daily_streaks table
CREATE TABLE IF NOT EXISTS daily_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_claim_date DATE,
    total_xp_from_streaks INTEGER DEFAULT 0,
    total_claims INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create daily_streak_leaderboard table
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

-- 10. Create indexes for daily streak tables
CREATE INDEX IF NOT EXISTS idx_daily_streaks_wallet_address ON daily_streaks(wallet_address);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_current_streak ON daily_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_longest_streak ON daily_streaks(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_wallet_address ON daily_streak_leaderboard(wallet_address);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_current_streak ON daily_streak_leaderboard(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_longest_streak ON daily_streak_leaderboard(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_total_xp ON daily_streak_leaderboard(total_xp_from_streaks DESC);
CREATE INDEX IF NOT EXISTS idx_daily_streak_leaderboard_total_xp_main ON daily_streak_leaderboard(total_xp DESC);

-- 11. Disable Row Level Security for daily streak tables
ALTER TABLE daily_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streak_leaderboard DISABLE ROW LEVEL SECURITY;

-- 12. Create triggers for daily streak tables
CREATE TRIGGER update_daily_streaks_updated_at 
    BEFORE UPDATE ON daily_streaks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_streak_leaderboard_updated_at 
    BEFORE UPDATE ON daily_streak_leaderboard
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Grant permissions for daily streak tables
GRANT ALL ON daily_streaks TO authenticated;
GRANT ALL ON daily_streak_leaderboard TO authenticated;

-- 14. Enable realtime (optional - for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_streak_leaderboard;

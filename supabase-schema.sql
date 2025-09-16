-- Supabase Database Schema for Base Games Farcaster App
-- Run these commands in your Supabase SQL editor

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_transactions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    game_type TEXT NOT NULL,
    xp_earned INTEGER NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rank INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    total_xp INTEGER NOT NULL,
    level INTEGER NOT NULL,
    total_transactions INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_wallet_address ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_players_total_xp ON players(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_players_total_transactions ON players(total_transactions DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);

-- Disable Row Level Security (RLS) for easier development
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- RLS policies removed since RLS is disabled for development

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Clear current leaderboard
    DELETE FROM leaderboard;
    
    -- Insert top 10 players by total XP
    INSERT INTO leaderboard (rank, wallet_address, total_xp, level, total_transactions)
    SELECT 
        ROW_NUMBER() OVER (ORDER BY total_xp DESC, total_transactions DESC) as rank,
        wallet_address,
        total_xp,
        level,
        total_transactions
    FROM players
    WHERE total_xp > 0
    ORDER BY total_xp DESC, total_transactions DESC
    LIMIT 10;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update leaderboard when player stats change
CREATE TRIGGER update_leaderboard_trigger
    AFTER UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard();

-- Create trigger to update leaderboard when new player is created
CREATE TRIGGER update_leaderboard_insert_trigger
    AFTER INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard();

-- Insert some sample data (optional)
-- INSERT INTO players (wallet_address, total_xp, level, total_transactions) VALUES
-- ('0x1234567890123456789012345678901234567890', 150, 2, 5),
-- ('0x0987654321098765432109876543210987654321', 75, 1, 3),
-- ('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 300, 3, 8);

-- Create view for player statistics
CREATE OR REPLACE VIEW player_stats_view AS
SELECT 
    p.wallet_address,
    p.total_xp,
    p.level,
    p.total_transactions,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.total_xp >= 2000 THEN 5
        WHEN p.total_xp >= 1000 THEN 4
        WHEN p.total_xp >= 500 THEN 3
        WHEN p.total_xp >= 250 THEN 2
        ELSE 1
    END as calculated_level,
    FLOOR(p.total_xp * 10.0) as token_balance
FROM players p;

-- Grant permissions
GRANT ALL ON players TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON leaderboard TO authenticated;
GRANT SELECT ON player_stats_view TO authenticated;

-- Create realtime subscriptions (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
-- ALTER PUBLICATION supabase_realtime ADD TABLE players;

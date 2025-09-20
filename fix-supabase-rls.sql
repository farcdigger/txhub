-- Fix Supabase 406 Error - RLS and Permissions
-- Copy and paste this into your Supabase SQL Editor

-- 1. Disable RLS for all tables (for development)
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streak_leaderboard DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions to authenticated users
GRANT ALL ON players TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON daily_streaks TO authenticated;
GRANT ALL ON daily_streak_leaderboard TO authenticated;

-- 3. Grant all permissions to anon users (for public access)
GRANT ALL ON players TO anon;
GRANT ALL ON transactions TO anon;
GRANT ALL ON daily_streaks TO anon;
GRANT ALL ON daily_streak_leaderboard TO anon;

-- 4. Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_streak_leaderboard;

-- 6. Create policies for public access (if RLS is enabled later)
CREATE POLICY "Enable all operations for all users" ON players FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON transactions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON daily_streaks FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON daily_streak_leaderboard FOR ALL USING (true);

-- 7. Verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('players', 'transactions', 'daily_streaks', 'daily_streak_leaderboard');

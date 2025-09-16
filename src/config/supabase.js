import { createClient } from '@supabase/supabase-js'

// Supabase configuration - OPTIONAL for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isSupabaseConfigured = supabaseUrl && supabaseKey

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'basehub-farcaster@1.0.0'
    }
  }
}) : null

if (isSupabaseConfigured) {
  console.log('✅ Supabase configured for BaseHub Farcaster Mini App')
} else {
  console.log('⚠️ Supabase not configured - using localStorage for development')
}

// Database table names
export const TABLES = {
  PLAYERS: 'players',
  TRANSACTIONS: 'transactions',
  LEADERBOARD: 'leaderboard'
}

// XP System Configuration
export const XP_CONFIG = {
  GM_GAME: 10,        // 10 XP per GM
  GN_GAME: 10,        // 10 XP per GN
  FLIP_GAME: 15,      // 15 XP per flip
  LUCKY_NUMBER: 20,   // 20 XP per lucky number
  DICE_ROLL: 25,      // 25 XP per dice roll
  CONTRACT_GAME: 30,  // 30 XP per contract interaction
  
  // XP to Token conversion
  XP_TO_TOKEN_RATIO: 10, // 1 XP = 50 BHUP token
  
  // Level system
  LEVEL_1: 100,       // Level 1: 100 XP
  LEVEL_2: 250,       // Level 2: 250 XP
  LEVEL_3: 500,       // Level 3: 500 XP
  LEVEL_4: 1000,      // Level 4: 1000 XP
  LEVEL_5: 2000,      // Level 5: 2000 XP
}

// Game types
export const GAME_TYPES = {
  GM_GAME: 'GM_GAME',
  GN_GAME: 'GN_GAME',
  FLIP_GAME: 'FLIP_GAME',
  LUCKY_NUMBER: 'LUCKY_NUMBER',
  DICE_ROLL: 'DICE_ROLL',
  CONTRACT_GAME: 'CONTRACT_GAME'
}

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Check if Supabase is properly configured
const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && supabaseKey !== 'your-anon-key'

if (isConfigured) {
  console.log('✅ Supabase configured successfully')
} else {
  console.warn('⚠️ Supabase not configured - using fallback localStorage')
}

// Create Supabase client with singleton pattern to avoid multiple instances
let supabaseInstance = null

export const supabase = (() => {
  if (!supabaseInstance && isConfigured) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Disable session persistence to avoid multiple instances
        autoRefreshToken: false
      }
    })
  }
  return supabaseInstance
})()

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
  XP_TO_TOKEN_RATIO: 50, // 1 XP = 50 BHUP token
  
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

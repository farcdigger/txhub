// XP utility functions with Supabase integration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Add XP to user's wallet address (every game gives XP)
export const addXP = async (walletAddress, xpAmount) => {
  if (!walletAddress || !xpAmount) return

  try {
    // First, check if player already exists
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching player:', fetchError)
      throw fetchError
    }

    if (existingPlayer) {
      // Update existing player - add XP
      const newTotalXP = existingPlayer.total_xp + xpAmount
      const newLevel = Math.floor(newTotalXP / 100) + 1
      const newTotalTransactions = existingPlayer.total_transactions + 1

      const { error: updateError } = await supabase
        .from('players')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          total_transactions: newTotalTransactions,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)

      if (updateError) {
        console.error('Error updating player:', updateError)
        throw updateError
      }

      console.log(`Updated ${walletAddress} with ${xpAmount} XP. Total: ${newTotalXP}`)
      return newTotalXP
    } else {
      // Create new player
      const { error: insertError } = await supabase
        .from('players')
        .insert([
          {
            wallet_address: walletAddress,
            total_xp: xpAmount,
            level: Math.floor(xpAmount / 100) + 1,
            total_transactions: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])

      if (insertError) {
        console.error('Error creating player:', insertError)
        throw insertError
      }

      console.log(`Created new player ${walletAddress} with ${xpAmount} XP`)
      return xpAmount
    }
  } catch (error) {
    console.error('Error in addXP:', error)
    // Fallback to localStorage if Supabase fails
    const xpKey = `xp_${walletAddress}`
    const currentXP = parseInt(localStorage.getItem(xpKey) || '0')
    const newXP = currentXP + xpAmount
    localStorage.setItem(xpKey, newXP.toString())
    console.log(`Fallback: Added ${xpAmount} XP to ${walletAddress}. Total: ${newXP}`)
    return newXP
  }
}

// Get XP for user's wallet address
export const getXP = async (walletAddress) => {
  if (!walletAddress) return 0
  
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('total_xp')
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching XP:', error)
      throw error
    }

    return player ? player.total_xp : 0
  } catch (error) {
    console.error('Error in getXP:', error)
    // Fallback to localStorage
    const xpKey = `xp_${walletAddress}`
    return parseInt(localStorage.getItem(xpKey) || '0')
  }
}

// Get leaderboard (top 10 players)
export const getLeaderboard = async () => {
  try {
    console.log('Fetching leaderboard from Supabase...')
    const { data: players, error } = await supabase
      .from('players')
      .select('wallet_address, total_xp, level, total_transactions')
      .order('total_xp', { ascending: false })
      .limit(10)

    console.log('Supabase response:', { players, error })

    if (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }

    console.log('Returning leaderboard data:', players || [])
    return players || []
  } catch (error) {
    console.error('Error in getLeaderboard:', error)
    return []
  }
}

// Calculate tokens from XP (1 XP = 50 BHUP)
export const calculateTokens = (xp) => {
  return Math.floor(xp * 50)
}

// Add bonus XP for winning games
export const addBonusXP = async (walletAddress, gameType, isWin) => {
  if (!walletAddress || !gameType) return

  // Base XP for playing
  let baseXP = 10
  
  // Bonus XP for winning
  let bonusXP = 0
  if (isWin) {
    switch (gameType.toLowerCase()) {
      case 'flip':
        bonusXP = 500 // 500 bonus for winning flip
        break
      case 'luckynumber':
        bonusXP = 1000 // 1000 bonus for winning lucky number
        break
      case 'diceroll':
        bonusXP = 1500 // 1500 bonus for winning dice roll
        break
      case 'gm':
      case 'gn':
        bonusXP = 0 // No bonus for GM/GN
        break
      default:
        bonusXP = 0
    }
  }

  const totalXP = baseXP + bonusXP
  console.log(`${gameType} game: Base ${baseXP} XP + Bonus ${bonusXP} XP = ${totalXP} XP total`)
  
  return await addXP(walletAddress, totalXP)
}

// Claim tokens (convert XP to BHUP tokens) - COMING SOON
export const claimTokens = async (walletAddress, xpAmount) => {
  // This function is disabled for now - minting is not enabled
  throw new Error('Claim feature is coming soon! Minting is not enabled yet.')
}

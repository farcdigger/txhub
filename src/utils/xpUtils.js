// XP utility functions with Supabase integration
import { supabase } from '../config/supabase'

// Add XP to user's wallet address (every game gives XP)
export const addXP = async (walletAddress, xpAmount) => {
  if (!walletAddress || !xpAmount) {
    console.log('❌ Missing walletAddress or xpAmount:', { walletAddress, xpAmount })
    return
  }

  console.log('🎯 Adding XP to Supabase:', { walletAddress, xpAmount })

  try {
    console.log('📊 Checking if player exists in Supabase...')
    // First, check if player already exists
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching player:', fetchError)
      console.log('🔄 Retrying with different approach...')
      
      // Retry with different query approach
      const { data: retryData, error: retryError } = await supabase
        .from('players')
        .select('*')
        .eq('wallet_address', walletAddress)
      
      if (retryError) {
        console.error('❌ Retry also failed:', retryError)
        throw retryError
      }
      
      // Use first result if found
      if (retryData && retryData.length > 0) {
        const existingPlayer = retryData[0]
        console.log('✅ Retry successful, found player:', existingPlayer.wallet_address)
      } else {
        console.log('ℹ️ No existing player found, will create new one')
      }
    }

    console.log('🔍 Player lookup result:', { existingPlayer, fetchError: fetchError?.code })

    if (existingPlayer) {
      console.log('👤 Updating existing player:', existingPlayer.wallet_address)
      // Update existing player - add XP
      const newTotalXP = existingPlayer.total_xp + xpAmount
      const newLevel = Math.floor(newTotalXP / 100) + 1
      const newTotalTransactions = existingPlayer.total_transactions + 1

      console.log('📈 Player update data:', { 
        oldXP: existingPlayer.total_xp, 
        xpToAdd: xpAmount, 
        newXP: newTotalXP, 
        newLevel, 
        newTotalTransactions 
      })

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
        console.error('❌ Error updating player:', updateError)
        throw updateError
      }

      console.log(`✅ Updated ${walletAddress} with ${xpAmount} XP. Total: ${newTotalXP}`)
      return newTotalXP
    } else {
      console.log('🆕 Creating new player for:', walletAddress)
      // Create new player
      const newPlayerData = {
        wallet_address: walletAddress,
        total_xp: xpAmount,
        level: Math.floor(xpAmount / 100) + 1,
        total_transactions: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('📝 New player data:', newPlayerData)

      const { error: insertError } = await supabase
        .from('players')
        .insert([newPlayerData])

      if (insertError) {
        console.error('❌ Error creating player:', insertError)
        throw insertError
      }

      console.log(`✅ Created new player ${walletAddress} with ${xpAmount} XP`)
      return xpAmount
    }
  } catch (error) {
    console.error('❌ Error in addXP:', error)
    throw error
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

    if (error && error.code === 'PGRST116') return 0 // No player found
    if (error) throw error

    return player?.total_xp || 0
  } catch (error) {
    console.error('❌ Error in getXP:', error)
    return 0
  }
}

// Get leaderboard (top 10 players)
export const getLeaderboard = async () => {
  try {
    console.log('🏆 Fetching leaderboard from Supabase...')
    const { data: players, error } = await supabase
      .from('players')
      .select('wallet_address, total_xp, level, total_transactions')
      .order('total_xp', { ascending: false })
      .limit(10)

    console.log('📊 Supabase leaderboard response:', { players, error })

    if (error) {
      console.error('❌ Error fetching leaderboard:', error)
      throw error
    }

    // Add token_balance calculation to each player
    const playersWithTokens = (players || []).map(player => ({
      ...player,
      token_balance: calculateTokens(player.total_xp)
    }))

    console.log('✅ Returning leaderboard data:', playersWithTokens)
    return playersWithTokens
  } catch (error) {
    console.error('❌ Error in getLeaderboard:', error)
    return []
  }
}

// Calculate tokens from XP (1 XP = 10 BHUP)
export const calculateTokens = (xp) => {
  return Math.floor(xp * 10)
}

// Record transaction in Supabase
export const recordTransaction = async (walletAddress, gameType, xpEarned, transactionHash) => {
  if (!walletAddress || !gameType || !xpEarned) return

  try {
    console.log('📝 Recording transaction to Supabase:', { walletAddress, gameType, xpEarned, transactionHash })
    
    const { error } = await supabase
      .from('transactions')
      .insert([{
        wallet_address: walletAddress,
        game_type: gameType,
        xp_earned: xpEarned,
        transaction_hash: transactionHash,
        created_at: new Date().toISOString()
      }])

    if (error) {
      console.error('❌ Error recording transaction:', error)
      throw error
    }

    console.log('✅ Transaction recorded successfully')
  } catch (error) {
    console.error('❌ Error in recordTransaction:', error)
    // Don't throw error - this is not critical for user experience
  }
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

// Daily Streak Functions
export const calculateDailyStreakXP = (streak) => {
  const BASE_XP = 10
  const MAX_XP = 100000 // 100k XP limit
  const BONUS_THRESHOLD = 10 // After 10 days, switch to percentage bonus
  
  if (streak <= 0) return BASE_XP
  
  if (streak <= BONUS_THRESHOLD) {
    // Exponential growth for first 10 days: 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120
    const xp = BASE_XP * Math.pow(2, streak - 1)
    return Math.min(xp, MAX_XP)
  } else {
    // After 10 days: 20% bonus on base XP
    const baseXP = BASE_XP * Math.pow(2, BONUS_THRESHOLD - 1) // 5120 XP
    const bonusXP = Math.floor(baseXP * 0.2) // 20% bonus = 1024 XP
    return Math.min(baseXP + bonusXP, MAX_XP)
  }
}

export const canClaimDailyStreak = async (walletAddress) => {
  if (!walletAddress) return false

  try {
    const { data } = await supabase
      .from('daily_streaks')
      .select('last_claim_date')
      .eq('wallet_address', walletAddress)
      .single()

    if (!data) return true // First time claiming

    const lastClaim = new Date(data.last_claim_date)
    const today = new Date()
    const diffTime = today - lastClaim
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return diffDays >= 1
  } catch (err) {
    console.error('❌ Error checking daily streak claim:', err)
    return false
  }
}

export const getNextDayXP = (currentStreak) => {
  return calculateDailyStreakXP(currentStreak + 1)
}

export const getDailyStreakData = async (walletAddress) => {
  if (!walletAddress) return null

  try {
    const { data, error } = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching daily streak data:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('❌ Error in getDailyStreakData:', err)
    return null
  }
}

export const claimDailyStreak = async (walletAddress) => {
  if (!walletAddress) {
    throw new Error('Wallet address is required')
  }

  try {
    // Check if can claim today
    const canClaim = await canClaimDailyStreak(walletAddress)
    if (!canClaim) {
      throw new Error('You have already claimed today. Come back tomorrow!')
    }

    // Get current streak data
    const streakData = await getDailyStreakData(walletAddress)
    const currentStreak = streakData?.current_streak || 0
    const longestStreak = streakData?.longest_streak || 0

    // Calculate new streak and XP
    const newStreak = currentStreak + 1
    const xpEarned = calculateDailyStreakXP(newStreak)
    const newLongestStreak = Math.max(newStreak, longestStreak)
    const today = new Date().toISOString().split('T')[0]

    // Update or create streak data
    const { data, error } = await supabase
      .from('daily_streaks')
      .upsert({
        wallet_address: walletAddress,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_claim_date: today,
        total_xp_from_streaks: (streakData?.total_xp_from_streaks || 0) + xpEarned,
        total_claims: (streakData?.total_claims || 0) + 1
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating daily streak:', error)
      throw new Error('Failed to update daily streak')
    }

    // Add XP to player's total
    await addXP(walletAddress, xpEarned, 'Daily Streak')

    // Update leaderboard
    await updateDailyStreakLeaderboard(walletAddress)

    console.log(`🎉 Daily streak claimed! Streak: ${newStreak}, XP: ${xpEarned}`)

    return {
      streak: newStreak,
      xpEarned,
      totalXP: data.total_xp_from_streaks,
      longestStreak: newLongestStreak
    }
  } catch (err) {
    console.error('❌ Error in claimDailyStreak:', err)
    throw err
  }
}

export const resetDailyStreak = async (walletAddress) => {
  if (!walletAddress) return

  try {
    const { error } = await supabase
      .from('daily_streaks')
      .update({ current_streak: 0 })
      .eq('wallet_address', walletAddress)

    if (error) {
      console.error('❌ Error resetting daily streak:', error)
    } else {
      console.log('✅ Daily streak reset for:', walletAddress)
    }
  } catch (err) {
    console.error('❌ Error in resetDailyStreak:', err)
  }
}

// Daily Streak Leaderboard Functions
export const updateDailyStreakLeaderboard = async (walletAddress) => {
  if (!walletAddress) return

  try {
    // Get current streak data
    const streakData = await getDailyStreakData(walletAddress)
    if (!streakData) return

    // Get total XP from main system
    const { data: playerData } = await supabase
      .from('players')
      .select('total_xp')
      .eq('wallet_address', walletAddress)
      .single()

    const totalXP = playerData?.total_xp || 0

    // Update leaderboard entry
    const { error } = await supabase
      .from('daily_streak_leaderboard')
      .upsert({
        wallet_address: walletAddress,
        current_streak: streakData.current_streak,
        longest_streak: streakData.longest_streak,
        total_xp_from_streaks: streakData.total_xp_from_streaks,
        total_claims: streakData.total_claims,
        last_claim_date: streakData.last_claim_date,
        total_xp: totalXP // Add total XP from main system
      })

    if (error) {
      console.error('❌ Error updating daily streak leaderboard:', error)
    } else {
      console.log('✅ Daily streak leaderboard updated for:', walletAddress)
    }
  } catch (err) {
    console.error('❌ Error in updateDailyStreakLeaderboard:', err)
  }
}

export const getDailyStreakLeaderboard = async (limit = 50, offset = 0, sortBy = 'current_streak') => {
  try {
    const { data, error } = await supabase
      .from('daily_streak_leaderboard')
      .select('*')
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error fetching daily streak leaderboard:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('❌ Error in getDailyStreakLeaderboard:', err)
    return []
  }
}

export const getDailyStreakLeaderboardByCurrentStreak = async (limit = 50, offset = 0) => {
  return await getDailyStreakLeaderboard(limit, offset, 'current_streak')
}

export const getDailyStreakLeaderboardByLongestStreak = async (limit = 50, offset = 0) => {
  return await getDailyStreakLeaderboard(limit, offset, 'longest_streak')
}

export const getDailyStreakLeaderboardByTotalXP = async (limit = 50, offset = 0) => {
  return await getDailyStreakLeaderboard(limit, offset, 'total_xp')
}

export const getDailyStreakLeaderboardByStreakXP = async (limit = 50, offset = 0) => {
  return await getDailyStreakLeaderboard(limit, offset, 'total_xp_from_streaks')
}

export const getDailyStreakLeaderboardByTotalClaims = async (limit = 50, offset = 0) => {
  return await getDailyStreakLeaderboard(limit, offset, 'total_claims')
}

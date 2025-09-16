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
      throw fetchError
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

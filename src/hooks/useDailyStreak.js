import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { useFarcaster } from '../contexts/FarcasterContext'
import { 
  getDailyStreakData, 
  claimDailyStreak as claimDailyStreakXP, 
  canClaimDailyStreak,
  getNextDayXP,
  recordTransaction 
} from '../utils/xpUtils'
import { getCurrentConfig, getContractAddress } from '../config/base'
import { parseEther } from 'viem'
import { config } from '../config/wagmi'

export const useDailyStreak = () => {
  const { isInFarcaster } = useFarcaster()
  const { address, chainId } = useAccount()
  const { writeContractAsync, data: txData } = useWriteContract()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const claimDailyStreak = async () => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get contract address from config
      const contractAddress = getContractAddress('DAILY_STREAK')
      
      console.log('🔥 Claiming daily streak...')
      console.log('📍 Contract Address:', contractAddress)
      
      // Call the smart contract
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: [
          {
            "inputs": [],
            "name": "claimDailyStreak",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: 'claimDailyStreak',
        value: parseEther('0.00002') // 0.00002 ETH fee
      })
      
      console.log('✅ Daily streak transaction sent:', txHash)

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash
      })

      console.log('✅ Daily streak transaction confirmed!')

      // Claim daily streak using Supabase
      const result = await claimDailyStreakXP(address)
      
      // Record transaction
      try {
        await recordTransaction({
          wallet_address: address,
          transaction_type: 'DAILY_STREAK',
          transaction_hash: txHash,
          contract_address: contractAddress,
          amount: '0.00002',
          currency: 'ETH',
          status: 'success',
          game_type: 'Daily Streak',
          metadata: {
            streak: result.streak,
            xpEarned: result.xpEarned,
            totalXP: result.totalXP
          }
        })
      } catch (recordError) {
        console.error('❌ Failed to record transaction:', recordError)
      }

      return {
        txHash,
        streak: result.streak,
        xpEarned: result.xpEarned,
        totalXP: result.totalXP,
        longestStreak: result.longestStreak
      }
    } catch (err) {
      console.error('❌ Daily streak failed:', err)
      setError(err.message || 'Failed to claim daily streak')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getStreakData = async () => {
    if (!address) return null

    try {
      // Try to get data from smart contract first
      const contractAddress = getContractAddress('DAILY_STREAK')
      
      try {
        const { readContract } = await import('wagmi/actions')
        const contractData = await readContract(config, {
          address: contractAddress,
          abi: [
            {
              "inputs": [{"name": "player", "type": "address"}],
              "name": "getPlayerStreak",
              "outputs": [
                {"name": "currentStreak", "type": "uint256"},
                {"name": "longestStreak", "type": "uint256"},
                {"name": "lastClaimDay", "type": "uint256"},
                {"name": "totalXP", "type": "uint256"},
                {"name": "totalClaims", "type": "uint256"},
                {"name": "nextXP", "type": "uint256"}
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'getPlayerStreak',
          args: [address]
        })

        return {
          currentStreak: Number(contractData[0]),
          longestStreak: Number(contractData[1]),
          lastClaimDate: new Date(Number(contractData[2]) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalXP: Number(contractData[3]),
          totalClaims: Number(contractData[4]),
          nextXP: Number(contractData[5])
        }
      } catch (contractError) {
        console.log('⚠️ Contract not available, using Supabase data')
        
        // Fallback to Supabase data
        const data = await getDailyStreakData(address)
        if (!data) return null

        return {
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastClaimDate: data.last_claim_date,
          totalXP: data.total_xp_from_streaks,
          totalClaims: data.total_claims,
          nextXP: getNextDayXP(data.current_streak)
        }
      }
    } catch (err) {
      console.error('❌ Failed to get streak data:', err)
      return null
    }
  }

  const canClaimToday = async () => {
    if (!address) return false

    try {
      // Try to check from smart contract first
      const contractAddress = getContractAddress('DAILY_STREAK')
      
      try {
        const { readContract } = await import('wagmi/actions')
        const canClaim = await readContract(config, {
          address: contractAddress,
          abi: [
            {
              "inputs": [{"name": "player", "type": "address"}],
              "name": "canClaimToday",
              "outputs": [{"name": "", "type": "bool"}],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'canClaimToday',
          args: [address]
        })

        return canClaim
      } catch (contractError) {
        console.log('⚠️ Contract not available, using Supabase check')
        
        // Fallback to Supabase check
        const data = await getDailyStreakData(address)
        if (!data) return true // First time user can claim
        
        return canClaimDailyStreak(data.last_claim_date)
      }
    } catch (err) {
      console.error('❌ Failed to check claim status:', err)
      return false
    }
  }

  return {
    claimDailyStreak,
    getStreakData,
    canClaimToday,
    isLoading,
    error
  }
}

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Star, Coins, Zap, Trophy } from 'lucide-react'
import { getXP, calculateTokens } from '../utils/xpUtils'

const FarcasterXPDisplay = () => {
  const { isConnected, address } = useAccount()
  const [totalXP, setTotalXP] = useState(0)

  // Load XP from Supabase and refresh every 3 seconds
  useEffect(() => {
    const loadXP = async () => {
      if (isConnected && address) {
        try {
          const xp = await getXP(address)
          setTotalXP(xp)
        } catch (error) {
          console.error('Error loading XP:', error)
          // Fallback to localStorage
          const xpKey = `xp_${address}`
          const savedXP = localStorage.getItem(xpKey)
          setTotalXP(savedXP ? parseInt(savedXP) : 0)
        }
      } else {
        setTotalXP(0)
      }
    }

    loadXP()
    const interval = setInterval(loadXP, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [isConnected, address])

  const tokenBalance = calculateTokens(totalXP)

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="farcaster-xp-display">
      <div className="xp-info">
        <div className="xp-item">
          <Zap size={16} />
          <span className="xp-value">{totalXP} XP</span>
        </div>
        <div className="xp-item">
          <Coins size={16} />
          <span className="token-value">{tokenBalance} BHUP</span>
        </div>
      </div>
    </div>
  )
}

export default FarcasterXPDisplay

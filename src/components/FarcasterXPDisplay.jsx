import React, { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Star, Coins, Zap, Trophy, Wallet, Clock } from 'lucide-react'
import { getXP, calculateTokens } from '../utils/xpUtils'
import { useFarcaster } from '../contexts/FarcasterContext'

const FarcasterXPDisplay = () => {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { isInFarcaster } = useFarcaster()
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

  const handleConnect = () => {
    const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')
    if (farcasterConnector) {
      connect({ connector: farcasterConnector })
    }
  }

  // If not connected, show compact connect version
  if (!isConnected || !address) {
    return (
      <div className="farcaster-xp-display compact not-connected">
        <button 
          className="compact-connect-button"
          onClick={handleConnect}
        >
          <Wallet size={14} />
          <span>Connect</span>
        </button>
        <div className="compact-stats">
          <div className="compact-stat">
            <Zap size={12} />
            <span>0</span>
          </div>
          <div className="compact-stat">
            <Coins size={12} />
            <span>0</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="farcaster-xp-display compact connected">
      <div className="compact-header">
        <div className="compact-player">
          <Trophy size={14} />
          <span>{address.slice(0, 4)}...{address.slice(-3)}</span>
        </div>
      </div>
      
      <div className="compact-stats">
        <div className="compact-stat xp">
          <Zap size={14} />
          <div className="stat-info">
            <span className="value">{totalXP}</span>
            <span className="label">XP</span>
          </div>
        </div>
        
        <div className="compact-stat token">
          <Coins size={14} />
          <div className="stat-info">
            <span className="value">{tokenBalance}</span>
            <span className="label">BHUP</span>
          </div>
        </div>
      </div>
      
      <button className="compact-claim-button disabled" disabled>
        <Clock size={12} />
        <span>Soon</span>
      </button>
    </div>
  )
}

export default FarcasterXPDisplay
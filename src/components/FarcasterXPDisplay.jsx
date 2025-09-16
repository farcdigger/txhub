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

  // If not connected, show connect button
  if (!isConnected || !address) {
    return (
      <div className="farcaster-xp-display not-connected">
        <div className="connect-section">
          <Wallet size={20} />
          <span className="connect-text">Connect Wallet</span>
        </div>
        <button 
          className="connect-button"
          onClick={handleConnect}
        >
          Connect
        </button>
        <div className="xp-preview">
          <div className="xp-item">
            <Zap size={16} />
            <span>0 XP</span>
          </div>
          <div className="xp-item">
            <Coins size={16} />
            <span>0 BHUP</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="farcaster-xp-display connected">
      <div className="xp-header">
        <div className="player-badge">
          <Trophy size={18} />
          <span className="player-text">Player</span>
        </div>
        <div className="wallet-info">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>
      
      <div className="xp-stats">
        <div className="stat-item xp-stat">
          <div className="stat-icon">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalXP}</span>
            <span className="stat-label">XP</span>
          </div>
        </div>
        
        <div className="stat-item token-stat">
          <div className="stat-icon">
            <Coins size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{tokenBalance}</span>
            <span className="stat-label">BHUP</span>
          </div>
        </div>
      </div>
      
      <div className="claim-section">
        <button className="claim-button disabled" disabled>
          <Clock size={16} />
          <span>Coming Soon</span>
        </button>
        <div className="claim-note">
          Token claiming will be available soon!
        </div>
      </div>
    </div>
  )
}

export default FarcasterXPDisplay
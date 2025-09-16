import React, { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Star, Coins, Zap, Trophy, Wallet, Clock, Home } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getXP, calculateTokens } from '../utils/xpUtils'
import { useFarcaster } from '../contexts/FarcasterContext'

const FarcasterXPDisplay = () => {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { isInFarcaster } = useFarcaster()
  const navigate = useNavigate()
  const location = useLocation()
  const [totalXP, setTotalXP] = useState(0)
  
  // Check if we're on home page
  const isHomePage = location.pathname === '/'

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

  const handleHomeClick = () => {
    navigate('/')
  }

  // If not connected, show header connect version
  if (!isConnected || !address) {
    return (
      <div className="farcaster-header-bar not-connected">
        <div className="header-left">
          {!isHomePage && (
            <button className="home-button" onClick={handleHomeClick} title="Ana Sayfa">
              <Home size={16} />
            </button>
          )}
          <div className="not-connected-text">
            <Wallet size={16} />
            <span>Not Connected</span>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="header-connect-button"
            onClick={handleConnect}
          >
            <span>Connect</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="farcaster-header-bar">
      <div className="header-left">
        {!isHomePage && (
          <button className="home-button" onClick={handleHomeClick} title="Ana Sayfa">
            <Home size={16} />
          </button>
        )}
        <div className="player-info">
          <Trophy size={16} />
          <span className="wallet-address">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="stat-mini xp">
          <Zap size={14} />
          <span>{totalXP}</span>
        </div>
        
        <div className="stat-mini token">
          <Coins size={14} />
          <span>{tokenBalance}</span>
        </div>
        
        <button className="claim-button coming-soon" disabled title="Claim feature coming soon!">
          <Clock size={14} />
          <span>Claim</span>
        </button>
      </div>
    </div>
  )
}

export default FarcasterXPDisplay
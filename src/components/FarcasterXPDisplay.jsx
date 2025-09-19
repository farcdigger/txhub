import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Star, Coins, Zap, Trophy, Wallet, Clock, Home, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getXP, calculateTokens } from '../utils/xpUtils'
import { useFarcaster } from '../contexts/FarcasterContext'

const FarcasterXPDisplay = () => {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
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

  const handleConnect = (connector) => {
    connect({ connector })
  }

  const handleDisconnect = () => {
    disconnect()
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
              <Home size={12} />
            </button>
          )}
          <div className="not-connected-text">
            <Wallet size={12} />
            <span>Not Connected</span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="wallet-dropdown">
            <button className="header-connect-button">
              <span>Connect Wallet</span>
            </button>
            <div className="wallet-options">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  className="wallet-option"
                  onClick={() => handleConnect(connector)}
                >
                  <Wallet size={12} />
                  <span>{connector.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="farcaster-header-bar">
      <div className="header-left">
        {!isHomePage && (
          <button className="home-button" onClick={handleHomeClick} title="Ana Sayfa">
            <Home size={12} />
          </button>
        )}
        <div className="player-info">
          <Trophy size={12} />
          <span className="wallet-address">{address.slice(0, 4)}..{address.slice(-2)}</span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="stat-mini xp">
          <Zap size={10} />
          <span>{totalXP}</span>
        </div>
        
        <div className="stat-mini token exciting">
          <Coins size={10} />
          <div className="token-info">
            <span className="token-name">BHUP</span>
            <span className="token-balance">{tokenBalance}</span>
          </div>
        </div>
        
        <button className="claim-button coming-soon" disabled title="Claim feature coming soon!">
          <Clock size={10} />
          <span>Claim</span>
        </button>
        
        <button className="disconnect-button" onClick={handleDisconnect} title="Disconnect Wallet">
          <LogOut size={10} />
        </button>
      </div>
    </div>
  )
}

export default FarcasterXPDisplay
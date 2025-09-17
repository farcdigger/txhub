import React, { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { getXP } from '../utils/xpUtils'

const Header = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)

  // Load user XP
  useEffect(() => {
    const loadUserXP = async () => {
      if (address) {
        try {
          console.log('🔍 Loading XP for address:', address)
          const totalXP = await getXP(address)
          console.log('✅ XP loaded:', totalXP)
          setUserXP(totalXP || 0)
          setUserLevel(Math.floor((totalXP || 0) / 100) + 1)
        } catch (error) {
          console.error('❌ Error loading user XP:', error)
        }
      }
    }

    loadUserXP()
  }, [address])

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Handle wallet connection
  const handleConnect = () => {
    console.log('🔗 Attempting to connect wallet...')
    
    // Try to find WalletConnect button
    const connectBtn = document.querySelector('w3m-button')
    if (connectBtn) {
      console.log('✅ Found w3m-button, clicking...')
      connectBtn.click()
      return
    }

    // Try to find any connect button
    const btns = document.querySelectorAll('button')
    const connectButton = Array.from(btns).find(btn => {
      const text = btn.textContent?.toLowerCase() || ''
      return text.includes('connect') || text.includes('wallet')
    })
    
    if (connectButton && connectButton !== event.target) {
      console.log('✅ Found connect button:', connectButton.textContent)
      connectButton.click()
    } else {
      console.log('❌ No connect button found')
      // Try to trigger wallet connection via window
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' })
          .then(() => console.log('✅ Wallet connected via window.ethereum'))
          .catch(err => console.log('❌ Wallet connection failed:', err))
      }
    }
  }

  console.log('🔍 Header Debug:', {
    isConnected,
    address,
    userXP,
    userLevel
  })

  return (
    <div className="header-section" style={{
      display: 'flex !important',
      position: 'fixed !important',
      top: '0 !important',
      left: '0 !important', 
      right: '0 !important',
      zIndex: '999999 !important',
      background: 'rgba(59, 130, 246, 0.1) !important',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px 20px !important',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease',
      visibility: 'visible !important',
      opacity: '1 !important',
      height: 'auto !important',
      width: 'auto !important',
      overflow: 'visible !important',
      transform: 'none !important',
      clip: 'none !important',
      clipPath: 'none !important'
    }}>
      {/* Left - Home Button */}
      <div className="header-left">
        <button
          onClick={() => window.location.href = '/'}
          className="home-button"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>
      </div>
      
      {/* Center - Logo */}
      <div className="header-center">
        <div className="logo-section" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div className="logo" style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🎮
          </div>
          <div>
            <h1 className="header-title" style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'white',
              margin: '0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>BaseHub</h1>
            <p className="header-subtitle" style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0'
            }}>Play Games & Earn XP</p>
          </div>
        </div>
      </div>
      
      {/* Right - XP, Token, Wallet */}
      <div className="header-right">
        {isConnected ? (
          <div className="user-section" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div className="xp-token-info" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px'
            }}>
              <div className="xp-badge" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                <span>⚡</span>
                <span>{userXP} XP</span>
              </div>
              <div className="token-balance" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span>🪙</span>
                <span>Level {userLevel}</span>
              </div>
            </div>
            <div className="wallet-info" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px'
            }}>
              <div className="wallet-address" style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>{formatAddress(address)}</div>
              <button
                onClick={() => disconnect()}
                className="disconnect-button"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="connect-button"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  )
}

export default Header
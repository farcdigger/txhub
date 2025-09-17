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
    console.log('🔄 XP useEffect triggered, address:', address)
    
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
      } else {
        console.log('⚠️ No address available for XP loading')
        setUserXP(0)
        setUserLevel(1)
      }
    }

    loadUserXP()
    
    // Also try to load XP every 5 seconds if connected
    let interval
    if (address) {
      interval = setInterval(loadUserXP, 5000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [address])

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Handle wallet connection
  const handleConnect = async () => {
    console.log('🔗 Attempting to connect wallet...')
    
    try {
      // Method 1: Use our global wallet connect function
      if (window.__walletConnect) {
        console.log('✅ Using global wallet connect function')
        console.log('Available connectors:', window.__walletConnectors?.map(c => c.name))
        
        // Try different connector types
        const connectorPreferences = ['injected', 'metaMask', 'farcaster']
        
        for (const pref of connectorPreferences) {
          try {
            window.__walletConnect(pref)
            console.log(`🔄 Attempted connection with ${pref}`)
            return
          } catch (err) {
            console.log(`❌ ${pref} connection failed:`, err)
          }
        }
        
        // If no specific connector worked, try the first available one
        window.__walletConnect()
        return
      }

      // Method 2: Try w3m-button (WalletConnect)
      const w3mButton = document.querySelector('w3m-button')
      if (w3mButton) {
        console.log('✅ Found w3m-button, clicking...')
        w3mButton.click()
        return
      }

      // Method 3: Try any button with "Connect" text (excluding our own)
      const buttons = Array.from(document.querySelectorAll('button'))
      console.log('🔍 Found buttons:', buttons.map(b => b.textContent?.trim()).filter(t => t))
      
      const connectButton = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase().trim() || ''
        const isOurButton = btn.classList.contains('connect-button') || btn.closest('.header-section')
        return !isOurButton && (text.includes('connect') || text.includes('wallet'))
      })
      
      if (connectButton) {
        console.log('✅ Found external connect button:', connectButton.textContent?.trim())
        connectButton.click()
        return
      }

      // Method 4: Direct ethereum request
      if (window.ethereum) {
        console.log('🔗 Trying direct ethereum connection...')
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        console.log('✅ Direct ethereum connection successful')
        return
      }

      // Method 5: Check for other wallet providers
      if (window.coinbaseWalletExtension) {
        console.log('🔗 Trying Coinbase Wallet...')
        await window.coinbaseWalletExtension.request({ method: 'eth_requestAccounts' })
        return
      }

      if (window.okxwallet) {
        console.log('🔗 Trying OKX Wallet...')
        await window.okxwallet.request({ method: 'eth_requestAccounts' })
        return
      }

      console.log('❌ No wallet connection method found')
      console.log('Available methods:', {
        globalConnect: !!window.__walletConnect,
        ethereum: !!window.ethereum,
        coinbase: !!window.coinbaseWalletExtension,
        okx: !!window.okxwallet,
        w3mButton: !!document.querySelector('w3m-button'),
        buttonsCount: document.querySelectorAll('button').length
      })
      
    } catch (error) {
      console.error('❌ Wallet connection error:', error)
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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🖱️ Connect button clicked!')
              handleConnect()
            }}
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
import React, { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { Home as HomeIcon } from 'lucide-react' // Renamed to avoid conflict

// Add modal animation styles and scroll hide CSS
const modalStyles = `
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Scroll hide CSS rules */
  .header-section.scrolled {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    height: 0 !important;
    transform: translateY(-100%) !important;
    pointer-events: none !important;
  }
`

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('modal-styles')) {
  const style = document.createElement('style')
  style.id = 'modal-styles'
  style.textContent = modalStyles
  document.head.appendChild(style)
}

const Header = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const shouldHide = scrollTop > 20
      console.log('🔄 Scroll detected:', scrollTop, 'Should hide:', shouldHide)
      setIsScrolled(shouldHide)
      
      // Force header hiding with aggressive DOM manipulation
      const headerElements = document.querySelectorAll('.header-section')
      headerElements.forEach(el => {
        if (shouldHide) {
          el.classList.add('scrolled')
          el.style.setProperty('display', 'none', 'important')
          el.style.setProperty('visibility', 'hidden', 'important')
          el.style.setProperty('opacity', '0', 'important')
          el.style.setProperty('height', '0', 'important')
          el.style.setProperty('transform', 'translateY(-100%)', 'important')
        } else {
          el.classList.remove('scrolled')
          el.style.setProperty('display', 'flex', 'important')
          el.style.setProperty('visibility', 'visible', 'important')
          el.style.setProperty('opacity', '1', 'important')
          el.style.setProperty('height', 'auto', 'important')
          el.style.setProperty('transform', 'translateY(0)', 'important')
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showWalletDropdown) {
        setShowWalletDropdown(false)
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [showWalletDropdown])

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


  // Wallet options for connection
  const walletOptions = [
    {
      id: 'injected',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Most popular Web3 wallet'
    },
    {
      id: 'rabby',
      name: 'Rabby',
      icon: '🐰',
      description: 'Multi-chain DeFi wallet'
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Solana & Ethereum wallet'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Coinbase official wallet'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect any mobile wallet'
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: '🎭',
      description: 'Farcaster Mini App'
    }
  ]

  const connectWithWallet = async (walletId) => {
    console.log('🔗 Connecting with wallet:', walletId)
    setShowWalletDropdown(false)
    
    try {
      // Specific wallet detection and connection
      switch (walletId) {
        case 'injected':
        case 'metaMask':
          if (window.ethereum?.isMetaMask) {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
          } else if (window.__walletConnect) {
            window.__walletConnect('injected')
          }
          break
          
        case 'rabby':
          if (window.ethereum?.isRabby) {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
          } else if (window.rabby) {
            await window.rabby.request({ method: 'eth_requestAccounts' })
          } else if (window.__walletConnect) {
            window.__walletConnect('rabby')
          }
          break
          
        case 'phantom':
          if (window.phantom?.ethereum) {
            await window.phantom.ethereum.request({ method: 'eth_requestAccounts' })
          } else if (window.__walletConnect) {
            window.__walletConnect('phantom')
          }
          break
          
        case 'coinbase':
          if (window.ethereum?.isCoinbaseWallet) {
            await window.ethereum.request({ method: 'eth_requestAccounts' })
          } else if (window.__walletConnect) {
            window.__walletConnect('coinbase')
          }
          break
          
        case 'walletconnect':
          if (window.__walletConnect) {
            window.__walletConnect('walletConnect')
          }
          break
          
        case 'farcaster':
          if (window.__walletConnect) {
            window.__walletConnect('farcaster')
          }
          break
          
        default:
          if (window.__walletConnect) {
            window.__walletConnect(walletId)
          } else {
            await handleConnect()
          }
      }
    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      // Fallback to generic connection
      if (window.__walletConnect) {
        window.__walletConnect(walletId)
      } else {
        await handleConnect()
      }
    }
  }

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
      transition: 'all 0.2s ease !important',
      visibility: isScrolled ? 'hidden !important' : 'visible !important',
      opacity: isScrolled ? '0 !important' : '1 !important',
      height: isScrolled ? '0 !important' : 'auto !important',
      width: 'auto !important',
      overflow: 'hidden !important',
      transform: isScrolled ? 'translateY(-100%) !important' : 'translateY(0) !important',
      clip: 'none !important',
      clipPath: 'none !important',
      pointerEvents: isScrolled ? 'none !important' : 'auto !important',
      display: isScrolled ? 'none !important' : 'flex !important'
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
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <img 
              src="/icon.png" 
              alt="BaseHub Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
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
      
        {/* Right - Modern XP, Token, Wallet */}
        <div className="header-right">
            {isConnected ? (
            <div className="user-section" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>

              {/* Wallet Card */}
              <div className="wallet-card" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                <div className="wallet-avatar" style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: 'white'
                }}>👤</div>
                <div className="wallet-details">
                  <div style={{
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    lineHeight: '1'
                  }}>{formatAddress(address)}</div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '10px',
                    lineHeight: '1',
                    marginTop: '2px'
                  }}>Connected</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    disconnect()
                  }}
                  className="disconnect-btn"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.4)'
                    e.target.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                    e.target.style.transform = 'scale(1)'
                  }}
                  title="Disconnect Wallet"
                >×</button>
              </div>
              </div>
            ) : (
              <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🖱️ Connect button clicked!')
                setShowWalletDropdown(!showWalletDropdown)
              }}
              className="connect-button"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                e.target.style.transform = 'translateY(0px)'
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>🔗</span>
              <span>Connect Wallet</span>
            </button>
          )}
        </div>

      {/* Wallet Selection Overlay - Centered */}
      {showWalletDropdown && (
        <div className="wallet-selection-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000000,
          padding: '140px 20px 20px 20px'
        }}
        onClick={() => setShowWalletDropdown(false)}
        >
          <div className="wallet-modal" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
            animation: 'modalSlideIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>Connect Wallet</h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>Choose your preferred wallet to connect</p>
            </div>

            {/* Wallet Options Grid */}
            <div className="wallet-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => connectWithWallet(wallet.id)}
                  className="wallet-card-option"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 12px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    minHeight: '100px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.9)'
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                    e.target.style.transform = 'translateY(-4px) scale(1.02)'
                    e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)'
                    // Change text color on hover
                    const nameEl = e.target.querySelector('.wallet-name')
                    if (nameEl) nameEl.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.8)'
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    e.target.style.transform = 'translateY(0px) scale(1)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    // Reset text color
                    const nameEl = e.target.querySelector('.wallet-name')
                    if (nameEl) nameEl.style.color = '#1f2937'
                  }}
                >
                  <div style={{
                    fontSize: '32px',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    marginBottom: '4px'
                  }}>{wallet.icon}</div>
                  <div className="wallet-name" style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    fontSize: '14px',
                    transition: 'color 0.3s ease'
                  }}>{wallet.name}</div>
                </button>
              ))}
              </div>
            
            {/* Cancel Button */}
            <div style={{
              textAlign: 'center',
              paddingTop: '8px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <button
                onClick={() => setShowWalletDropdown(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.9)'
                  e.target.style.color = 'white'
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.6)'
                  e.target.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)'
                  e.target.style.color = '#dc2626'
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                <span>✕</span>
                <span>Cancel</span>
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
  )
}

export default Header
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { getLeaderboard } from '../utils/xpUtils'
import { useTransactions } from '../hooks/useTransactions'
import EmbedMeta from '../components/EmbedMeta'
import { Gamepad2, MessageSquare, Coins, Zap, Dice1, Dice6, Trophy, User, Star, Medal, Award, TrendingUp, Image } from 'lucide-react'

const Home = () => {
  const { isConnected } = useAccount()
  const { sendGMTransaction, sendGNTransaction, isLoading: transactionLoading } = useTransactions()
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoadingGM, setIsLoadingGM] = useState(false)
  const [isLoadingGN, setIsLoadingGN] = useState(false)
  const [showAllPlayers, setShowAllPlayers] = useState(false)

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLeaderboardLoading(true)
        console.log('Loading leaderboard for home page...')
        const data = await getLeaderboard()
        console.log('Home page leaderboard data:', data)
        setLeaderboard(data)
      } catch (error) {
        console.error('Error loading leaderboard:', error)
      } finally {
        setLeaderboardLoading(false)
      }
    }

    loadLeaderboard()
    // Refresh every 10 seconds
    const interval = setInterval(loadLeaderboard, 10000)
    return () => clearInterval(interval)
  }, [])

  // AGGRESSIVE: Remove Farcaster headers with JavaScript
  useEffect(() => {
    const removeHeaders = () => {
      // Remove all possible header elements
      const headerSelectors = [
        '*[class*="header"]',
        '*[id*="header"]',
        '*[data-testid*="header"]',
        '*[data-testid*="Header"]',
        '*[class*="Header"]',
        '*[id*="Header"]',
        'header',
        '.farcaster-header',
        '.app-header',
        '.main-header',
        '.top-header',
        '.fixed-header',
        '.sticky-header',
        'div[class*="header"][class*="top"]',
        'div[class*="header"][class*="fixed"]',
        'div[class*="header"][class*="absolute"]',
        'div[class*="header"][class*="sticky"]',
        'div[class*="Header"][class*="Top"]',
        'div[class*="Header"][class*="Fixed"]',
        'div[class*="Header"][class*="Absolute"]',
        'div[class*="Header"][class*="Sticky"]',
        'div[class*="farcaster"]',
        'div[class*="Farcaster"]',
        'div[id*="farcaster"]',
        'div[id*="Farcaster"]',
        'div[data-testid*="farcaster"]',
        'div[data-testid*="Farcaster"]'
      ]

      headerSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(element => {
            if (element && element.parentNode) {
              element.style.display = 'none'
              element.style.visibility = 'hidden'
              element.style.opacity = '0'
              element.style.height = '0'
              element.style.width = '0'
              element.style.overflow = 'hidden'
              element.style.position = 'absolute'
              element.style.left = '-9999px'
              element.style.top = '-9999px'
              element.style.zIndex = '-9999'
              // Try to remove completely
              try {
                element.remove()
              } catch (e) {
                // If can't remove, just hide
              }
            }
          })
        } catch (e) {
          // Ignore errors
        }
      })

      // Force body to start from top
      document.body.style.paddingTop = '0'
      document.body.style.marginTop = '0'
      document.documentElement.style.paddingTop = '0'
      document.documentElement.style.marginTop = '0'
    }

    // Run immediately
    removeHeaders()

    // Run on DOM changes
    const observer = new MutationObserver(removeHeaders)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'style']
    })

    // Run periodically
    const interval = setInterval(removeHeaders, 100)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])



  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Direct transaction functions for GM and GN
  const handleGMClick = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    
    setIsLoadingGM(true)
    setSuccessMessage('')
    
    try {
      const result = await sendGMTransaction('GM from BaseHub! 🎮')
      setSuccessMessage(`🎉 GM sent successfully! +10 XP earned!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('GM transaction failed:', error)
      setSuccessMessage('❌ GM transaction failed. Please try again.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } finally {
      setIsLoadingGM(false)
    }
  }

  const handleGNClick = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    
    setIsLoadingGN(true)
    setSuccessMessage('')
    
    try {
      const result = await sendGNTransaction('GN from BaseHub! 🌙')
      setSuccessMessage(`🌙 GN sent successfully! +10 XP earned!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('GN transaction failed:', error)
      setSuccessMessage('❌ GN transaction failed. Please try again.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } finally {
      setIsLoadingGN(false)
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} style={{ color: '#FFD700' }} />
      case 2:
        return <Medal size={20} style={{ color: '#C0C0C0' }} />
      case 3:
        return <Award size={20} style={{ color: '#CD7F32' }} />
      default:
        return <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>#{rank}</span>
    }
  }

  const games = [
    {
      id: 'gm',
      title: 'GM Game',
      description: 'Send a GM message to earn XP',
      icon: <MessageSquare size={20} />,
      path: '/gm',
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      xpReward: '10 XP',
      bonusXP: null
    },
    {
      id: 'gn',
      title: 'GN Game',
      description: 'Send a GN message to earn XP',
      icon: <MessageSquare size={20} />,
      path: '/gn',
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      xpReward: '10 XP',
      bonusXP: null
    },
    {
      id: 'flip',
      title: 'Coin Flip',
      description: 'Flip a coin and earn XP',
      icon: <Coins size={20} />,
      path: '/flip',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      xpReward: '10 XP',
      bonusXP: '+500 XP (Win)'
    },
    {
      id: 'lucky',
      title: 'Lucky Number',
      description: 'Guess 1-10 and earn XP',
      icon: <Dice1 size={20} />,
      path: '/lucky',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      xpReward: '10 XP',
      bonusXP: '+1000 XP (Win)'
    },
    {
      id: 'dice',
      title: 'Dice Roll',
      description: 'Roll dice and earn XP',
      icon: <Dice6 size={20} />,
      path: '/dice',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      xpReward: '10 XP',
      bonusXP: '+1500 XP (Win)'
    },
    {
      id: 'deploy',
      title: 'Deploy Token',
      description: 'Create your own ERC20 token',
      icon: <Coins size={20} />,
      path: '/deploy',
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      xpReward: '50 XP',
      bonusXP: null
    },
    {
      id: 'nft',
      title: 'NFT Mint',
      description: 'Create and mint your own NFT',
      icon: <Image size={20} />,
      path: '/nft',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      xpReward: '100 XP',
      bonusXP: null
    },
  ]

  return (
    <div className="home">
      <EmbedMeta 
        title="BaseHub - Play Games & Earn XP"
        description="Play games and earn XP on Base network through Farcaster. Join the leaderboard and compete with other players!"
        buttonText="Play BaseHub"
      />
      

      <div className="welcome-section">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1d4ed8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🎮
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              Welcome to BaseHub
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Play games and earn XP on the Base network through Farcaster
            </p>
            
            {!isConnected && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#92400e', margin: 0 }}>
                  💡 Connect your wallet to start playing and earning XP!
                </p>
              </div>
            )}
            
            {/* Success Message */}
            {successMessage && (
              <div style={{
                background: successMessage.includes('❌') 
                  ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                  : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: successMessage.includes('❌') 
                  ? '1px solid #fca5a5'
                  : '1px solid #86efac',
                borderRadius: '12px',
                padding: '12px 16px',
                marginTop: '16px',
                fontSize: '14px',
                fontWeight: '600',
                color: successMessage.includes('❌') ? '#dc2626' : '#16a34a',
                textAlign: 'center',
                animation: 'slideInDown 0.3s ease-out'
              }}>
                {successMessage}
              </div>
            )}
          </div>

          <div className="games-grid">
            {games.map((game) => {
              // For GM and GN, use direct transaction buttons
              if (game.id === 'gm' || game.id === 'gn') {
                return (
                  <button
                    key={game.id}
                    onClick={game.id === 'gm' ? handleGMClick : handleGNClick}
                    disabled={!isConnected || (game.id === 'gm' ? isLoadingGM : isLoadingGN)}
                    className="game-card"
                    style={{ 
                      textDecoration: 'none',
                      border: 'none',
                      cursor: isConnected && !(game.id === 'gm' ? isLoadingGM : isLoadingGN) ? 'pointer' : 'not-allowed',
                      opacity: isConnected && !(game.id === 'gm' ? isLoadingGM : isLoadingGN) ? 1 : 0.6
                    }}
                  >
                  <div 
                    className="game-icon"
                    style={{ background: game.color }}
                  >
                    {game.icon}
                  </div>
                  
                  {/* XP Reward Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#059669',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {game.xpReward}
                  </div>

                  {/* Bonus XP Badge */}
                  {game.bonusXP && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(255, 215, 0, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#92400e',
                      border: '1px solid rgba(146, 64, 14, 0.2)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      {game.bonusXP}
                    </div>
                  )}

                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    color: '#1f2937'
                  }}>
                    {game.title}
                  </h3>
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {(game.id === 'gm' ? isLoadingGM : isLoadingGN) ? 'Sending...' : game.description}
                  </p>
                  </button>
                )
              }
              
              // For other games, use Link
              return (
                <Link 
                  key={game.id} 
                  to={game.path} 
                  className="game-card"
                  style={{ textDecoration: 'none' }}
                >
                  <div 
                    className="game-icon"
                    style={{ background: game.color }}
                  >
                    {game.icon}
                  </div>
                  
                  {/* XP Reward Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#059669',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {game.xpReward}
                  </div>

                  {/* Bonus XP Badge */}
                  {game.bonusXP && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(255, 215, 0, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#92400e',
                      border: '1px solid rgba(146, 64, 14, 0.2)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      {game.bonusXP}
                    </div>
                  )}

                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    color: '#1f2937'
                  }}>
                    {game.title}
                  </h3>
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {game.description}
                  </p>
                </Link>
              )
            })}
          </div>

        </div>
      </div>

      {/* Leaderboard Section */}
      {true && (
        <div style={{ marginTop: '32px' }}>
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '32px', 
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🏆
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: '#1f2937'
              }}>
                Top Players by XP
              </h2>
              <p style={{ 
                color: '#6b7280',
                fontSize: '14px'
              }}>
                See who's leading the BaseHub leaderboard
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              {leaderboard.length > 0 ? leaderboard.slice(0, showAllPlayers ? 10 : 5).map((player, index) => (
                <div
                  key={player.wallet_address}
                  className="leaderboard-item"
                  style={{
                    background: index < 3 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                    border: index < 3 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="rank-icon" style={{ 
                    background: index < 3 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                  }}>
                    {getRankIcon(index + 1)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      marginBottom: '2px'
                    }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {formatAddress(player.wallet_address)}
                      </span>
                      {index < 3 && (
                        <span style={{
                          background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 
                                     index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)' :
                                     'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '8px',
                          fontWeight: 'bold'
                        }}>
                          TOP {index + 1}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <span>Level {player.level}</span>
                      <span>{player.total_xp} XP</span>
                    </div>
                  </div>

                  <div style={{ 
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={14} style={{ color: '#FFD700' }} />
                    <span style={{ 
                      fontWeight: 'bold',
                      color: '#FFD700',
                      fontSize: '14px'
                    }}>
                      {player.total_xp}
                    </span>
                  </div>
                </div>
              )) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    No Players Yet
                  </h3>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    Be the first to play and earn XP!
                  </p>
                </div>
              )}
            </div>

            {leaderboard.length > 5 && !showAllPlayers && (
              <button
                onClick={() => setShowAllPlayers(true)}
                style={{ 
                  width: '100%',
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#6b7280',
                  fontSize: '12px',
                  margin: 0
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.2)'
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)'
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'
                }}
              >
                And {leaderboard.length - 5} more players...
              </button>
            )}
            
            {showAllPlayers && leaderboard.length > 10 && (
              <div style={{ 
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <p style={{ 
                  color: '#059669',
                  fontSize: '12px',
                  margin: 0,
                  fontWeight: 'bold'
                }}>
                  Showing top 10 players out of {leaderboard.length} total players
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

// Modern CSS Styles
const styles = `
  /* AGGRESSIVE: Hide ALL Farcaster Headers */
  *[class*="header"],
  *[id*="header"],
  *[data-testid*="header"],
  *[data-testid*="Header"],
  *[class*="Header"],
  *[id*="Header"],
  header,
  .farcaster-header,
  .app-header,
  .main-header,
  .top-header,
  .fixed-header,
  .sticky-header,
  div[class*="header"][class*="top"],
  div[class*="header"][class*="fixed"],
  div[class*="header"][class*="absolute"],
  div[class*="header"][class*="sticky"],
  div[class*="Header"][class*="Top"],
  div[class*="Header"][class*="Fixed"],
  div[class*="Header"][class*="Absolute"],
  div[class*="Header"][class*="Sticky"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    height: 0 !important;
    width: 0 !important;
    overflow: hidden !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    z-index: -9999 !important;
  }

  /* Hide any element that looks like a header */
  div[style*="position: fixed"][style*="top: 0"],
  div[style*="position: sticky"][style*="top: 0"],
  div[style*="position: absolute"][style*="top: 0"],
  div[style*="position: fixed"][style*="top: 0px"],
  div[style*="position: sticky"][style*="top: 0px"],
  div[style*="position: absolute"][style*="top: 0px"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    height: 0 !important;
  }

  /* Hide specific Farcaster elements */
  div[class*="farcaster"],
  div[class*="Farcaster"],
  div[id*="farcaster"],
  div[id*="Farcaster"],
  div[data-testid*="farcaster"],
  div[data-testid*="Farcaster"] {
    display: none !important;
  }

  /* Force body and html to start from top */
  html, body {
    padding-top: 0 !important;
    margin-top: 0 !important;
    overflow-x: hidden !important;
  }

  /* Hide any top-level containers that might be headers */
  body > div:first-child,
  html > body > div:first-child,
  #root > div:first-child,
  .app > div:first-child {
    display: none !important;
  }

  .home {
    min-height: 100vh;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    padding: 20px;
    margin-top: 0 !important;
    padding-top: 20px !important;
  }

  .welcome-section {
    margin-bottom: 40px;
  }

  .card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-top: 32px;
  }

  .game-card {
    position: relative;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 24px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .game-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .game-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 20px 20px 0 0;
  }

  .game-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
  }

  .game-card:hover .game-icon {
    transform: scale(1.1) rotate(5deg);
  }

  .leaderboard-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .leaderboard-item:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateX(5px);
  }

  .rank-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 14px;
  }

  .loading {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .games-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .card {
      padding: 20px;
    }
    
    .game-card {
      padding: 20px;
    }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { getLeaderboard, getXP } from '../utils/xpUtils'
import { useTransactions } from '../hooks/useTransactions'
import EmbedMeta from '../components/EmbedMeta'
import { Gamepad2, MessageSquare, Coins, Zap, Dice1, Dice6, Trophy, User, Star, Medal, Award, TrendingUp, Image, Flame } from 'lucide-react'

const Home = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { sendGMTransaction, sendGNTransaction, isLoading: transactionLoading } = useTransactions()
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoadingGM, setIsLoadingGM] = useState(false)
  const [isLoadingGN, setIsLoadingGN] = useState(false)
  const [showAllPlayers, setShowAllPlayers] = useState(false)
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  
  // Calculate BHUB tokens from XP (1 XP = 10 BHUB)
  const bhubTokens = userXP * 10

  // Wallet connection handler
  const handleConnect = async () => {
    try {
      console.log('🔗 Attempting wallet connection...')
      
      // Method 1: Try global wallet connect function
      if (window.__walletConnect) {
        console.log('✅ Using global wallet connect')
        window.__walletConnect('injected')
        return
      }
      
      // Method 2: Try w3m-button click
      const w3mButton = document.querySelector('w3m-button')
      if (w3mButton) {
        console.log('✅ Found w3m-button, clicking...')
        w3mButton.click()
        return
      }
      
      // Method 3: Try direct ethereum connection
      if (window.ethereum) {
        console.log('✅ Using direct ethereum connection')
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        return
      }
      
      console.log('❌ No connection method available')
    } catch (error) {
      console.error('❌ Connection failed:', error)
    }
  }

  // Load user XP and level
  useEffect(() => {
    const loadUserXP = async () => {
      if (isConnected && address) {
        try {
          const xp = await getXP(address)
          setUserXP(xp)
          setUserLevel(Math.floor(xp / 100) + 1)
        } catch (error) {
          console.error('Error loading user XP:', error)
          setUserXP(0)
          setUserLevel(1)
        }
      }
    }

    loadUserXP()
    const interval = setInterval(loadUserXP, 5000)
    return () => clearInterval(interval)
  }, [isConnected, address])

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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

  // Load user XP
  useEffect(() => {
    const loadUserXP = async () => {
      if (address) {
        try {
          const totalXP = await getXP(address)
          setUserXP(totalXP || 0)
        } catch (error) {
          console.error('Error loading user XP:', error)
        }
      } else {
        setUserXP(0)
      }
    }

    loadUserXP()
    let interval
    if (address) {
      interval = setInterval(loadUserXP, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [address])




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
    {
      id: 'swap',
      title: 'Token Swap',
      description: 'Trade tokens with best prices',
      icon: '🔄',
      path: '/swap',
      color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      xpReward: '30 XP',
      bonusXP: '+0.3% Revenue'
    },
    {
      id: 'daily-streak',
      title: 'Daily Streak',
      description: 'Claim daily and earn exponential XP',
      icon: <Flame size={20} />,
      path: '/daily-streak',
      color: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      xpReward: '10+ XP',
      bonusXP: 'Exponential growth'
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
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              ⚡ BaseHub
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Play games & earn XP
            </p>

            {/* XP and BHUB Stats */}
            {isConnected && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                {/* XP Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(251, 191, 36, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.05)'
                  e.target.style.boxShadow = '0 12px 25px rgba(251, 191, 36, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px) scale(1)'
                  e.target.style.boxShadow = '0 8px 20px rgba(251, 191, 36, 0.3)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>⚡</div>
                  <div>
                    <div style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>{userXP.toLocaleString()}</div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '12px',
                      fontWeight: '500',
                      lineHeight: '1'
                    }}>XP</div>
                  </div>
                </div>

                {/* BHUB Token Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.05)'
                  e.target.style.boxShadow = '0 12px 25px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px) scale(1)'
                  e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>🪙</div>
                  <div>
                    <div style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '700',
                      lineHeight: '1'
                    }}>{bhubTokens.toLocaleString()}</div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '12px',
                      fontWeight: '500',
                      lineHeight: '1'
                    }}>BHUB</div>
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  disabled
                  style={{
                    background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.3) 0%, rgba(107, 114, 128, 0.3) 100%)',
                    border: '1px solid rgba(156, 163, 175, 0.4)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'not-allowed',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    opacity: '0.6',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>⏰</span>
                  <span>Soon</span>
                </button>
              </div>
            )}
            
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
                    top: '6px',
                    right: '6px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#059669',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    zIndex: 10
                  }}>
                    {game.xpReward}
                  </div>

                  {/* Bonus XP Badge */}
                  {game.bonusXP && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(255, 215, 0, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#92400e',
                      border: '1px solid rgba(146, 64, 14, 0.2)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      zIndex: 10
                    }}>
                      {game.bonusXP}
                    </div>
                  )}

                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px',
                    color: '#1f2937'
                  }}>
                    {game.title}
                  </h3>
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '12px',
                    lineHeight: '1.4'
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
                    top: '6px',
                    right: '6px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: '#059669',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    zIndex: 10
                  }}>
                    {game.xpReward}
                  </div>

                  {/* Bonus XP Badge */}
                  {game.bonusXP && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(255, 215, 0, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#92400e',
                      border: '1px solid rgba(146, 64, 14, 0.2)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      zIndex: 10
                    }}>
                      {game.bonusXP}
                    </div>
                  )}

                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px',
                    color: '#1f2937'
                  }}>
                    {game.title}
                  </h3>
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '12px',
                    lineHeight: '1.4'
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
  /* Hide ONLY specific Farcaster elements - be very specific */
  [data-testid="header"]:not(.header-section),
  [data-testid="app-header"]:not(.header-section),
  .farcaster-header:not(.header-section),
  .app-header:not(.header-section),
  .main-header:not(.header-section),
  .top-header:not(.header-section),
  .fixed-header:not(.header-section),
  .sticky-header:not(.header-section) {
    display: none !important;
  }

  /* Force body and html to start from top */
  html, body {
    padding-top: 0 !important;
    margin-top: 0 !important;
    overflow-x: hidden !important;
  }

  .home {
    min-height: 100vh;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    padding: 20px;
    margin-top: 0 !important;
    padding-top: 60px !important;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
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
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 20px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .game-card {
    position: relative;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    min-height: 120px;
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
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
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
    .home {
      padding-top: 60px;
    }
    
    
    .logo-section {
      gap: 8px !important;
    }
    
    .logo {
      width: 32px !important;
      height: 32px !important;
      font-size: 16px !important;
    }
    
    
    .games-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      max-width: 100%;
    }
    
    .card {
      padding: 20px;
    }
    
    .game-card {
      padding: 10px;
      min-height: 100px;
    }
    
    .game-icon {
      width: 36px !important;
      height: 36px !important;
      margin: 0 auto 6px !important;
    }
  }
`

// Inject styles with cache busting
if (typeof document !== 'undefined') {
  // Remove existing styles first
  const existingStyle = document.getElementById('home-styles')
  if (existingStyle) {
    existingStyle.remove()
  }
  
  const styleSheet = document.createElement('style')
  styleSheet.id = 'home-styles'
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

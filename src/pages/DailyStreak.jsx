import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useDailyStreak } from '../hooks/useDailyStreak'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Trophy, Calendar, Zap, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import EmbedMeta from '../components/EmbedMeta'
import { 
  getDailyStreakLeaderboardByCurrentStreak,
  getDailyStreakLeaderboardByLongestStreak,
  getDailyStreakLeaderboardByTotalXP,
  getDailyStreakLeaderboardByStreakXP,
  getDailyStreakLeaderboardByTotalClaims
} from '../utils/xpUtils'

const DailyStreak = () => {
  const { isConnected } = useAccount()
  const { claimDailyStreak, getStreakData, canClaimToday, isLoading, error } = useDailyStreak()
  const navigate = useNavigate()
  
  const [streakData, setStreakData] = useState(null)
  const [canClaim, setCanClaim] = useState(false)
  const [claimResult, setClaimResult] = useState(null)
  
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardSortBy, setLeaderboardSortBy] = useState('current_streak')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState(null)

  useEffect(() => {
    loadStreakData()
    loadLeaderboard()
  }, [])

  useEffect(() => {
    loadLeaderboard()
  }, [leaderboardSortBy])

  const loadStreakData = async () => {
    try {
      const data = await getStreakData()
      const claimStatus = await canClaimToday()
      setStreakData(data)
      setCanClaim(claimStatus)
    } catch (err) {
      console.error('Failed to load streak data:', err)
    }
  }

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true)
      setLeaderboardError(null)
      
      let data = []
      switch (leaderboardSortBy) {
        case 'current_streak':
          data = await getDailyStreakLeaderboardByCurrentStreak(10, 0)
          break
        case 'longest_streak':
          data = await getDailyStreakLeaderboardByLongestStreak(10, 0)
          break
        case 'total_xp':
          data = await getDailyStreakLeaderboardByTotalXP(10, 0)
          break
        case 'total_xp_from_streaks':
          data = await getDailyStreakLeaderboardByStreakXP(10, 0)
          break
        case 'total_claims':
          data = await getDailyStreakLeaderboardByTotalClaims(10, 0)
          break
        default:
          data = await getDailyStreakLeaderboardByCurrentStreak(10, 0)
      }
      
      setLeaderboard(data)
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setLeaderboardError(err.message)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  const handleClaim = async () => {
    try {
      const result = await claimDailyStreak()
      setClaimResult(result)
      await loadStreakData() // Refresh data
      await loadLeaderboard() // Refresh leaderboard
    } catch (err) {
      console.error('Failed to claim streak:', err)
    }
  }

  const getStreakMultiplier = (streak) => {
    if (streak <= 10) {
      return Math.pow(2, streak - 1) // 1, 2, 4, 8, 16... for first 10 days
    } else {
      return Math.pow(2, 9) * 1.2 // 20% bonus after 10 days
    }
  }

  const getNextXP = (streak) => {
    return streakData?.nextXP || 10
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <span style={{ fontSize: '20px' }}>🥇</span>
      case 2:
        return <span style={{ fontSize: '20px' }}>🥈</span>
      case 3:
        return <span style={{ fontSize: '20px' }}>🥉</span>
      default:
        return <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>#{rank}</span>
    }
  }

  const formatWalletAddress = (address) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getSortLabel = () => {
    const sortOptions = [
      { value: 'current_streak', label: 'Current Streak' },
      { value: 'longest_streak', label: 'Longest Streak' },
      { value: 'total_xp', label: 'Total XP' },
      { value: 'total_xp_from_streaks', label: 'Streak XP' },
      { value: 'total_claims', label: 'Total Claims' }
    ]
    const option = sortOptions.find(opt => opt.value === leaderboardSortBy)
    return option ? option.label : 'Current Streak'
  }

  return (
    <div className="daily-streak-page">
      <EmbedMeta 
        title="Daily Streak - BaseHub"
        description="Claim your daily streak and earn exponential XP rewards! Don't break the chain!"
        buttonText="Claim Daily Streak"
      />
      
      <div className="back-button-container">
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="streak-container">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🔥
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              Daily Streak
            </h1>
            <p style={{ 
              color: '#6b7280',
              fontSize: '16px'
            }}>
              Claim daily and watch your XP multiply!
            </p>
          </div>

          {streakData && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div className="stat-card">
                  <Flame size={24} style={{ color: '#ff6b35' }} />
                  <div>
                    <span className="stat-value">{streakData.currentStreak}</span>
                    <span className="stat-label">Current Streak</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <Trophy size={24} style={{ color: '#ffd700' }} />
                  <div>
                    <span className="stat-value">{streakData.longestStreak}</span>
                    <span className="stat-label">Longest Streak</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <Zap size={24} style={{ color: '#10b981' }} />
                  <div>
                    <span className="stat-value">{streakData.totalXP}</span>
                    <span className="stat-label">Streak XP</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <Calendar size={24} style={{ color: '#3b82f6' }} />
                  <div>
                    <span className="stat-value">{streakData.totalClaims}</span>
                    <span className="stat-label">Total Claims</span>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  color: '#1f2937'
                }}>
                  Next Claim Reward
                </h3>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  color: '#ff6b35',
                  marginBottom: '8px'
                }}>
                  {getNextXP(streakData.currentStreak)} XP
                </div>
                <p style={{ 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  {streakData.currentStreak === 0 ? 'Start your streak!' : `Day ${streakData.currentStreak + 1} reward`}
                </p>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            {!isConnected ? (
              <div style={{ 
                padding: '20px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#ef4444'
              }}>
                Please connect your wallet to claim daily streak
              </div>
            ) : !canClaim ? (
              <div style={{ 
                padding: '20px',
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.2)',
                borderRadius: '8px',
                color: '#6b7280'
              }}>
                <Clock size={24} style={{ marginBottom: '8px' }} />
                <p>You've already claimed today!</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>
                  Come back tomorrow to continue your streak
                </p>
              </div>
            ) : (
              <button 
                onClick={handleClaim}
                disabled={isLoading}
                className="claim-button"
                style={{
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
              >
                {isLoading ? (
                  <>
                    <div className="loading" style={{ width: '20px', height: '20px' }} />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Flame size={20} />
                    Claim Daily Streak
                  </>
                )}
              </button>
            )}

            {error && (
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {claimResult && (
              <div style={{ 
                marginTop: '16px',
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#10b981'
              }}>
                <h4 style={{ marginBottom: '8px' }}>🎉 Streak Claimed!</h4>
                <p>Streak: {claimResult.streak} days</p>
                <p>XP Earned: {claimResult.xpEarned}</p>
                <p>Total Streak XP: {claimResult.totalXP}</p>
                {claimResult.longestStreak && (
                  <p>Longest Streak: {claimResult.longestStreak} days</p>
                )}
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: '32px',
            padding: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              🔥 How Daily Streak Works:
            </h3>
            <ul style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: 0,
              paddingLeft: '20px',
              textAlign: 'left'
            }}>
              <li>Claim daily to maintain your streak</li>
              <li>XP doubles with each consecutive day (10, 20, 40, 80...)</li>
              <li>Missing a day resets your streak to 0</li>
              <li>Fee: 0.00002 ETH per claim</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="leaderboard-container" style={{ marginTop: '32px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '8px'
            }}>
              🏆
            </div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              Top Streak Champions
            </h2>
            <p style={{ 
              color: '#6b7280',
              fontSize: '14px'
            }}>
              See who's leading the daily streak race
            </p>
          </div>

          {/* Sort Options */}
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            marginBottom: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {[
              { value: 'current_streak', label: 'Current', icon: <Flame size={14} /> },
              { value: 'longest_streak', label: 'Longest', icon: <Trophy size={14} /> },
              { value: 'total_xp', label: 'Total XP', icon: <Zap size={14} /> },
              { value: 'total_xp_from_streaks', label: 'Streak XP', icon: <Flame size={14} /> },
              { value: 'total_claims', label: 'Claims', icon: <Calendar size={14} /> }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setLeaderboardSortBy(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: leaderboardSortBy === option.value ? '#ff6b35' : '#e5e7eb',
                  background: leaderboardSortBy === option.value ? 'rgba(255, 107, 53, 0.1)' : 'white',
                  color: leaderboardSortBy === option.value ? '#ff6b35' : '#6b7280',
                  fontSize: '12px',
                  fontWeight: leaderboardSortBy === option.value ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {leaderboardLoading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: '#6b7280'
            }}>
              <div className="loading" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '14px' }}>Loading leaderboard...</p>
            </div>
          )}

          {/* Error State */}
          {leaderboardError && (
            <div style={{ 
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              color: '#ef4444',
              textAlign: 'center',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {leaderboardError}
            </div>
          )}

          {/* Leaderboard */}
          {!leaderboardLoading && !leaderboardError && leaderboard.length > 0 && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  Sorted by: {getSortLabel()}
                </h3>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px'
              }}>
                {leaderboard.map((player, index) => (
                  <div
                    key={player.wallet_address}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: player.wallet_address === address ? 'rgba(255, 107, 53, 0.1)' : 'rgba(249, 250, 251, 0.8)',
                      border: player.wallet_address === address ? '2px solid #ff6b35' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      width: '32px', 
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      {getRankIcon(index + 1)}
                    </div>
                    
                    <div style={{ 
                      flex: 1, 
                      marginLeft: '12px',
                      minWidth: 0
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        {formatWalletAddress(player.wallet_address)}
                        {player.wallet_address === address && (
                          <span style={{ 
                            marginLeft: '6px',
                            fontSize: '10px',
                            color: '#ff6b35',
                            fontWeight: 'bold'
                          }}>
                            (You)
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <span>🔥 {player.current_streak}</span>
                        <span>🏆 {player.longest_streak}</span>
                        <span>⚡ {player.total_xp || 0}</span>
                        <span>🔥 {player.total_xp_from_streaks || 0}</span>
                        <span>📅 {player.total_claims}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!leaderboardLoading && !leaderboardError && leaderboard.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              color: '#6b7280'
            }}>
              <Flame size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No streaks yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyStreak

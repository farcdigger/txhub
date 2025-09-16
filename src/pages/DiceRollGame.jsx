import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useTransactions } from '../hooks/useTransactions'
import { useFarcaster } from '../contexts/FarcasterContext'
import { useSupabase } from '../hooks/useSupabase'
import EmbedMeta from '../components/EmbedMeta'
import BackButton from '../components/BackButton'
import { Dice6, Send, Star, CheckCircle, ExternalLink, Coins, TrendingUp, TrendingDown } from 'lucide-react'

const DiceRollGame = () => {
  const { isConnected, address } = useAccount()
  const { sendDiceRollTransaction, isLoading, error } = useTransactions()
  const { isInFarcaster } = useFarcaster()
  const { calculateTokens } = useSupabase()
  const [selectedNumber, setSelectedNumber] = useState(1)
  const [lastPlayed, setLastPlayed] = useState(null)
  const [totalXP, setTotalXP] = useState(0)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [gameResult, setGameResult] = useState(null)

  const playDiceRoll = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const result = await sendDiceRollTransaction(selectedNumber)
      setLastTransaction(result)
      setLastPlayed(new Date())
      
      // Simulate dice roll result
      const rolledNumber = Math.floor(Math.random() * 6) + 1
      const won = rolledNumber === selectedNumber
      
      setGameResult({
        rolledNumber,
        selectedNumber,
        won
      })
      
      // Calculate XP earned
      let xpEarned = 10 // Base XP for playing
      if (won) {
        xpEarned += 1500 // Massive bonus XP for winning
      }
      
      setTotalXP(prev => prev + xpEarned)
    } catch (error) {
      console.error('Dice roll failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Dice6 size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: '#1f2937'
          }}>
            Connect Wallet to Play
          </h2>
          <p style={{ color: '#6b7280' }}>
            Please connect your wallet to start playing the dice roll game
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <EmbedMeta 
        title="Dice Roll Game - BaseHub"
        description="Roll two dice and win XP! 1/36 chance to win 1500 bonus XP. Play now on BaseHub!"
        buttonText="Play Dice Roll"
      />
      
      <BackButton />
      
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div 
          className="game-icon"
          style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            margin: '0 auto 16px'
          }}
        >
          <Dice6 size={32} style={{ color: 'white' }} />
        </div>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          Dice Roll Game
        </h1>
        <p style={{ 
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Roll the dice and guess the result to earn XP!
        </p>
      </div>

      {gameResult && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          justifyContent: 'center',
          padding: '12px',
          background: gameResult.won ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: gameResult.won ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {gameResult.won ? (
            <TrendingUp size={20} style={{ color: '#10b981' }} />
          ) : (
            <TrendingDown size={20} style={{ color: '#ef4444' }} />
          )}
          <span style={{ 
            fontWeight: 'bold',
            color: gameResult.won ? '#10b981' : '#ef4444'
          }}>
            {gameResult.won ? 'You Won!' : 'You Lost!'} 
            Your guess: {gameResult.selectedNumber}, Rolled: {gameResult.rolledNumber}
          </span>
        </div>
      )}

      {lastPlayed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <CheckCircle size={20} style={{ color: '#f59e0b' }} />
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            Last played: {lastPlayed.toLocaleTimeString()}
          </span>
        </div>
      )}

      {lastTransaction && (
        <div style={{ 
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ExternalLink size={16} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
              Transaction Hash:
            </span>
          </div>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            color: '#6b7280',
            wordBreak: 'break-all'
          }}>
            {lastTransaction.hash || lastTransaction.transactionHash}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          Choose your dice number (1-6):
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3, 4, 5, 6].map((number) => (
            <button
              key={number}
              onClick={() => setSelectedNumber(number)}
              className={`btn ${selectedNumber === number ? 'btn-primary' : ''}`}
              style={{ 
                padding: '16px',
                fontSize: '24px',
                fontWeight: 'bold',
                background: selectedNumber === number 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                  : 'rgba(255, 255, 255, 0.8)',
                color: selectedNumber === number ? 'white' : '#1f2937',
                border: selectedNumber === number 
                  ? 'none' 
                  : '2px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={playDiceRoll}
          disabled={isLoading}
          className="btn btn-primary"
          style={{ 
            width: '100%',
            background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          }}
        >
          {isLoading ? (
            <>
              <div className="loading" />
              Rolling Dice...
            </>
          ) : (
            <>
              <Send size={20} />
              Roll Dice for {selectedNumber}
            </>
          )}
        </button>

        {error && (
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '32px',
        padding: '20px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '12px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: '#1f2937'
        }}>
          How to Play:
        </h3>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          color: '#6b7280',
          fontSize: '14px',
          lineHeight: '1.6',
          paddingLeft: '20px'
        }}>
          <li>Choose a number from 1 to 6 (dice faces)</li>
          <li>Earn 10 XP for playing, +1500 bonus XP for winning</li>
          <li>1 XP = 50 BHUP tokens (claim coming soon!)</li>
          <li>Your wallet address: {address?.slice(0, 6)}...{address?.slice(-4)}</li>
        </ul>
      </div>
    </div>
  )
}

export default DiceRollGame
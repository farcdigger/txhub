import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { useTransactions } from '../hooks/useTransactions'
import { useFarcaster } from '../contexts/FarcasterContext'
import { useSupabase } from '../hooks/useSupabase'
import EmbedMeta from '../components/EmbedMeta'
import BackButton from '../components/BackButton'
import { Coins, RotateCcw, TrendingUp, TrendingDown, Star } from 'lucide-react'

const FlipGame = () => {
  const { isConnected, address } = useAccount()
  const { sendFlipTransaction, isLoading, error } = useTransactions()
  const { isInFarcaster } = useFarcaster()
  const { calculateTokens } = useSupabase()
  const [selectedSide, setSelectedSide] = useState('heads')
  const [result, setResult] = useState(null)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [totalXP, setTotalXP] = useState(0)

  const flipCoin = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const result = await sendFlipTransaction(selectedSide)
      setLastTransaction(result)
      
      // Simulate coin flip result
      const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
      setResult(flipResult)
      
      // Calculate XP earned
      let xpEarned = 10 // Base XP for playing
      const won = flipResult === selectedSide
      if (won) {
        xpEarned += 500 // Massive bonus XP for winning
      }
      
      setTotalXP(prev => prev + xpEarned)
    } catch (error) {
      console.error('Coin flip failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Coins size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: '#1f2937'
          }}>
            Connect Wallet to Play
          </h2>
          <p style={{ color: '#6b7280' }}>
            Please connect your wallet to start playing the coin flip game
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <EmbedMeta 
        title="Flip Game - BaseHub"
        description="Flip a coin and win XP! 50% chance to win 500 bonus XP. Play now on BaseHub!"
        buttonText="Play Flip Game"
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
          <Coins size={32} style={{ color: 'white' }} />
        </div>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          Coin Flip Game
        </h1>
        <p style={{ 
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Bet on heads or tails and earn XP!
        </p>
      </div>

      {result && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          justifyContent: 'center',
          padding: '12px',
          background: result === selectedSide ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: result === selectedSide ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {result === selectedSide ? (
            <TrendingUp size={20} style={{ color: '#10b981' }} />
          ) : (
            <TrendingDown size={20} style={{ color: '#ef4444' }} />
          )}
          <span style={{ 
            fontWeight: 'bold',
            color: result === selectedSide ? '#10b981' : '#ef4444'
          }}>
            {result === selectedSide ? 'You Won!' : 'You Lost!'} 
            Result: {result}
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
            <Star size={16} style={{ color: '#3b82f6' }} />
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
          Choose your side:
        </h3>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setSelectedSide('heads')}
            className={`btn ${selectedSide === 'heads' ? 'btn-primary' : ''}`}
            style={{ 
              flex: 1,
              background: selectedSide === 'heads' 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                : 'rgba(255, 255, 255, 0.8)',
              color: selectedSide === 'heads' ? 'white' : '#1f2937',
              border: selectedSide === 'heads' 
                ? 'none' 
                : '2px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            🪙 Heads
          </button>
          <button
            onClick={() => setSelectedSide('tails')}
            className={`btn ${selectedSide === 'tails' ? 'btn-primary' : ''}`}
            style={{ 
              flex: 1,
              background: selectedSide === 'tails' 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                : 'rgba(255, 255, 255, 0.8)',
              color: selectedSide === 'tails' ? 'white' : '#1f2937',
              border: selectedSide === 'tails' 
                ? 'none' 
                : '2px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            🪙 Tails
          </button>
        </div>

        <button
          onClick={flipCoin}
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
              Flipping Coin...
            </>
          ) : (
            <>
              <RotateCcw size={20} />
              Flip Coin for {selectedSide}
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
          <li>Choose heads or tails and flip the coin</li>
          <li>Earn 10 XP for playing, +500 bonus XP for winning</li>
          <li>1 XP = 50 BHUP tokens (claim coming soon!)</li>
          <li>Your wallet address: {address?.slice(0, 6)}...{address?.slice(-4)}</li>
        </ul>
      </div>
    </div>
  )
}

export default FlipGame
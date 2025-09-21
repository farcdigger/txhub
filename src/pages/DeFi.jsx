import React from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Swap } from '@coinbase/onchainkit/swap'
import EmbedMeta from '../components/EmbedMeta'

const DeFi = () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  // Base network tokens - following Base documentation
  const eth = {
    name: 'ETH',
    address: '',
    symbol: 'ETH',
    decimals: 18,
    image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
    chainId: 8453,
  }

  const usdc = {
    name: 'USDC',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    decimals: 6,
    image: 'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2',
    chainId: 8453,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px'
    }}>
      <EmbedMeta 
        title="DeFi Hub - BaseHub"
        description="Swap tokens on Base network."
        buttonText="Go to DeFi Hub"
      />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', maxWidth: '420px', margin: '0 auto 32px auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '12px',
            marginRight: 'auto',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ff007a 0%, #ff6b35 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🔄
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#ffffff',
          letterSpacing: '-0.02em'
        }}>
          DeFi Hub
        </h1>
        <p style={{
          color: '#8b8b8b',
          fontSize: '16px',
          margin: '0'
        }}>
          Trade tokens on Base network
        </p>
      </div>
        
        {isConnected ? (
          <div style={{
            maxWidth: '420px',
            margin: '0 auto'
          }}>
            <Swap
              from={[eth]}
              to={[usdc]}
            />
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(249, 250, 251, 0.8)',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>Connect Your Wallet</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Connect your wallet to access the token swap feature.
            </p>
            <a
              href="https://app.uniswap.org/swap?chain=base"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              🔄 Use Uniswap Instead
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeFi
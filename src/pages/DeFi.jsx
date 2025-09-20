import React from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
// import { Swap } from '@coinbase/onchainkit/swap'
import EmbedMeta from '../components/EmbedMeta'

const DeFi = () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  // Base network tokens
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
    <div className="defi-page">
      <EmbedMeta 
        title="DeFi Hub - BaseHub"
        description="Swap tokens on Base network."
        buttonText="Go to DeFi Hub"
      />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0',
            marginRight: 'auto'
          }}
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '8px'
          }}>
            🔄
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#1f2937'
          }}>
            Token Swap
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Swap between ETH and USDC tokens
          </p>
        </div>
        
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'rgba(249, 250, 251, 0.8)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>Token Swap</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Swap ETH and USDC tokens on Base network using Uniswap.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', maxWidth: '600px', margin: '0 auto' }}>
            <a
              href="https://app.uniswap.org/swap?chain=base"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                textAlign: 'center',
                display: 'block'
              }}
            >
              🔄 Uniswap
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>ETH ↔ USDC</div>
            </a>
            
            <a
              href="https://app.1inch.io/#/1/swap/ETH/USDC"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                textAlign: 'center',
                display: 'block'
              }}
            >
              🎯 1inch
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Best Prices</div>
            </a>
            
            <a
              href="https://app.sushi.com/swap"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                textAlign: 'center',
                display: 'block'
              }}
            >
              🍣 SushiSwap
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Multi-chain</div>
            </a>
          </div>
          
          {isConnected && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <p style={{ color: '#059669', margin: 0, fontSize: '14px' }}>
                ✅ Wallet Connected: {isConnected ? 'Ready to swap!' : 'Please connect your wallet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeFi
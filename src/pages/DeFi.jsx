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
        
        {isConnected ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            padding: '24px',
            border: '2px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)',
            backdropFilter: 'blur(10px)',
            maxWidth: '450px',
            margin: '0 auto'
          }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '20px',
              padding: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                🔄 OnchainKit Swap
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                ETH ↔ USDC on Base Network
              </p>
            </div>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <Swap
                from={[eth]}
                to={[usdc]}
              />
            </div>
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
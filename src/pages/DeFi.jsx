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
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1f2937', fontSize: '18px', fontWeight: 'bold' }}>
              🔄 OnchainKit Swap
            </h3>
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
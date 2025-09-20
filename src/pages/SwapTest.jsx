import React from 'react'
import { useAccount } from 'wagmi'
// import { Swap } from '@coinbase/onchainkit/swap'

const SwapTest = () => {
  const { isConnected } = useAccount()

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
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Token Swap</h2>
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'rgba(249, 250, 251, 0.8)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Swap Platforms</h3>
        <p style={{ marginBottom: '20px', color: '#6b7280' }}>
          Use these platforms for token swapping on Base network:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <a
            href="https://app.uniswap.org/swap?chain=base"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              padding: '16px 20px',
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
              padding: '16px 20px',
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
              ✅ Wallet Connected: Ready to swap!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SwapTest
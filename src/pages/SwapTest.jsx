import React from 'react'
import { useAccount } from 'wagmi'
import { SwapDefault } from '@coinbase/onchainkit/swap'

const SwapTest = () => {
  const { isConnected } = useAccount()

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
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Token Swap</h2>
      
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
          <SwapDefault
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
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>Connect Wallet to Swap</h3>
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>
            Please connect your wallet to use the swap feature.
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
              fontWeight: 'bold'
            }}
          >
            🔄 Use Uniswap Instead
          </a>
        </div>
      )}
    </div>
  )
}

export default SwapTest
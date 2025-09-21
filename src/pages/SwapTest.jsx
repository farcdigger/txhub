import React from 'react'
import { useAccount } from 'wagmi'
import { Swap } from '@coinbase/onchainkit/swap'

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
          background: '#1a1a1a',
          borderRadius: '24px',
          padding: '0',
          border: '1px solid #2d2d2d',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '420px',
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          {/* Modern Uniswap-style Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            padding: '20px 24px',
            borderBottom: '1px solid #2d2d2d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #ff007a 0%, #ff6b35 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🔄
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#ffffff',
                  lineHeight: '1.2'
                }}>
                  Swap
                </h3>
                <p style={{ 
                  margin: '2px 0 0 0', 
                  fontSize: '12px', 
                  color: '#8b8b8b',
                  lineHeight: '1.2'
                }}>
                  Trade tokens
                </p>
              </div>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#2d2d2d',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid #404040'
            }}>
              ⚙️
            </div>
          </div>

          {/* Swap Component Container */}
          <div style={{
            background: '#1a1a1a',
            padding: '0'
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
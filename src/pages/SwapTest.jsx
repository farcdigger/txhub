import React from 'react'
import { useAccount } from 'wagmi'
import { SwapDefault } from '@coinbase/onchainkit/swap'
// Token type definition for Base network

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

  if (!isConnected) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: 'rgba(249, 250, 251, 0.8)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h2>Connect Wallet to Swap</h2>
        <p>Please connect your wallet to use the swap feature.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Token Swap</h2>
      <SwapDefault
        from={[eth]}
        to={[usdc]}
      />
    </div>
  )
}

export default SwapTest

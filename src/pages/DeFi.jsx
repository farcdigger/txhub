import React from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, TrendingUp, CreditCard, Coins } from 'lucide-react'
import { SwapDefault } from '@coinbase/onchainkit/swap'
import { Earn } from '@coinbase/onchainkit/earn'
import { Buy } from '@coinbase/onchainkit/buy'
import { FundCard } from '@coinbase/onchainkit/fund'
import type { Token } from '@coinbase/onchainkit/token'
import EmbedMeta from '../components/EmbedMeta'

const DeFi = () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  // Base network tokens
  const eth: Token = {
    name: 'ETH',
    address: '',
    symbol: 'ETH',
    decimals: 18,
    image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
    chainId: 8453,
  }

  const usdc: Token = {
    name: 'USDC',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    decimals: 6,
    image: 'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2',
    chainId: 8453,
  }

  const bhub: Token = {
    name: 'BHUB Token',
    address: '0xB2b2c587E51175a2aE4713d8Ea68A934a8527a4b',
    symbol: 'BHUB',
    decimals: 18,
    image: 'https://base.org/favicon.ico',
    chainId: 8453,
  }

  // All available tokens for swapping
  const availableTokens = [eth, usdc, bhub]

  return (
    <div className="defi-page">
      <EmbedMeta 
        title="DeFi Hub - BaseHub"
        description="Swap tokens, earn yield, and manage your DeFi portfolio on Base network"
        buttonText="Use DeFi Hub"
      />

      {/* Header */}
      <div className="header-section">
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                color: '#3b82f6',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <ArrowLeft size={16} />
              Back to Games
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px'
            }}>
              🏦
            </div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              DeFi Hub
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Swap tokens, earn yield, and manage your portfolio
            </p>
          </div>

          {!isConnected && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#92400e', margin: 0 }}>
                💡 Connect your wallet to access DeFi features!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DeFi Components Grid */}
      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Token Swap */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowRightLeft size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '4px',
                color: '#1f2937'
              }}>
                Token Swap
              </h2>
              <p style={{ 
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Swap between ETH, USDC, and BHUB tokens
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <SwapDefault
              from={availableTokens}
              to={availableTokens}
              experimental={{ useAggregator: false }}
            />
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280' }}>Connect wallet to swap tokens</p>
            </div>
          )}
        </div>

        {/* Yield Farming */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '4px',
                color: '#1f2937'
              }}>
                Yield Farming
              </h2>
              <p style={{ 
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Earn yield on your assets with Morpho vaults
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <Earn vaultAddress="0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A" />
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280' }}>Connect wallet to start earning yield</p>
            </div>
          )}
        </div>

        {/* Buy Tokens */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '4px',
                color: '#1f2937'
              }}>
                Buy Tokens
              </h2>
              <p style={{ 
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Purchase tokens with fiat using Coinbase, Apple Pay, or debit card
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <Buy toToken={bhub} />
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280' }}>Connect wallet to buy tokens</p>
            </div>
          )}
        </div>

        {/* Fund Wallet */}
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coins size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '4px',
                color: '#1f2937'
              }}>
                Fund Wallet
              </h2>
              <p style={{ 
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Add funds to your wallet with fiat onramp
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <FundCard
              assetSymbol="ETH"
              country="US"
              currency="USD"
            />
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#6b7280' }}>Connect wallet to fund your account</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeFi

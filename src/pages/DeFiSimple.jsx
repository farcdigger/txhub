import React from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, TrendingUp, CreditCard, Coins, ExternalLink } from 'lucide-react'
import EmbedMeta from '../components/EmbedMeta'

const DeFiSimple = () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  const defiLinks = [
    {
      title: 'Uniswap V3',
      description: 'Swap tokens on Base network',
      icon: <ArrowRightLeft size={20} />,
      url: 'https://app.uniswap.org/#/swap?chain=base',
      color: 'linear-gradient(135deg, #ff007a 0%, #ff6b35 100%)'
    },
    {
      title: 'Morpho Vaults',
      description: 'Earn yield on your assets',
      icon: <TrendingUp size={20} />,
      url: 'https://app.morpho.org/base/earn',
      color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    },
    {
      title: 'Coinbase Wallet',
      description: 'Buy crypto with fiat',
      icon: <CreditCard size={20} />,
      url: 'https://wallet.coinbase.com/',
      color: 'linear-gradient(135deg, #0052ff 0%, #00d4ff 100%)'
    },
    {
      title: 'Base Bridge',
      description: 'Bridge assets to Base',
      icon: <Coins size={20} />,
      url: 'https://bridge.base.org/',
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  ]

  return (
    <div className="defi-page">
      <EmbedMeta 
        title="DeFi Hub - BaseHub"
        description="Access DeFi protocols and tools on Base network"
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
              Access DeFi protocols and tools on Base network
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

      {/* DeFi Links Grid */}
      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {defiLinks.map((defi, index) => (
          <div key={index} className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: defi.color,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {defi.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  color: '#1f2937'
                }}>
                  {defi.title}
                </h2>
                <p style={{ 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  {defi.description}
                </p>
              </div>
            </div>
            
            <a
              href={defi.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: defi.color,
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Open {defi.title}
              <ExternalLink size={16} />
            </a>
          </div>
        ))}

        {/* Coming Soon Section */}
        <div className="card">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '12px'
            }}>
              🚀
            </div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1f2937'
            }}>
              More DeFi Features Coming Soon!
            </h3>
            <p style={{ 
              color: '#6b7280',
              fontSize: '14px'
            }}>
              We're working on integrating more DeFi protocols directly into BaseHub
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeFiSimple

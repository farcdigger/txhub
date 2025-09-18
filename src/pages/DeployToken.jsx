import React, { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useDeployToken } from '../hooks/useDeployToken'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins, Zap, CheckCircle, ExternalLink } from 'lucide-react'
import EmbedMeta from '../components/EmbedMeta'
import { getXP } from '../utils/xpUtils'

const DeployToken = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { deployToken, isLoading, error } = useDeployToken()
  const navigate = useNavigate()
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  
  // Calculate BHUB tokens from XP (1 XP = 10 BHUB)
  const bhubTokens = userXP * 10

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Load user XP and level
  useEffect(() => {
    const loadUserXP = async () => {
      if (isConnected && address) {
        try {
          const xp = await getXP(address)
          setUserXP(xp)
          setUserLevel(Math.floor(xp / 100) + 1)
        } catch (error) {
          console.error('Error loading user XP:', error)
          setUserXP(0)
          setUserLevel(1)
        }
      }
    }

    loadUserXP()
    const interval = setInterval(loadUserXP, 5000)
    return () => clearInterval(interval)
  }, [isConnected, address])
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    initialSupply: '',
    decimals: '18'
  })
  
  const [deployResult, setDeployResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDeploy = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const result = await deployToken(
        formData.name,
        formData.symbol,
        formData.initialSupply,
        parseInt(formData.decimals)
      )
      
      setDeployResult(result)
    } catch (error) {
      console.error('Deploy failed:', error)
    }
  }

  return (
    <div className="deploy-token-page">
      <EmbedMeta 
        title="Deploy Token - BaseHub"
        description="Deploy your own ERC20 token on Base network"
        buttonText="Deploy Token"
      />
      
      {/* Header */}
      <div className="header-section">
        <div className="header-left">
          <button
            onClick={() => navigate('/')}
            className="home-button"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
        </div>
        
        <div className="header-center">
          <h1 className="header-title">🪙 Deploy Token</h1>
          <p className="header-subtitle">Create your ERC20 token</p>
        </div>
        
        <div className="header-right">
          {isConnected ? (
            <div className="user-section">
              {/* XP Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <span style={{
                  color: '#1f2937',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>{userXP}</span>
              </div>

              {/* BHUB Token Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 193, 7, 0.2)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>
                <span style={{ fontSize: '16px' }}>💎</span>
                <span style={{
                  color: '#1f2937',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>{bhubTokens}</span>
              </div>

              {/* Claim Button */}
              <button style={{
                background: 'rgba(156, 163, 175, 0.3)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                borderRadius: '20px',
                padding: '6px 16px',
                color: '#6b7280',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'not-allowed',
                opacity: 0.8
              }} disabled>
                Soon
              </button>

              {/* Wallet Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <span style={{
                  color: '#1f2937',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>{formatAddress(address)}</span>
                <button
                  onClick={() => disconnect()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <button
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <div className="deploy-container" style={{ paddingTop: '100px' }}>
        <div className="deploy-header">
          <div className="deploy-icon">
            <Coins size={32} />
          </div>
          <h1>Deploy Your Token</h1>
          <p>Create your own ERC20 token on Base network</p>
        </div>

        {!deployResult ? (
          <form onSubmit={handleDeploy} className="deploy-form">
            <div className="form-group">
              <label htmlFor="name">Token Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., My Token"
                maxLength="20"
                required
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                Max 20 characters for Farcaster compatibility
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="symbol">Token Symbol</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., MTK"
                maxLength="10"
                required
              />
              <small style={{ color: '#6b7280', fontSize: '12px' }}>
                Max 10 characters for Farcaster compatibility
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="initialSupply">Initial Supply</label>
              <input
                type="number"
                id="initialSupply"
                name="initialSupply"
                value={formData.initialSupply}
                onChange={handleInputChange}
                placeholder="e.g., 1000000"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="decimals">Decimals</label>
              <select
                id="decimals"
                name="decimals"
                value={formData.decimals}
                onChange={handleInputChange}
              >
                <option value="18">18 (Standard)</option>
                <option value="6">6 (USDC style)</option>
                <option value="8">8 (BTC style)</option>
              </select>
            </div>

            <div className="deploy-info">
              <div className="info-item">
                <Zap size={16} />
                <span>Deploy Fee: 0.00005 ETH</span>
              </div>
              <div className="info-item">
                <Coins size={16} />
                <span>Network: Base Mainnet</span>
              </div>
              <div className="info-item">
                <Zap size={16} />
                <span>XP Reward: +50 XP</span>
              </div>
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="deploy-button"
              disabled={!isConnected || isLoading}
            >
              {isLoading ? 'Deploying Token...' : 'Deploy Token'}
            </button>
            
            {isLoading && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                color: '#0369a1',
                padding: '12px 16px',
                borderRadius: '8px',
                marginTop: '16px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                ⏳ Please confirm the transaction in your wallet. This may take a few moments...
              </div>
            )}
          </form>
        ) : (
          <div className="deploy-success">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h2>Token Deployed Successfully!</h2>
            
            <div className="deploy-details">
              <div className="detail-item">
                <strong>Token Name:</strong> {formData.name}
              </div>
              <div className="detail-item">
                <strong>Symbol:</strong> {formData.symbol}
              </div>
              <div className="detail-item">
                <strong>Initial Supply:</strong> {formData.initialSupply} {formData.symbol}
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                <div className="status-message">
                  {deployResult.status || 'Fee paid successfully!'}
                </div>
              </div>
              {deployResult.xpEarned && (
                <div className="detail-item">
                  <strong>XP Earned:</strong>
                  <div className="status-message" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a' }}>
                    🎉 +{deployResult.xpEarned} XP earned!
                  </div>
                </div>
              )}
              <div className="detail-item">
                <strong>Fee Transaction:</strong>
                <div className="tx-hash">
                  {formatAddress(deployResult.txHash)}
                  <a 
                    href={`https://basescan.org/tx/${deployResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-button"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                </div>
              </div>
              {deployResult.contractAddress && (
                <div className="detail-item">
                  <strong>Contract Address:</strong>
                  <div className="contract-address">
                    {formatAddress(deployResult.contractAddress)}
                    <button 
                      onClick={() => navigator.clipboard.writeText(deployResult.contractAddress)}
                      className="copy-button"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="success-actions">
              <button 
                onClick={() => {
                  setDeployResult(null)
                  setFormData({ name: '', symbol: '', initialSupply: '', decimals: '18' })
                }}
                className="deploy-another-button"
              >
                Deploy Another Token
              </button>
              <button 
                onClick={() => navigate('/')}
                className="home-button"
              >
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeployToken

// Header CSS styles for consistency
const headerStyles = `
  .header-section {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 9999 !important;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    visibility: visible !important;
    opacity: 1 !important;
    height: auto !important;
    width: auto !important;
    overflow: visible !important;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-center {
    text-align: center;
    flex: 1;
  }

  .header-title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 2px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
`

// Inject header styles
if (typeof document !== 'undefined' && !document.getElementById('deploy-header-styles')) {
  const style = document.createElement('style')
  style.id = 'deploy-header-styles'
  style.textContent = headerStyles
  document.head.appendChild(style)
}

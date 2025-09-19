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

  // Wallet connection handler
  const handleConnect = async () => {
    try {
      console.log('🔗 Attempting wallet connection...')
      
      // Method 1: Try global wallet connect function
      if (window.__walletConnect) {
        console.log('✅ Using global wallet connect')
        window.__walletConnect('injected')
        return
      }
      
      // Method 2: Try w3m-button click
      const w3mButton = document.querySelector('w3m-button')
      if (w3mButton) {
        console.log('✅ Found w3m-button, clicking...')
        w3mButton.click()
        return
      }
      
      // Method 3: Try direct ethereum connection
      if (window.ethereum) {
        console.log('✅ Using direct ethereum connection')
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        return
      }
      
      console.log('❌ No connection method available')
    } catch (error) {
      console.error('❌ Connection failed:', error)
    }
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


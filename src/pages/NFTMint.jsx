import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { useMintNFT } from '../hooks/useMintNFT'
import { getXP } from '../utils/xpUtils'

const NFTMint = () => {
  const navigate = useNavigate()
  const { mintNFT, isLoading, error, successMessage } = useMintNFT()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null,
    imagePreview: null
  })

  const [isScrolled, setIsScrolled] = useState(false)
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load user XP
  useEffect(() => {
    const loadUserXP = async () => {
      if (address) {
        try {
          const totalXP = await getXP(address)
          setUserXP(totalXP || 0)
          setUserLevel(Math.floor(totalXP / 100) + 1)
        } catch (error) {
          console.error('Error loading user XP:', error)
        }
      }
    }

    loadUserXP()
  }, [address])

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.symbol || !formData.image) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await mintNFT(formData.name, formData.symbol, formData.description, formData.image)
    } catch (err) {
      console.error('NFT mint failed:', err)
    }
  }

  return (
    <div className="nft-mint-page">
      <div className="container">
        {/* Header */}
        <div className={`header-section ${isScrolled ? 'scrolled' : ''}`}>
          {/* Left side - Profile and XP */}
          <div className="header-left">
            <div className="profile-section">
              <div className="profile-avatar">🎨</div>
              <div className="profile-info">
                <div className="xp-badge">
                  <span className="xp-icon">⚡</span>
                  <span className="xp-amount">{userXP}</span>
                </div>
                <div className="level-badge">
                  <span className="level-text">Level {userLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Title */}
          <div className="header-center">
            <h1 className="header-title">NFT Mint</h1>
            <p className="header-subtitle">Create & Mint Your Unique NFT</p>
          </div>

          {/* Right side - Wallet and Actions */}
          <div className="header-right">
            {isConnected ? (
              <div className="wallet-section">
                <div className="wallet-info">
                  <div className="wallet-address">{formatAddress(address)}</div>
                  <div className="wallet-balance">
                    <span className="balance-icon">🪙</span>
                    <span className="balance-amount">0.00 ETH</span>
                  </div>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="disconnect-button"
                >
                  <span className="disconnect-icon">↗️</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="connect-button"
              >
                <span className="connect-icon">🔗</span>
                <span className="connect-text">Connect</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="main-card">
          <div className="card-header">
            <div className="card-icon">✨</div>
            <h2 className="card-title">Create Your NFT</h2>
            <p className="card-subtitle">Upload an image and mint your unique NFT on Base network</p>
          </div>

          <form onSubmit={handleSubmit} className="nft-form">
            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🖼️</span>
                NFT Image *
              </label>
              <div className="image-upload-area">
                {formData.imagePreview ? (
                  <div className="image-preview">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="preview-image"
                    />
                    <div className="image-info">
                      <p className="image-name">{formData.image.name}</p>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                        className="remove-button"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">Click to upload your NFT image</p>
                    <p className="upload-hint">Max 5MB, JPG/PNG/GIF</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
              </div>
            </div>

            {/* NFT Name */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🏷️</span>
                NFT Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter NFT name"
                maxLength={50}
                className="form-input"
                required
              />
            </div>

            {/* NFT Symbol */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🔤</span>
                NFT Symbol *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="Enter NFT symbol (e.g., MYNFT)"
                maxLength={10}
                className="form-input"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📝</span>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your NFT (optional)"
                maxLength={200}
                rows={3}
                className="form-textarea"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                <p className="error-text">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                <p className="success-text">{successMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.symbol || !formData.image}
              className="mint-button"
            >
              {isLoading ? (
                <div className="button-loading">
                  <div className="loading-spinner"></div>
                  <span>Minting NFT...</span>
                </div>
              ) : (
                <div className="button-content">
                  <span>Mint</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <p className="info-description">
            Upload your image, fill in the details, and mint your unique NFT on Base network. 
            Earn 100 XP for successful minting!
          </p>
        </div>
      </div>
    </div>
  )
}

export default NFTMint

// Modern CSS Styles
const styles = `
  .nft-mint-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1d4ed8 100%);
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    padding-top: 120px;
  }

  /* Header Styles */
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: 16px 20px;
    background: rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    transform: translateY(0);
  }

  .header-section.scrolled {
    background: rgba(59, 130, 246, 0.05);
    backdrop-filter: blur(10px);
    transform: translateY(-100%);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .profile-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .profile-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .xp-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .xp-icon {
    font-size: 14px;
  }

  .level-badge {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    text-align: center;
  }

  .header-center {
    text-align: center;
    flex: 1;
  }

  .header-title {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin: 0 0 2px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .wallet-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .wallet-address {
    font-size: 12px;
    font-weight: 600;
    color: white;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 6px;
  }

  .wallet-balance {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
  }

  .balance-icon {
    font-size: 12px;
  }

  .disconnect-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .disconnect-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .disconnect-icon {
    font-size: 14px;
  }

  .connect-button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .connect-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .connect-icon {
    font-size: 14px;
  }

  /* Main Card Styles */
  .main-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 24px;
  }

  .card-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .card-icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .card-subtitle {
    font-size: 16px;
    color: #6b7280;
    margin: 0 0 20px 0;
  }

  .fee-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }

  .fee-icon {
    font-size: 16px;
  }

  /* Form Styles */
  .nft-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }

  .label-icon {
    font-size: 16px;
  }

  /* Image Upload Styles */
  .image-upload-area {
    position: relative;
    border: 2px dashed #d1d5db;
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    background: #f9fafb;
  }

  .image-upload-area:hover {
    border-color: #8b5cf6;
    background: #f3f4f6;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .upload-icon {
    font-size: 48px;
    color: #9ca3af;
  }

  .upload-text {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .upload-hint {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .image-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .preview-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .image-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .image-name {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .remove-button {
    background: #ef4444;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .remove-button:hover {
    background: #dc2626;
  }

  .file-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  /* Input Styles */
  .form-input, .form-textarea {
    width: 100%;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: white;
    color: #374151;
  }

  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .form-input::placeholder, .form-textarea::placeholder {
    color: #9ca3af;
  }

  .form-textarea {
    resize: none;
    min-height: 100px;
  }

  /* Message Styles */
  .error-message, .success-message {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    font-weight: 600;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
  }

  .error-icon, .success-icon {
    font-size: 20px;
  }

  /* Button Styles */
  .mint-button {
    width: 100%;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border: none;
    padding: 20px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
  }

  .mint-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(139, 92, 246, 0.4);
  }

  .mint-button:disabled {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .button-icon {
    font-size: 20px;
  }

  .button-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Info Card Styles */
  .info-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .info-description {
    font-size: 16px;
    color: #6b7280;
    text-align: center;
    margin: 0;
    line-height: 1.6;
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .info-icon {
    font-size: 24px;
  }

  .info-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .info-steps {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-step {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .step-number {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  .step-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .step-icon {
    font-size: 20px;
  }

  .step-content p {
    margin: 0;
    color: #374151;
    font-weight: 500;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .nft-mint-page {
      padding: 16px;
    }

    .main-card, .info-card {
      padding: 24px;
    }

    .header-title {
      font-size: 24px;
    }

    .card-title {
      font-size: 24px;
    }

    .header-section {
      flex-direction: column;
      gap: 12px;
      padding: 12px 16px;
    }

    .header-left, .header-right {
      justify-content: center;
    }

    .header-center {
      order: -1;
    }

    .profile-section {
      gap: 8px;
    }

    .profile-avatar {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }

    .wallet-section {
      gap: 8px;
    }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

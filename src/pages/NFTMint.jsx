import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMintNFT } from '../hooks/useMintNFT'

const NFTMint = () => {
  const navigate = useNavigate()
  const { mintNFT, isLoading, error, successMessage } = useMintNFT()
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null,
    imagePreview: null
  })

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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Home
          </button>
          <h1 className="text-3xl font-bold text-white">NFT Mint</h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Create Your NFT</h2>
            <p className="text-blue-100">Upload an image and mint your unique NFT on Base</p>
            <div className="mt-4 bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-3">
              <p className="text-yellow-200 text-sm">
                💰 Mint Fee: 0.0002 ETH | 🎉 Reward: 100 XP
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-white font-medium mb-2">
                NFT Image *
              </label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-white/50 transition-colors">
                {formData.imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-white/80 text-sm">{formData.image.name}</p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl text-white/50 mb-2">📷</div>
                    <p className="text-white/80 mb-2">Click to upload your NFT image</p>
                    <p className="text-white/60 text-sm">Max 5MB, JPG/PNG/GIF</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* NFT Name */}
            <div>
              <label className="block text-white font-medium mb-2">
                NFT Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter NFT name"
                maxLength={50}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                required
              />
            </div>

            {/* NFT Symbol */}
            <div>
              <label className="block text-white font-medium mb-2">
                NFT Symbol *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="Enter NFT symbol (e.g., MYNFT)"
                maxLength={10}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your NFT (optional)"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-200 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.symbol || !formData.image}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Minting NFT...
                </div>
              ) : (
                '🚀 Mint NFT (0.0002 ETH + 100 XP)'
              )}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">How it works</h3>
          <div className="space-y-3 text-white/80">
            <div className="flex items-start">
              <span className="text-blue-400 mr-3">1.</span>
              <p>Upload your image and fill in the NFT details</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-3">2.</span>
              <p>Pay 0.0002 ETH minting fee</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-3">3.</span>
              <p>Your NFT is minted on Base network</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-400 mr-3">4.</span>
              <p>Earn 100 XP for successful minting!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NFTMint

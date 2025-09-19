import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect, useSendCalls } from 'wagmi'
import { getXP } from '../utils/xpUtils'

// Enhanced provider helper with Farcaster SDK support
async function getProvider() {
  if (typeof window === 'undefined') return null
  
  // Try Farcaster SDK provider first
  if (window?.farcaster?.wallet?.getEthereumProvider) {
    try {
      const provider = await window.farcaster.wallet.getEthereumProvider()
      if (provider) {
        console.log('✅ Using Farcaster SDK provider')
        return provider
      }
    } catch (error) {
      console.log('⚠️ Farcaster SDK provider failed:', error.message)
    }
  }
  
  // Try alternative Farcaster SDK location
  if (window?.__farcaster?.wallet?.getEthereumProvider) {
    try {
      const provider = await window.__farcaster.wallet.getEthereumProvider()
      if (provider) {
        console.log('✅ Using alternative Farcaster SDK provider')
        return provider
      }
    } catch (error) {
      console.log('⚠️ Alternative Farcaster SDK provider failed:', error.message)
    }
  }
  
  // Fallback to window.ethereum
  if (window.ethereum) {
    console.log('✅ Using window.ethereum fallback')
    return window.ethereum
  }
  
  return null
}

// Helper function for ERC-20 balanceOf calldata
function erc20BalanceOfCalldata(address) {
  const fn = '0x70a08231' // balanceOf(address) function signature
  const data = fn + address.toLowerCase().replace(/^0x/, '').padStart(64, '0')
  return data
}

// Native ETH helper
const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const NATIVE_ETH_ADDRESS_ALT = '0x0000000000000000000000000000000000000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const isNative = (address) => {
  if (!address) return false
  const lowerAddr = address.toLowerCase()
  return lowerAddr === NATIVE_ETH_ADDRESS.toLowerCase() || 
         lowerAddr === ZERO_ADDRESS.toLowerCase()
}

const TokenSwap = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { sendCalls } = useSendCalls()
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  
  // Farcaster detection
  const [isFarcaster, setIsFarcaster] = useState(false)
  const [ethereumProvider, setEthereumProvider] = useState(null)
  const [currentChainId, setCurrentChainId] = useState(null)
  
  // 1inch API Configuration
  const INCH_API_KEY = 'HWcp63JDwcGFuSoQOt0figfwVW8a2tmU'
  const INCH_API_URL = 'https://api.1inch.dev'
  const BASE_CHAIN_ID = 8453
  const INTEGRATOR_FEE = 0.003 // 0.3%
  const INTEGRATOR_ADDRESS = '0x7d2Ceb7a0e0C39A3d0f7B5b491659fDE4bb7BCFe' // BaseHub revenue wallet
  
  // Calculate BHUB tokens from XP (1 XP = 10 BHUB)
  const bhubTokens = userXP * 10

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Setup Ethereum provider
  useEffect(() => {
    const setupProvider = async () => {
      try {
        // Get provider
        const provider = await getProvider()
        
        if (!provider) {
          setError('This page works best inside Farcaster Mini App or a web3 wallet-enabled browser.')
          return
        }
        
        setEthereumProvider(provider)
        
        // Check if we're in Farcaster environment
        const userAgent = navigator.userAgent || ''
        const isFarcasterEnv = userAgent.includes('Farcaster') || 
                              userAgent.includes('farcaster') ||
                              window.location.href.includes('farcaster') ||
                              document.referrer.includes('farcaster')
        
        setIsFarcaster(isFarcasterEnv)
        
        // In Farcaster, don't request accounts - Wagmi handles it
        if (!isFarcasterEnv) {
          try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' })
            if (!accounts || accounts.length === 0) {
              setError('Please connect your wallet to continue.')
              return
            }
          } catch (error) {
            setError('Please connect your wallet to continue.')
            return
          }
        }
        
        // Check current network
        try {
          const chainIdHex = await provider.request({ method: 'eth_chainId' })
          const chainId = parseInt(chainIdHex, 16)
          setCurrentChainId(chainIdHex)
          
          if (chainId !== 8453 && !isFarcasterEnv) {
            // For web, try to switch to Base
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }]
              })
            } catch (switchError) {
              setError('Please switch to Base network in your wallet to use this app.')
            }
          }
        } catch (error) {
          if (!isFarcasterEnv) {
            setError('Unable to check network. Please ensure you are on Base network.')
          }
        }
        
      } catch (error) {
        setError('Failed to setup wallet connection. Please refresh and try again.')
      }
    }

    setupProvider()
  }, [])

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

  // Swap State
  const [sellToken, setSellToken] = useState(NATIVE_ETH_ADDRESS) // Native ETH
  const [buyToken, setBuyToken] = useState('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') // USDC on Base
  const [sellAmount, setSellAmount] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [quote, setQuote] = useState(null)
  const [allowance, setAllowance] = useState(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [tokenBalances, setTokenBalances] = useState({})
  // Custom token state with localStorage persistence
  const [customTokens, setCustomTokens] = useState(() => {
    try {
      const saved = localStorage.getItem('basehub-custom-tokens')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading custom tokens from localStorage:', error)
      return []
    }
  })
  const [showAddToken, setShowAddToken] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [newTokenSymbol, setNewTokenSymbol] = useState('')
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenDecimals, setNewTokenDecimals] = useState(18)

  // Load token balances with proper provider
  useEffect(() => {
    const loadBalances = async () => {
      if (!isConnected || !address || !ethereumProvider) {
        // Skipping balance load - not ready
        return
      }

      const balances = {}
      
      try {
        // Load token balances
        
        // Load ETH balance using proper provider
        try {
        // Load ETH balance
          
          // In Farcaster, be more careful with provider requests
          let ethBalanceHex
          try {
            ethBalanceHex = await ethereumProvider.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            })
          } catch (requestError) {
            // Try with different block parameter
            try {
              ethBalanceHex = await ethereumProvider.request({
                method: 'eth_getBalance',
                params: [address, 'pending']
              })
            } catch (pendingError) {
              throw requestError // Use original error
            }
          }
          
          // Use BigInt for proper calculation - avoid Number precision loss
          const ethBalanceWei = BigInt(ethBalanceHex)
          const ethBalanceFormatted = (Number(ethBalanceWei) / 1e18).toFixed(6)
          
          // In Farcaster, if balance is 0, try alternative methods
          if (isFarcaster && ethBalanceFormatted === '0.000000') {
            // Try with different block parameter
            try {
              const ethBalanceHex2 = await ethereumProvider.request({
                method: 'eth_getBalance',
                params: [address, 'pending']
              })
              const ethBalanceWei2 = BigInt(ethBalanceHex2)
              const ethBalanceFormatted2 = (Number(ethBalanceWei2) / 1e18).toFixed(6)
              
              if (ethBalanceFormatted2 !== '0.000000') {
                // Use the non-zero balance
                const finalBalance = ethBalanceFormatted2
                balances[NATIVE_ETH_ADDRESS] = finalBalance
                balances[NATIVE_ETH_ADDRESS_ALT] = finalBalance
                balances[ZERO_ADDRESS] = finalBalance
                balances['0x4200000000000000000000000000000000000006'] = finalBalance
                balances['ETH'] = finalBalance
                balances['NATIVE_ETH'] = finalBalance
                return // Skip the rest of the balance loading
              }
            } catch (altError) {
              // Alternative method failed, continue with original balance
            }
          }
          
          // Store ETH balance for all ETH-related keys
          balances[NATIVE_ETH_ADDRESS] = ethBalanceFormatted
          balances[NATIVE_ETH_ADDRESS_ALT] = ethBalanceFormatted
          balances[ZERO_ADDRESS] = ethBalanceFormatted
          balances['0x4200000000000000000000000000000000000006'] = ethBalanceFormatted // WETH
          balances['ETH'] = ethBalanceFormatted
          balances['NATIVE_ETH'] = ethBalanceFormatted
          
        } catch (ethError) {
          console.error('Error loading ETH balance:', ethError)
          
          // Set default balance on error
          const defaultEth = '0.000000'
          balances[NATIVE_ETH_ADDRESS] = defaultEth
          balances[NATIVE_ETH_ADDRESS_ALT] = defaultEth
          balances[ZERO_ADDRESS] = defaultEth
          balances['0x4200000000000000000000000000000000000006'] = defaultEth
          balances['ETH'] = defaultEth
          balances['NATIVE_ETH'] = defaultEth
        }

        // Load ERC20 token balances
        for (const token of [...tokens, ...customTokens]) {
          if (isNative(token.address)) {
            // For native ETH, use the balance we already loaded
            balances[token.address] = balances['ETH'] || '0.000000'
          } else {
            try {
              // Use proper ERC-20 balanceOf calldata
              const data = erc20BalanceOfCalldata(address)
              
              const balanceResponse = await ethereumProvider.request({
                method: 'eth_call',
                params: [{
                  to: token.address,
                  data: data
                }, 'latest']
              })
              
              // Handle empty or invalid response
              if (!balanceResponse || balanceResponse === '0x' || balanceResponse === '0x0') {
                balances[token.address] = '0.000000'
              } else {
                // Use BigInt for proper calculation
                const rawBalance = BigInt(balanceResponse)
                const balance = Number(rawBalance) / Math.pow(10, token.decimals)
                balances[token.address] = isNaN(balance) ? '0.000000' : balance.toFixed(6)
              }
            } catch (err) {
              balances[token.address] = '0.000000'
            }
          }
        }
        
        setTokenBalances(balances)
      } catch (err) {
        console.error('Error loading balances:', err)
      }
    }

    // Load balances immediately
    loadBalances()
    
    // Also load after a short delay to ensure wallet is ready
    const initialTimeout = setTimeout(loadBalances, 2000)
    
    // Additional delay for Farcaster
    const farcasterTimeout = isFarcaster ? setTimeout(loadBalances, 5000) : null
    
    // Then load every 15 seconds (or 10 seconds in Farcaster)
    const interval = setInterval(loadBalances, isFarcaster ? 10000 : 15000)
    
    return () => {
      clearTimeout(initialTimeout)
      if (farcasterTimeout) clearTimeout(farcasterTimeout)
      clearInterval(interval)
    }
  }, [isConnected, address, customTokens, ethereumProvider, isFarcaster])

  // Auto-quote when amount or tokens change
  useEffect(() => {
    // Clear previous quote when inputs change
    if (quote) {
      setQuote(null)
      setBuyAmount('')
      setNeedsApproval(false)
      setAllowance(null)
      setError('')
      setSuccessMessage('')
    }

    const debounceTimer = setTimeout(() => {
      if (sellAmount && parseFloat(sellAmount) > 0 && sellToken && buyToken && isConnected && !isLoading) {
        getQuote()
      }
    }, 1000) // 1 second delay for debouncing

    return () => clearTimeout(debounceTimer)
  }, [sellAmount, sellToken, buyToken, isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wallet connection handler
  const handleConnect = async () => {
    try {
      // In Farcaster, wallet is already connected via Wagmi
      if (isFarcaster) {
        setError('Wallet is already connected in Farcaster. Please refresh the page if you see this message.')
        return
      }
      
      // For web, try connection methods
      // Method 1: Try global wallet connect function
      if (window.__walletConnect) {
        window.__walletConnect('injected')
        return
      }
      
      // Method 2: Try w3m-button click
      const w3mButton = document.querySelector('w3m-button')
      if (w3mButton) {
        w3mButton.click()
        return
      }
      
      // Method 3: Try any connect button
      const connectButtons = document.querySelectorAll('[data-testid="connect-button"], button[aria-label*="connect" i], button:contains("Connect")')
      if (connectButtons.length > 0) {
        connectButtons[0].click()
        return
      }
      
      // Method 4: Try direct ethereum connection
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        return
      }
      
      setError('Please install a wallet extension (MetaMask, Coinbase, etc.)')
      
    } catch (error) {
      setError('Failed to connect wallet. Please try again.')
    }
  }

  // Popular Base tokens
  const tokens = [
    { 
      symbol: 'ETH', 
      address: NATIVE_ETH_ADDRESS, // Use 1inch API standard for consistency
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    },
    { 
      symbol: 'WETH', 
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      decimals: 18
    },
    { 
      symbol: 'USDC', 
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      name: 'USD Coin',
      decimals: 6
    },
    { 
      symbol: 'USDT', 
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      name: 'Tether USD',
      decimals: 6
    }
  ]

  // Approve token spending
  const approveToken = async () => {
    if (!sellAmount || !address) return
    
    // Skip approval for native ETH
    if (isNative(sellToken)) {
      setAllowance(null)
      setNeedsApproval(false)
      return
    }

    setIsApproving(true)
    setError('')

    try {
      const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
      const amount = parseFloat(sellAmount) * Math.pow(10, sellTokenData.decimals)

      const params = new URLSearchParams({
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/approve/transaction`,
        tokenAddress: sellToken,
        amount: amount.toString()
      })

      const response = await fetch(`/api/1inch-proxy?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('1inch Approval API Error Details:', errorData)
        
        // Handle specific error messages
        const errorDetails = errorData.details || errorData.error || ''
        const errorString = typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)
        
        if (errorString.includes('Not enough src balance')) {
          throw new Error('Insufficient token balance for approval')
        } else if (errorString.includes('Amount is not set')) {
          throw new Error('Invalid amount for approval. Please enter a valid amount.')
        } else if (errorString.includes('Src is not set')) {
          throw new Error('Source token not specified for approval.')
        } else {
          throw new Error(`Approval failed: ${response.status} - ${errorString || 'Unknown error'}`)
        }
      }

      const approvalTx = await response.json()
      
      console.log('Approval transaction:', approvalTx)

      // Send approval transaction via wallet
      if (window.ethereum) {
        // Format approval transaction data for MetaMask compatibility
        const approvalParams = {
          from: address,
          to: approvalTx.to,
          data: approvalTx.data
        }

        // Add value if present (convert to hex string)
        if (approvalTx.value) {
          approvalParams.value = typeof approvalTx.value === 'string' 
            ? approvalTx.value.startsWith('0x') 
              ? approvalTx.value 
              : `0x${parseInt(approvalTx.value).toString(16)}`
            : `0x${approvalTx.value.toString(16)}`
        } else {
          approvalParams.value = '0x0'
        }

        // Add gasPrice if present (convert to hex string)
        if (approvalTx.gasPrice) {
          approvalParams.gasPrice = typeof approvalTx.gasPrice === 'string'
            ? approvalTx.gasPrice.startsWith('0x')
              ? approvalTx.gasPrice
              : `0x${parseInt(approvalTx.gasPrice).toString(16)}`
            : `0x${approvalTx.gasPrice.toString(16)}`
        }

        console.log('Formatted approval params:', approvalParams)

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [approvalParams]
        })

        console.log('Approval transaction sent:', txHash)
        setSuccessMessage('✅ Token approval successful! You can now swap.')
        
        // Wait a bit then recheck allowance
        setTimeout(async () => {
          if (sellAmount && !isNative(sellToken)) {
            try {
              const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
              const amount = parseFloat(sellAmount) * Math.pow(10, sellTokenData.decimals)
              
        const allowanceParams = new URLSearchParams({
          endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/approve/allowance`,
          tokenAddress: sellToken,
          walletAddress: address.toLowerCase()
        })

              const allowanceResponse = await fetch(`/api/1inch-proxy?${allowanceParams}`)
              
              if (allowanceResponse.ok) {
                const allowanceData = await allowanceResponse.json()
                const currentAllowance = BigInt(allowanceData.allowance || '0')
                const requiredAmount = BigInt(amount)
                
                setAllowance(currentAllowance.toString())
                setNeedsApproval(currentAllowance < requiredAmount)
              }
            } catch (allowanceErr) {
              console.error('Allowance recheck error:', allowanceErr)
            }
          }
        }, 3000)
      }

    } catch (err) {
      console.error('Approval error:', err)
      setError('Token approval failed. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  // Get token allowance from 1inch API (not balance!)
  const getTokenAllowanceFrom1inch = async (tokenAddress, walletAddress) => {
    try {
      const params = new URLSearchParams({
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/approve/allowance`,
        tokenAddress: tokenAddress,
        walletAddress: walletAddress.toLowerCase()
      })
      
      const response = await fetch(`/api/1inch-proxy?${params}`)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error('Error getting token balance from 1inch:', error)
    }
    return null
  }

  // Helper function to decode hex string to text
  const decodeHexString = (hexString) => {
    try {
      // Remove 0x prefix
      const hex = hexString.slice(2)
      // Convert hex to bytes
      const bytes = new Uint8Array(hex.length / 2)
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
      }
      // Convert bytes to string
      return new TextDecoder('utf-8').decode(bytes)
    } catch (error) {
      console.error('Error decoding hex string:', error)
      return 'UNKNOWN'
    }
  }

  // Auto-fetch token info from contract
  const fetchTokenInfo = async (tokenAddress) => {
    try {
      // Get token symbol
      const symbolResponse = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: '0x95d89b41' // symbol()
        }, 'latest']
      })
      
      // Get token name
      const nameResponse = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: '0x06fdde03' // name()
        }, 'latest']
      })
      
      // Get token decimals
      const decimalsResponse = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: '0x313ce567' // decimals()
        }, 'latest']
      })

      // Decode responses using Web API instead of Buffer
      const symbol = symbolResponse === '0x' ? 'UNKNOWN' : 
        decodeHexString(symbolResponse).replace(/\0/g, '').trim()
      const name = nameResponse === '0x' ? 'Unknown Token' : 
        decodeHexString(nameResponse).replace(/\0/g, '').trim()
      const decimals = decimalsResponse === '0x' ? 18 : parseInt(decimalsResponse, 16)

      return { symbol, name, decimals }
    } catch (error) {
      console.error('Error fetching token info:', error)
      return null
    }
  }

  // Check if token has liquidity on 1inch
  const checkTokenLiquidity = async (tokenAddress) => {
    try {
      // Try to get a quote with a small amount to check liquidity
      const testAmount = '1000000000000000000' // 1 token (assuming 18 decimals)
      
      const params = new URLSearchParams({
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/quote`,
        src: tokenAddress,
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
        amount: testAmount,
        from: address.toLowerCase(),
        referrer: INTEGRATOR_ADDRESS,
        fee: INTEGRATOR_FEE.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true',
        includeGas: 'true'
      })

      const response = await fetch(`/api/1inch-proxy?${params}`)
      return response.ok
    } catch (error) {
      console.error('Error checking token liquidity:', error)
      return false
    }
  }

  // Auto-fetch token info when address is entered
  const handleTokenAddressChange = async (address) => {
    setNewTokenAddress(address)
    
    if (address && address.startsWith('0x') && address.length === 42) {
      setError('')
      setSuccessMessage('🔍 Fetching token information...')
      
      try {
        const tokenInfo = await fetchTokenInfo(address)
        
        if (tokenInfo && tokenInfo.symbol !== 'UNKNOWN' && tokenInfo.name !== 'Unknown Token') {
          setNewTokenSymbol(tokenInfo.symbol)
          setNewTokenName(tokenInfo.name)
          setNewTokenDecimals(tokenInfo.decimals)
          
          // Check liquidity
          setSuccessMessage('🔍 Checking liquidity...')
          const hasLiquidity = await checkTokenLiquidity(address)
          
          if (hasLiquidity) {
            setSuccessMessage('✅ Token found with liquidity! Ready to add.')
          } else {
            setSuccessMessage('⚠️ Token found but no liquidity detected. You can still add it.')
          }
        } else {
          setError('❌ Invalid token contract or not an ERC-20 token. Please check the address.')
          setNewTokenSymbol('')
          setNewTokenName('')
          setNewTokenDecimals(18)
        }
      } catch (error) {
        console.error('Error:', error)
        setError('❌ Error fetching token information. Please check the address.')
        setNewTokenSymbol('')
        setNewTokenName('')
        setNewTokenDecimals(18)
      }
    } else if (address && address.length > 0) {
      setError('❌ Invalid address format. Please enter a valid contract address (0x...)')
      setNewTokenSymbol('')
      setNewTokenName('')
      setNewTokenDecimals(18)
    } else {
      setError('')
      setSuccessMessage('')
      setNewTokenSymbol('')
      setNewTokenName('')
      setNewTokenDecimals(18)
    }
  }

  // Add custom token
  // Remove custom token
  const removeCustomToken = (tokenAddress) => {
    const updatedTokens = customTokens.filter(token => token.address !== tokenAddress)
    setCustomTokens(updatedTokens)
    
    // Save to localStorage
    try {
      localStorage.setItem('basehub-custom-tokens', JSON.stringify(updatedTokens))
      console.log('Custom token removed from localStorage:', tokenAddress)
      setSuccessMessage('✅ Custom token removed successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving custom tokens to localStorage:', error)
    }
  }

  const addCustomToken = async () => {
    if (!newTokenAddress) {
      setError('Please enter token contract address')
      return
    }

    // Validate address format
    if (!newTokenAddress.startsWith('0x') || newTokenAddress.length !== 42) {
      setError('Invalid token address format')
      return
    }

    // Check if token already exists
    const allTokens = [...tokens, ...customTokens]
    if (allTokens.some(token => token.address.toLowerCase() === newTokenAddress.toLowerCase())) {
      setError('Token already exists')
      return
    }

    try {
      // Verify token exists by checking balance
      const balanceResponse = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: newTokenAddress,
          data: `0x70a08231${address.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`
        }, 'latest']
      })

      const newToken = {
        symbol: newTokenSymbol.toUpperCase(),
        address: newTokenAddress,
        name: newTokenName,
        decimals: newTokenDecimals,
        isCustom: true
      }

      const updatedTokens = [...customTokens, newToken]
      setCustomTokens(updatedTokens)
      
      // Save to localStorage
      try {
        localStorage.setItem('basehub-custom-tokens', JSON.stringify(updatedTokens))
        console.log('Custom tokens saved to localStorage:', updatedTokens)
      } catch (error) {
        console.error('Error saving custom tokens to localStorage:', error)
      }
      
      setShowTokenModal(false)
      setNewTokenAddress('')
      setNewTokenSymbol('')
      setNewTokenName('')
      setNewTokenDecimals(18)
      setError('')
      setSuccessMessage('✅ Custom token added successfully!')
      
      // Reload balances to include the new custom token
      setTimeout(async () => {
        try {
          const balances = {}
          
          // Load ETH balance
          if (window.ethereum) {
            const ethBalance = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            })
            const ethBalanceFormatted = (parseInt(ethBalance, 16) / 1e18).toFixed(6)
            
            // Store ETH balance for both ETH and WETH tokens
            balances[NATIVE_ETH_ADDRESS] = ethBalanceFormatted
            balances[NATIVE_ETH_ADDRESS_ALT] = ethBalanceFormatted
            balances['0x4200000000000000000000000000000000000006'] = ethBalanceFormatted
            balances['ETH'] = ethBalanceFormatted
            balances['NATIVE_ETH'] = ethBalanceFormatted
          }

          // Load ERC20 token balances (including new custom token)
          for (const token of [...tokens, ...customTokens, newToken]) {
            if (token.isNative) {
              balances[token.address] = balances['ETH'] || '0.000000'
            } else {
              try {
                const fnSig = '0x70a08231'
                const addrPadded = address.toLowerCase().replace(/^0x/, '').padStart(64, '0')
                const data = fnSig + addrPadded
                
                const balanceResponse = await window.ethereum.request({
                  method: 'eth_call',
                  params: [{
                    to: token.address,
                    data: data
                  }, 'latest']
                })
                
                const rawBalance = BigInt(balanceResponse)
                const balance = Number(rawBalance) / Math.pow(10, token.decimals)
                balances[token.address] = isNaN(balance) ? '0.000000' : balance.toFixed(6)
                console.log(`${token.symbol} balance:`, balances[token.address])
              } catch (err) {
                console.error(`Error loading ${token.symbol} balance:`, err)
                balances[token.address] = '0.000000'
              }
            }
          }
          
          setTokenBalances(balances)
          console.log('Balances reloaded with custom token:', balances)
        } catch (error) {
          console.error('Error reloading balances:', error)
        }
      }, 1000)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (error) {
      console.error('Error adding custom token:', error)
      setError('Failed to verify token. Please check the address and try again.')
    }
  }

  // Get quote from 1inch API via proxy
  const getQuote = async () => {
    if (!sellAmount || !sellToken || !buyToken) {
      setError('Please enter amount and select tokens')
      return
    }

    // Validate amount
    if (parseFloat(sellAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    // Check balance before quote
    const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
    const currentBalance = parseFloat(tokenBalances[sellToken] || '0')
    const requestedAmount = parseFloat(sellAmount)
    
    console.log('Balance Check - Token:', sellTokenData?.symbol, 'Address:', sellToken, 'Current Balance:', currentBalance, 'Requested:', requestedAmount, 'All Balances:', tokenBalances)
    
    // For native ETH, we need to reserve some for gas fees
    const gasReserve = isNative(sellToken) ? 0.00005 : 0 // Reserve 0.00005 ETH for gas
    const availableBalance = currentBalance - gasReserve
    
    console.log('Gas Reserve Calculation:', {
      currentBalance,
      requestedAmount,
      gasReserve,
      availableBalance,
      canSwap: availableBalance >= requestedAmount
    })
    
    if (availableBalance < requestedAmount) {
      setError(`Insufficient ${sellTokenData.symbol} balance! You have ${currentBalance.toFixed(6)} ${sellTokenData.symbol}, but trying to get quote for ${requestedAmount.toFixed(6)} ${sellTokenData.symbol}. ${gasReserve > 0 ? `Gas reserve of ${gasReserve} ${sellTokenData.symbol} is required. Available for swap: ${availableBalance.toFixed(6)} ${sellTokenData.symbol}. ` : ''}Please reduce the amount to ${availableBalance.toFixed(6)} ${sellTokenData.symbol} or add more ${sellTokenData.symbol} to your wallet.`)
      return
    }

    setIsLoading(true)
    setError('')
    
    // Add a small delay to ensure wallet is fully synced
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
      const amount = parseFloat(sellAmount) * Math.pow(10, sellTokenData.decimals)
      
      // Validate amount is a valid number
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount format')
      }
      
      // Use 1inch API standard address for native ETH
      const srcTokenForAPI = isNative(sellToken) ? NATIVE_ETH_ADDRESS : sellToken
      
      const params = new URLSearchParams({
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/quote`,
        src: srcTokenForAPI,
        dst: buyToken,
        amount: amount.toString(),
        from: address.toLowerCase(),
        referrer: INTEGRATOR_ADDRESS,
        fee: INTEGRATOR_FEE.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true',
        includeGas: 'true'
      })

      console.log('1inch Quote Request:', {
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/quote`,
        src: srcTokenForAPI,
        dst: buyToken,
        amount: amount.toString(),
        from: address.toLowerCase(),
        referrer: INTEGRATOR_ADDRESS,
        fee: INTEGRATOR_FEE.toString(),
        sellTokenData: sellTokenData,
        address: address,
        currentBalance: tokenBalances[sellToken],
        allBalances: tokenBalances,
        nativeETHAddress: NATIVE_ETH_ADDRESS,
        nativeETHAddressAlt: NATIVE_ETH_ADDRESS_ALT,
        note: 'Using 1inch API standard address for native ETH with fee',
        originalSrc: sellToken,
        apiSrc: srcTokenForAPI
      })

      // Check balance from 1inch API for debugging
      if (sellToken === NATIVE_ETH_ADDRESS || sellToken === NATIVE_ETH_ADDRESS_ALT) {
        console.log('Testing both native ETH addresses with 1inch API...')
        
        // Test with current address
        const balanceData1 = await getTokenAllowanceFrom1inch(sellToken, address)
        console.log('1inch Native ETH Balance Check (current):', balanceData1)
        
        // Test with alternative address
        const altAddress = sellToken === NATIVE_ETH_ADDRESS ? NATIVE_ETH_ADDRESS_ALT : NATIVE_ETH_ADDRESS
        const balanceData2 = await getTokenAllowanceFrom1inch(altAddress, address)
        console.log('1inch Native ETH Balance Check (alternative):', balanceData2)
        
        console.log('Testing 1inch API connectivity...')
      }

      // Add retry mechanism for Farcaster
      let response
      let retryCount = 0
      const maxRetries = isFarcaster ? 3 : 1
      
      while (retryCount <= maxRetries) {
        try {
          response = await fetch(`/api/1inch-proxy?${params}`)
          if (response.ok) break
          
          if (retryCount < maxRetries) {
            console.log(`Retry ${retryCount + 1}/${maxRetries} for 1inch API...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
            retryCount++
            continue
          }
        } catch (fetchError) {
          console.error(`Fetch error on retry ${retryCount}:`, fetchError)
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
            retryCount++
            continue
          }
          throw fetchError
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        console.error('1inch Quote API Error Details:', errorData)
        
        // Handle specific error messages
        const errorDetails = errorData.details || errorData.error || ''
        const errorString = typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)
        
        // Check for specific 1inch error patterns
        if (errorString.includes('Not enough') && errorString.includes('balance')) {
          // Extract balance information from error
          const balanceMatch = errorString.match(/Balance: (\d+)/)
          const amountMatch = errorString.match(/Amount: (\d+)/)
          const tokenMatch = errorString.match(/Not enough (0x[a-fA-F0-9]+)/)
          
          let tokenSymbol = 'token'
          if (tokenMatch) {
            const tokenAddress = tokenMatch[1]
            const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase())
            if (token) {
              tokenSymbol = token.symbol
            }
          }
          
          const balance = balanceMatch ? (parseInt(balanceMatch[1]) / Math.pow(10, 18)).toFixed(6) : '0'
          const amount = amountMatch ? (parseInt(amountMatch[1]) / Math.pow(10, 18)).toFixed(6) : 'unknown'
          
          throw new Error(`Insufficient ${tokenSymbol} balance! 1inch API reports you have ${balance} ${tokenSymbol}, but trying to get quote for ${amount} ${tokenSymbol}. Please check your wallet balance and try again.`)
        } else if (errorString.includes('Insufficient liquidity')) {
          throw new Error('Insufficient liquidity for this quote. Try a smaller amount.')
        } else if (errorString.includes('Amount is not set')) {
          throw new Error('Invalid amount. Please enter a valid amount.')
        } else if (errorString.includes('Src is not set')) {
          throw new Error('Source token not specified.')
        } else if (errorString.includes('Dst is not set')) {
          throw new Error('Destination token not specified.')
        } else if (errorString.includes('Cannot sync token')) {
          throw new Error('Invalid token address. Please check token contract.')
        } else {
          // Farcaster-specific error handling
          if (isFarcaster) {
            if (response.status === 0 || !response.status) {
              throw new Error('Network error in Farcaster. Please try again or refresh the page.')
            } else if (response.status >= 500) {
              throw new Error('Server error. Please try again in a few moments.')
            } else {
              throw new Error(`Trading error: ${errorString || 'Please try again'}`)
            }
        } else {
          throw new Error(`1inch API error: ${response.status} - ${errorString || 'Unknown error'}`)
          }
        }
      }

      const data = await response.json()
      setQuote(data)
      
      const buyTokenData = [...tokens, ...customTokens].find(t => t.address === buyToken)
      const buyAmountFormatted = parseFloat(data.dstAmount) / Math.pow(10, buyTokenData.decimals)
      setBuyAmount(buyAmountFormatted.toFixed(6))
      
      // Check allowance after getting quote (skip for native ETH)
      if (!isNative(sellToken)) {
        try {
        const allowanceParams = new URLSearchParams({
          endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/approve/allowance`,
          tokenAddress: sellToken,
          walletAddress: address.toLowerCase()
        })

          const allowanceResponse = await fetch(`/api/1inch-proxy?${allowanceParams}`)
          
          if (allowanceResponse.ok) {
            const allowanceData = await allowanceResponse.json()
            const currentAllowance = BigInt(allowanceData.allowance || '0')
            const requiredAmount = BigInt(amount)
            
            setAllowance(currentAllowance.toString())
            setNeedsApproval(currentAllowance < requiredAmount)
          }
        } catch (allowanceErr) {
          console.error('Allowance check error:', allowanceErr)
          setAllowance(null)
          setNeedsApproval(false)
        }
      } else {
        setAllowance(null)
        setNeedsApproval(false)
      }
      
    } catch (err) {
      console.error('Quote error:', err)
      setError('Failed to get quote. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Execute batch approve and swap for Farcaster
  const executeBatchApproveAndSwap = async () => {
    if (!quote || !isConnected || !sendCalls) {
      setError('Please connect wallet and get a quote first')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
      const amount = parseFloat(sellAmount) * Math.pow(10, sellTokenData.decimals)
      
      // Get swap data from 1inch
      const srcTokenForAPI = isNative(sellToken) ? NATIVE_ETH_ADDRESS : sellToken
      
      const params = new URLSearchParams({
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/swap`,
        src: srcTokenForAPI,
        dst: buyToken,
        amount: amount.toString(),
        from: address.toLowerCase(),
        slippage: '1',
        referrer: INTEGRATOR_ADDRESS,
        fee: INTEGRATOR_FEE.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true',
        includeGas: 'true'
      })

      const response = await fetch(`/api/1inch-proxy?${params}`)
      if (!response.ok) {
        throw new Error('Failed to get swap data from 1inch')
      }

      const swapData = await response.json()
      
      // Prepare batch calls
      const calls = []
      
      // Add approve call if needed
      if (needsApproval && !isNative(sellToken)) {
        // Get approve transaction data from 1inch
        const approveParams = new URLSearchParams({
          endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/approve/transaction`,
          tokenAddress: sellToken,
          amount: amount.toString()
        })
        
        const approveResponse = await fetch(`/api/1inch-proxy?${approveParams}`)
        if (!approveResponse.ok) {
          throw new Error('Failed to get approve data from 1inch')
        }
        
        const approveData = await approveResponse.json()
        
        calls.push({
          to: approveData.to,
          data: approveData.data,
          value: '0x0'
        })
      }
      
      // Add swap call
      calls.push({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: isNative(sellToken) ? swapData.tx.value : '0x0'
      })

      console.log('🚀 Executing batch approve and swap:', calls)

      // Execute batch transaction
      const result = await sendCalls({ calls })
      
      console.log('✅ Batch transaction successful:', result)
      setSuccessMessage(`Successfully swapped ${sellAmount} ${sellTokenData.symbol} for ${buyAmount} ${[...tokens, ...customTokens].find(t => t.address === buyToken)?.symbol}`)
      
      // Clear quote and amounts
      setQuote(null)
      setSellAmount('')
      setBuyAmount('')
      
      // Reload balances
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('❌ Batch transaction failed:', error)
      setError(`Batch transaction failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Execute swap with Farcaster batch transaction support
  const executeSwap = async () => {
    if (!quote || !isConnected) {
      setError('Please connect wallet and get a quote first')
      return
    }

    // For Farcaster, we can batch approve + swap in one transaction
    if (needsApproval && isFarcaster) {
      return executeBatchApproveAndSwap()
    }

    if (needsApproval) {
      setError('Please approve token spending first')
      return
    }

    // Validate amount
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    // Check balance before swap
    const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
    const currentBalance = parseFloat(tokenBalances[sellToken] || '0')
    const requestedAmount = parseFloat(sellAmount)
    
    console.log('Swap Balance Check - Token:', sellTokenData?.symbol, 'Address:', sellToken, 'Current Balance:', currentBalance, 'Requested:', requestedAmount)
    
    // For native ETH, we need to reserve some for gas fees
    const gasReserve = isNative(sellToken) ? 0.00005 : 0 // Reserve 0.00005 ETH for gas
    const availableBalance = currentBalance - gasReserve
    
    console.log('Swap Gas Reserve Calculation:', {
      currentBalance,
      requestedAmount,
      gasReserve,
      availableBalance,
      canSwap: availableBalance >= requestedAmount
    })
    
    if (availableBalance < requestedAmount) {
      setError(`Insufficient ${sellTokenData.symbol} balance! You have ${currentBalance.toFixed(6)} ${sellTokenData.symbol}, but trying to swap ${requestedAmount.toFixed(6)} ${sellTokenData.symbol}. ${gasReserve > 0 ? `Gas reserve of ${gasReserve} ${sellTokenData.symbol} is required. Available for swap: ${availableBalance.toFixed(6)} ${sellTokenData.symbol}. ` : ''}Please reduce the amount to ${availableBalance.toFixed(6)} ${sellTokenData.symbol} or add more ${sellTokenData.symbol} to your wallet.`)
      return
    }

    setIsLoading(true)
    setError('')

    // Add a small delay to ensure wallet is fully synced
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
      const amount = parseFloat(sellAmount) * Math.pow(10, sellTokenData.decimals)
      
      // Validate amount is a valid number
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount format')
      }
      
      // Use 1inch API standard address for native ETH
      const srcTokenForAPI = isNative(sellToken) ? NATIVE_ETH_ADDRESS : sellToken
      
      const params = new URLSearchParams({
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/swap`,
        src: srcTokenForAPI,
        dst: buyToken,
        amount: amount.toString(),
        from: address.toLowerCase(),
        slippage: '1',
        referrer: INTEGRATOR_ADDRESS,
        fee: INTEGRATOR_FEE.toString(),
        includeTokensInfo: 'true',
        includeProtocols: 'true',
        includeGas: 'true'
      })

      console.log('1inch Swap Request:', {
        endpoint: `/swap/v6.1/${BASE_CHAIN_ID}/swap`,
        src: srcTokenForAPI,
        dst: buyToken,
        amount: amount.toString(),
        from: address.toLowerCase(),
        slippage: '1',
        referrer: INTEGRATOR_ADDRESS,
        fee: INTEGRATOR_FEE.toString(),
        sellTokenData: sellTokenData,
        originalSrc: sellToken,
        apiSrc: srcTokenForAPI
      })

      const response = await fetch(`/api/1inch-proxy?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('1inch API Error Details:', errorData)
        
        // Handle specific error messages
        const errorDetails = errorData.details || errorData.error || ''
        const errorString = typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)
        
        // Check for specific 1inch error patterns
        if (errorString.includes('Not enough') && errorString.includes('balance')) {
          // Extract balance information from error
          const balanceMatch = errorString.match(/Balance: (\d+)/)
          const amountMatch = errorString.match(/Amount: (\d+)/)
          const tokenMatch = errorString.match(/Not enough (0x[a-fA-F0-9]+)/)
          
          let tokenSymbol = 'token'
          if (tokenMatch) {
            const tokenAddress = tokenMatch[1]
            const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase())
            if (token) {
              tokenSymbol = token.symbol
            }
          }
          
          const balance = balanceMatch ? (parseInt(balanceMatch[1]) / Math.pow(10, 18)).toFixed(6) : '0'
          const amount = amountMatch ? (parseInt(amountMatch[1]) / Math.pow(10, 18)).toFixed(6) : 'unknown'
          
          throw new Error(`Insufficient ${tokenSymbol} balance! 1inch API reports you have ${balance} ${tokenSymbol}, but trying to swap ${amount} ${tokenSymbol}. Please check your wallet balance and try again.`)
        } else if (errorString.includes('Not enough Allowance')) {
          throw new Error('Token allowance required. Please approve token spending first.')
        } else if (errorString.includes('Insufficient liquidity')) {
          throw new Error('Insufficient liquidity for this swap. Try a smaller amount.')
        } else if (errorString.includes('Amount is not set')) {
          throw new Error('Invalid amount. Please enter a valid amount.')
        } else if (errorString.includes('Src is not set')) {
          throw new Error('Source token not specified.')
        } else if (errorString.includes('Dst is not set')) {
          throw new Error('Destination token not specified.')
        } else if (errorString.includes('Cannot sync token')) {
          throw new Error('Invalid token address. Please check token contract.')
        } else {
          throw new Error(`1inch API error: ${response.status} - ${errorString || 'Unknown error'}`)
        }
      }

      const swapData = await response.json()
      console.log('Swap transaction data:', swapData)
      
      // Execute transaction via wallet
      if (window.ethereum && swapData.tx) {
        // Format transaction data for MetaMask compatibility
        const txParams = {
          from: address,
          to: swapData.tx.to,
          data: swapData.tx.data
        }

        // Add value if present (convert to hex string)
        if (swapData.tx.value) {
          txParams.value = typeof swapData.tx.value === 'string' 
            ? swapData.tx.value.startsWith('0x') 
              ? swapData.tx.value 
              : `0x${parseInt(swapData.tx.value).toString(16)}`
            : `0x${swapData.tx.value.toString(16)}`
        } else if (isNative(sellToken)) {
          // For native ETH swaps, use the sell amount as value
          const sellTokenData = [...tokens, ...customTokens].find(t => t.address === sellToken)
          const ethValue = BigInt(Math.floor(parseFloat(sellAmount) * Math.pow(10, sellTokenData.decimals)))
          txParams.value = '0x' + ethValue.toString(16)
        } else {
          txParams.value = '0x0'
        }

        // Add gas if present (convert to hex string)
        if (swapData.tx.gas) {
          txParams.gas = typeof swapData.tx.gas === 'string'
            ? swapData.tx.gas.startsWith('0x')
              ? swapData.tx.gas
              : `0x${parseInt(swapData.tx.gas).toString(16)}`
            : `0x${swapData.tx.gas.toString(16)}`
        }

        // Add gasPrice if present (convert to hex string)
        if (swapData.tx.gasPrice) {
          txParams.gasPrice = typeof swapData.tx.gasPrice === 'string'
            ? swapData.tx.gasPrice.startsWith('0x')
              ? swapData.tx.gasPrice
              : `0x${parseInt(swapData.tx.gasPrice).toString(16)}`
            : `0x${swapData.tx.gasPrice.toString(16)}`
        }

        console.log('Formatted transaction params:', txParams)

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams]
        })

        console.log('Swap transaction sent:', txHash)
        
        // Award XP for successful swap
        const newXP = userXP + 30
        setUserXP(newXP)
        setUserLevel(Math.floor(newXP / 100) + 1)
        
        const revenueAmount = (parseFloat(sellAmount) * INTEGRATOR_FEE).toFixed(6)
        setSuccessMessage(`✅ Swap successful! +30 XP earned. Revenue: ${revenueAmount} ${sellTokenData.symbol}`)
        
        // Reset form
        setSellAmount('')
        setBuyAmount('')
        setQuote(null)
        setNeedsApproval(false)
        setAllowance(null)
        
      } else {
        throw new Error('No transaction data received or wallet not available')
      }
      
    } catch (err) {
      console.error('Swap error:', err)
      setError(`Swap failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <div className="token-swap-page">

      <div className="container" style={{ paddingTop: '100px' }}>
        {/* Main Swap Card */}
        <div className="swap-card">
          <div className="card-header">
            <div className="card-icon">🔄</div>
            <h2 className="card-title">Token Swap</h2>
            <p className="card-subtitle">
              Best prices from 80+ liquidity sources on Base network
              {isFarcaster && <span style={{ color: '#10b981', marginLeft: '8px' }}>• Farcaster Mode</span>}
            </p>
          </div>

          <div className="swap-form">
            {/* Sell Token Section */}
            <div className="token-section">
              <label className="token-label">You Sell</label>
              <div className="token-input-container">
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.0"
                  className="token-amount-input"
                />
                <select
                  value={sellToken}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_CUSTOM') {
                      setShowTokenModal(true)
                    } else {
                      setSellToken(e.target.value)
                    }
                  }}
                  className="token-select"
                >
                  {[...tokens, ...customTokens].map(token => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} {token.isCustom ? '(Custom)' : ''}
                    </option>
                  ))}
                  <option value="ADD_CUSTOM" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    ➕ Add Custom Token
                  </option>
                </select>
              </div>
              <div className="token-balance-section">
                <span className="balance-text">
                          Balance: {(() => {
                            const token = [...tokens, ...customTokens].find(t => t.address === sellToken)
                            const balanceKey = token?.isNative ? sellToken : sellToken
                            return tokenBalances[balanceKey] || '0.0000'
                          })()} {[...tokens, ...customTokens].find(t => t.address === sellToken)?.symbol}
                          {(() => {
                            const token = [...tokens, ...customTokens].find(t => t.address === sellToken)
                            const balanceKey = token?.isNative ? sellToken : sellToken
                            const currentBalance = parseFloat(tokenBalances[balanceKey] || '0')
                            const requestedAmount = parseFloat(sellAmount || '0')
                            return currentBalance < requestedAmount && (
                              <span style={{ color: '#ef4444', fontWeight: '600', marginLeft: '8px' }}>
                                ⚠️ Insufficient
                              </span>
                            )
                          })()}
                </span>
                <button
                  onClick={() => {
                    const token = tokens.find(t => t.address === sellToken)
                    const balanceKey = token?.isNative ? sellToken : sellToken
                    const balance = tokenBalances[balanceKey] || '0'
                    setSellAmount(balance)
                  }}
                  className="max-button"
                  disabled={(() => {
                    const token = tokens.find(t => t.address === sellToken)
                    const balanceKey = token?.isNative ? sellToken : sellToken
                    return !tokenBalances[balanceKey] || parseFloat(tokenBalances[balanceKey]) <= 0
                  })()}
                  style={{
                    background: (() => {
                      const token = tokens.find(t => t.address === sellToken)
                      const balanceKey = token?.isNative ? sellToken : sellToken
                      return parseFloat(tokenBalances[balanceKey] || '0') <= 0 
                        ? '#9ca3af' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    })(),
                    cursor: (() => {
                      const token = tokens.find(t => t.address === sellToken)
                      const balanceKey = token?.isNative ? sellToken : sellToken
                      return parseFloat(tokenBalances[balanceKey] || '0') <= 0 ? 'not-allowed' : 'pointer'
                    })()
                  }}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Swap Direction */}
            <div className="swap-direction">
              <button className="swap-direction-btn">
                ⇅
              </button>
            </div>

            {/* Buy Token Section */}
            <div className="token-section">
              <label className="token-label">You Get</label>
              <div className="token-input-container">
                <input
                  type="text"
                  value={buyAmount}
                  readOnly
                  placeholder="0.0"
                  className="token-amount-input"
                />
                <select
                  value={buyToken}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_CUSTOM') {
                      setShowTokenModal(true)
                    } else {
                      setBuyToken(e.target.value)
                    }
                  }}
                  className="token-select"
                >
                  {[...tokens, ...customTokens].map(token => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} {token.isCustom ? '(Custom)' : ''}
                    </option>
                  ))}
                  <option value="ADD_CUSTOM" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    ➕ Add Custom Token
                  </option>
                </select>
              </div>
              <div className="token-balance-section">
                <span className="balance-text">
                  Balance: {tokenBalances[buyToken] || '0.0000'} {[...tokens, ...customTokens].find(t => t.address === buyToken)?.symbol}
                </span>
              </div>
            </div>

            {/* Quote Info */}
            {quote && (
              <div className="quote-info">
                <div className="quote-item">
                  <span>Best Price:</span>
                  <span>{buyAmount} {[...tokens, ...customTokens].find(t => t.address === buyToken)?.symbol}</span>
                </div>
                <div className="quote-item">
                  <span>Gas Estimate:</span>
                  <span>{quote.gas ? `${Math.round(quote.gas / 1000)}K` : 'N/A'}</span>
                </div>
                {needsApproval && (
                  <div className="quote-item" style={{ color: '#f59e0b', fontWeight: '600' }}>
                    <span>⚠️ Approval Required:</span>
                    <span>Token spending permission needed</span>
                  </div>
                )}
                {allowance && !needsApproval && (
                  <div className="quote-item" style={{ color: '#10b981', fontWeight: '600' }}>
                    <span>✅ Approved:</span>
                    <span>Ready to swap</span>
                  </div>
                )}
              </div>
            )}




            {/* Action Buttons */}
            <div className="action-buttons">
              {!quote ? (
                <button
                  onClick={getQuote}
                  disabled={!sellAmount || !isConnected || isLoading}
                  className="quote-button"
                >
                  {isLoading ? 'Getting Quote...' : 'Get Best Price'}
                </button>
              ) : needsApproval ? (
                <button
                  onClick={approveToken}
                  disabled={!isConnected || isApproving}
                  className="approve-button"
                >
                  {isApproving ? 'Approving...' : 'Approve Token'}
                </button>
              ) : (
                <button
                  onClick={executeSwap}
                  disabled={!isConnected || isLoading}
                  className="swap-button"
                >
                  {isLoading ? 'Swapping...' : 'Confirm Swap'}
                </button>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="info-card">
            <h3>🎯 Powered by 1inch</h3>
            <p>We use 1inch DEX aggregator to find the best prices across 80+ liquidity sources on Base network, ensuring optimal trade execution.</p>
          </div>
          
          <div className="info-card">
            <h3>⚡ Fast & Secure</h3>
            <p>Built on Base network for low fees and fast transactions. All swaps are executed through secure smart contracts.</p>
          </div>
        </div>
      </div>
    </div>

    {/* Add Custom Token Modal */}
    {showTokenModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              ➕ Add Custom Token
            </h3>
            <button
              onClick={() => {
                setShowTokenModal(false)
                setNewTokenAddress('')
                setNewTokenSymbol('')
                setNewTokenName('')
                setNewTokenDecimals(18)
                setError('')
                setSuccessMessage('')
              }}
              style={{
                background: 'rgba(71, 85, 105, 0.3)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>
          
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
            Just paste the token contract address and we'll automatically fetch all the details!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              placeholder="Token Contract Address (0x...)"
              value={newTokenAddress}
              onChange={(e) => handleTokenAddressChange(e.target.value)}
              style={{
                background: 'rgba(71, 85, 105, 0.5)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Symbol (Auto-filled)"
                value={newTokenSymbol}
                readOnly
                style={{
                  background: 'rgba(51, 65, 85, 0.3)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#94a3b8',
                  fontSize: '16px',
                  flex: 1,
                  cursor: 'not-allowed'
                }}
              />
              <input
                type="number"
                placeholder="Decimals"
                value={newTokenDecimals}
                readOnly
                style={{
                  background: 'rgba(51, 65, 85, 0.3)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#94a3b8',
                  fontSize: '16px',
                  width: '120px',
                  cursor: 'not-allowed'
                }}
              />
            </div>
            
            <input
              type="text"
              placeholder="Token Name (Auto-filled)"
              value={newTokenName}
              readOnly
              style={{
                background: 'rgba(51, 65, 85, 0.3)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                color: '#94a3b8',
                fontSize: '16px',
                cursor: 'not-allowed'
              }}
            />
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            {successMessage && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#86efac',
                fontSize: '14px'
              }}>
                {successMessage}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowTokenModal(false)
                  setNewTokenAddress('')
                  setNewTokenSymbol('')
                  setNewTokenName('')
                  setNewTokenDecimals(18)
                  setError('')
                  setSuccessMessage('')
                }}
                style={{
                  background: 'rgba(71, 85, 105, 0.3)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={addCustomToken}
                disabled={!newTokenAddress || !newTokenSymbol || !newTokenName}
                style={{
                  background: (!newTokenAddress || !newTokenSymbol || !newTokenName) 
                    ? 'rgba(71, 85, 105, 0.3)' 
                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: (!newTokenAddress || !newTokenSymbol || !newTokenName) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
              >
                Add Token
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// Inject styles
const styles = `
  .token-swap-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    padding: 20px;
    position: relative;
  }



  .user-section {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .swap-card {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(51, 65, 85, 0.3);
    position: relative;
  }

  .card-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .card-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto 16px;
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
  }

  .card-title {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .card-subtitle {
    font-size: 16px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }

  .swap-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .token-section {
    background: rgba(51, 65, 85, 0.3);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(71, 85, 105, 0.3);
    transition: all 0.3s ease;
  }

  .token-section:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .token-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .token-input-container {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .token-amount-input {
    flex: 1;
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    background: transparent;
    border: none;
    outline: none;
    padding: 12px 0;
  }

  .token-amount-input::placeholder {
    color: #64748b;
  }

  .token-select {
    background: rgba(71, 85, 105, 0.5);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
  }

  .token-select:hover {
    border-color: #3b82f6;
  }

  .token-select option {
    background: #1e293b;
    color: #ffffff;
    padding: 10px;
  }

  .token-balance-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding: 0 4px;
  }

  .balance-text {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .max-button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    color: white;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  .max-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  .max-button:disabled {
    background: #64748b;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .swap-direction {
    display: flex;
    justify-content: center;
    margin: -10px 0;
    z-index: 1;
    position: relative;
  }

  .swap-direction-btn {
    width: 40px;
    height: 40px;
    background: rgba(71, 85, 105, 0.8);
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .swap-direction-btn:hover {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    transform: rotate(180deg);
  }

  .quote-info {
    background: rgba(51, 65, 85, 0.3);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(71, 85, 105, 0.3);
  }

  .quote-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 14px;
  }

  .quote-item:not(:last-child) {
    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
  }

  .quote-item span:first-child {
    color: #94a3b8;
    font-weight: 500;
  }

  .quote-item span:last-child {
    color: #ffffff;
    font-weight: 600;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .quote-button, .swap-button, .approve-button {
    flex: 1;
    padding: 16px 24px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .quote-button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .quote-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }

  .swap-button {
    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .swap-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  .approve-button {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }

  .approve-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
  }

  .quote-button:disabled, .swap-button:disabled, .approve-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
  }

  .success-message {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
  }

  .info-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 24px;
  }

  .info-card {
    background: rgba(51, 65, 85, 0.3);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(71, 85, 105, 0.3);
  }

  .info-card h3 {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 12px 0;
  }

  .info-card p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .token-input-container {
      flex-direction: column;
      align-items: stretch;
    }

    .token-amount-input {
      text-align: center;
    }

    .info-section {
      grid-template-columns: 1fr;
    }

    .user-section {
      gap: 4px;
    }

  }
`

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('token-swap-styles')) {
  const style = document.createElement('style')
  style.id = 'token-swap-styles'
  style.textContent = styles
  document.head.appendChild(style)
}

export default TokenSwap


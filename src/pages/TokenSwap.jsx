import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { getXP } from '../utils/xpUtils'

const TokenSwap = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  
  // 1inch API Configuration
  const INCH_API_KEY = 'HWcp63JDwcGFuSoQOt0figfwVW8a2tmU'
  const INCH_API_URL = 'https://api.1inch.dev'
  const BASE_CHAIN_ID = 8453
  const INTEGRATOR_FEE = 0.003 // 0.3%
  const INTEGRATOR_ADDRESS = '0x7d2Ceb7a0e0C39A3d0f7B5b491659fDE4bb7BCFe' // BaseHub revenue wallet
  
  // Native ETH address for 1inch API (official 1inch standard)
  const NATIVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // 1inch API standard
  const NATIVE_ETH_ADDRESS_ALT = '0x0000000000000000000000000000000000000000' // Base network native ETH
  
  // Helper function to check if address is native ETH
  const isNative = (addr) => {
    if (!addr) return false
    const lowerAddr = addr.toLowerCase()
    return lowerAddr === NATIVE_ETH_ADDRESS.toLowerCase() ||
           lowerAddr === NATIVE_ETH_ADDRESS_ALT.toLowerCase() ||
           lowerAddr === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  }
  
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
  const [customTokens, setCustomTokens] = useState([])
  const [showAddToken, setShowAddToken] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [newTokenSymbol, setNewTokenSymbol] = useState('')
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenDecimals, setNewTokenDecimals] = useState(18)

  // Load token balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!isConnected || !address) return

      const balances = {}
      
      try {
        // Load ETH balance
        if (window.ethereum) {
          const ethBalance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest']
          })
          const ethBalanceFormatted = (parseInt(ethBalance, 16) / Math.pow(10, 18)).toFixed(6)
          console.log('ETH Balance Raw:', ethBalance, 'Formatted:', ethBalanceFormatted)
          
          // Store ETH balance for both ETH and WETH tokens
          balances[NATIVE_ETH_ADDRESS] = ethBalanceFormatted // 1inch API standard address
          balances[NATIVE_ETH_ADDRESS_ALT] = ethBalanceFormatted // Base network native ETH address
          balances['0x4200000000000000000000000000000000000006'] = ethBalanceFormatted // WETH address
          balances['ETH'] = ethBalanceFormatted // Also store as 'ETH' for native ETH
          balances['NATIVE_ETH'] = ethBalanceFormatted // Native ETH key
        }

        // Load ERC20 token balances
        for (const token of [...tokens, ...customTokens]) {
          if (token.isNative) {
            // For native ETH, use the balance we already loaded
            balances[token.address] = balances['ETH'] || '0.000000'
            console.log(`Native ${token.symbol} balance:`, balances[token.address])
          } else {
            try {
              // Properly pad the address to 32 bytes (64 hex chars)
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
              
              // Use BigInt to handle large numbers properly
              const rawBalance = BigInt(balanceResponse)
              const balance = Number(rawBalance) / Math.pow(10, token.decimals)
              balances[token.address] = isNaN(balance) ? '0.000000' : balance.toFixed(6)
              console.log(`${token.symbol} balance:`, balances[token.address])
            } catch (err) {
              console.error(`Error loading ${token.symbol} balance:`, err)
              balances[token.address] = '0.000000'
              // Don't spam console with rate limit errors
              if (err.code !== -32005) {
                console.error(`Error loading ${token.symbol} balance:`, err)
              }
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
    
    // Then load every 10 seconds
    const interval = setInterval(loadBalances, 10000)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [isConnected, address])

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
      
      // Method 3: Try any connect button
      const connectButtons = document.querySelectorAll('[data-testid="connect-button"], button[aria-label*="connect" i], button:contains("Connect")')
      if (connectButtons.length > 0) {
        console.log('✅ Found connect button, clicking...')
        connectButtons[0].click()
        return
      }
      
      // Method 4: Try direct ethereum connection
      if (window.ethereum) {
        console.log('✅ Using direct ethereum connection')
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        return
      }
      
      console.log('❌ No connection method available')
      setError('Please install a wallet extension (MetaMask, Coinbase, etc.)')
      
    } catch (error) {
      console.error('❌ Connection failed:', error)
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
      symbol: 'DAI', 
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      name: 'Dai Stablecoin',
      decimals: 18
    },
    { 
      symbol: 'WBTC', 
      address: '0x1C74Aa1E8471Af78c6eFa5C3FA57e54A99df4Ddd',
      name: 'Wrapped Bitcoin',
      decimals: 8
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

  // Get token balance from 1inch API
  const getTokenBalance = async (tokenAddress, walletAddress) => {
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

      // Decode responses
      const symbol = symbolResponse === '0x' ? 'UNKNOWN' : 
        Buffer.from(symbolResponse.slice(2), 'hex').toString().replace(/\0/g, '').trim()
      const name = nameResponse === '0x' ? 'Unknown Token' : 
        Buffer.from(nameResponse.slice(2), 'hex').toString().replace(/\0/g, '').trim()
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
        
        if (tokenInfo) {
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
          setError('❌ Failed to fetch token information. Please check the address.')
        }
      } catch (error) {
        console.error('Error:', error)
        setError('❌ Error fetching token information.')
      }
    }
  }

  // Add custom token
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

      setCustomTokens(prev => [...prev, newToken])
      setShowAddToken(false)
      setNewTokenAddress('')
      setNewTokenSymbol('')
      setNewTokenName('')
      setNewTokenDecimals(18)
      setError('')
      setSuccessMessage('✅ Custom token added successfully!')
      
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
        const balanceData1 = await getTokenBalance(sellToken, address)
        console.log('1inch Native ETH Balance Check (current):', balanceData1)
        
        // Test with alternative address
        const altAddress = sellToken === NATIVE_ETH_ADDRESS ? NATIVE_ETH_ADDRESS_ALT : NATIVE_ETH_ADDRESS
        const balanceData2 = await getTokenBalance(altAddress, address)
        console.log('1inch Native ETH Balance Check (alternative):', balanceData2)
        
        console.log('Testing 1inch API connectivity...')
      }

      const response = await fetch(`/api/1inch-proxy?${params}`)

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
          throw new Error(`1inch API error: ${response.status} - ${errorString || 'Unknown error'}`)
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

  // Execute swap
  const executeSwap = async () => {
    if (!quote || !isConnected) {
      setError('Please connect wallet and get a quote first')
      return
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
    <div className="token-swap-page">
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
          <h1 className="header-title">🔄 Token Swap</h1>
          <p className="header-subtitle">Trade with best prices from 80+ liquidity sources</p>
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
              onClick={handleConnect}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '100px' }}>
        {/* Main Swap Card */}
        <div className="swap-card">
          <div className="card-header">
            <div className="card-icon">🔄</div>
            <h2 className="card-title">Token Swap</h2>
            <p className="card-subtitle">Best prices from 80+ liquidity sources on Base network</p>
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
                  onChange={(e) => setSellToken(e.target.value)}
                  className="token-select"
                >
                  {[...tokens, ...customTokens].map(token => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} {token.isCustom ? '(Custom)' : ''}
                    </option>
                  ))}
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
                  onChange={(e) => setBuyToken(e.target.value)}
                  className="token-select"
                >
                  {[...tokens, ...customTokens].map(token => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} {token.isCustom ? '(Custom)' : ''}
                    </option>
                  ))}
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

            {/* Add Custom Token Button */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                onClick={() => setShowAddToken(!showAddToken)}
                style={{
                  background: 'rgba(71, 85, 105, 0.5)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {showAddToken ? '❌ Cancel' : '➕ Add Custom Token'}
              </button>
            </div>

            {/* Add Custom Token Form */}
            {showAddToken && (
              <div style={{
                background: 'rgba(51, 65, 85, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid rgba(71, 85, 105, 0.3)'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px' }}>Add Custom Token</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                  Just paste the token contract address and we'll automatically fetch all the details!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Token Contract Address (0x...)"
                    value={newTokenAddress}
                    onChange={(e) => handleTokenAddressChange(e.target.value)}
                    style={{
                      background: 'rgba(71, 85, 105, 0.5)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '14px'
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
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#94a3b8',
                        fontSize: '14px',
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
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#94a3b8',
                        fontSize: '14px',
                        width: '100px',
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
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#94a3b8',
                      fontSize: '14px',
                      cursor: 'not-allowed'
                    }}
                  />
                  <button
                    onClick={addCustomToken}
                    disabled={!newTokenAddress || !newTokenSymbol || !newTokenName}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: (!newTokenAddress || !newTokenSymbol || !newTokenName) ? 0.5 : 1
                    }}
                  >
                    Add Token
                  </button>
                </div>
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
  )
}

export default TokenSwap

// Inject styles
const styles = `
  .token-swap-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    padding: 20px;
    position: relative;
  }

  .header-section {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 9999 !important;
    padding: 16px 24px;
    background: rgba(15, 23, 42, 0.95) !important;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(51, 65, 85, 0.3);
    transition: all 0.3s ease;
    visibility: visible !important;
    opacity: 1 !important;
    height: auto !important;
    width: auto !important;
    overflow: visible !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
    color: #ffffff;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
  }

  .header-subtitle {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    font-weight: 500;
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

    .header-title {
      font-size: 20px;
    }

    .header-subtitle {
      font-size: 12px;
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

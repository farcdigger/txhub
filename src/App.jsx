import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useConnect, useAccount } from 'wagmi'
import { HelmetProvider } from 'react-helmet-async'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { FarcasterProvider, useFarcaster } from './contexts/FarcasterContext'
import { config } from './config/wagmi'
import FarcasterXPDisplay from './components/FarcasterXPDisplay'
import SkeletonLoader from './components/SkeletonLoader'
import Home from './pages/Home'
import GMGame from './pages/GMGame'
import GNGame from './pages/GNGame'
import FlipGame from './pages/FlipGame'
import LuckyNumberGame from './pages/LuckyNumberGame'
import DiceRollGame from './pages/DiceRollGame'
import Leaderboard from './pages/Leaderboard'
import DeployToken from './pages/DeployToken'
import NFTMint from './pages/NFTMint'
import TokenSwap from './pages/TokenSwap'
import DailyStreak from './pages/DailyStreak'
import DeFi from './pages/DeFi'
import SwapTest from './pages/SwapTest'
import './styles/index.css'

const queryClient = new QueryClient()

// Hidden Wallet Connector Component
function HiddenWalletConnector() {
  const { connectors, connect } = useConnect()
  const { isConnected } = useAccount()
  
  React.useEffect(() => {
    // Expose connect function globally for our Header component
    window.__walletConnect = (connectorId) => {
      console.log('🔗 Global wallet connect called with:', connectorId)
      const connector = connectors.find(c => 
        c.id === connectorId || 
        c.name.toLowerCase().includes(connectorId?.toLowerCase())
      )
      
      if (connector) {
        console.log('✅ Found connector:', connector.name)
        connect({ connector })
      } else {
        console.log('❌ Connector not found, available:', connectors.map(c => c.name))
        // Try first available connector
        if (connectors[0]) {
          console.log('🔄 Trying first connector:', connectors[0].name)
          connect({ connector: connectors[0] })
        }
      }
    }
    
    // Also expose connectors info
    window.__walletConnectors = connectors
    console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })))
  }, [connectors, connect])
  
  return null // This component is invisible
}

// AppContent component - Works in both Farcaster and Web
function AppContent() {
  const { isInitialized, isReady } = useFarcaster()

  // Show loading while initializing or not ready
  if (!isInitialized || !isReady) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1d4ed8 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <SkeletonLoader />
        <p style={{ marginTop: '20px', opacity: 0.8 }}>
          {!isInitialized ? 'Initializing...' : 'Loading App...'}
        </p>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <HiddenWalletConnector />
        <FarcasterXPDisplay />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gm" element={<GMGame />} />
            <Route path="/gn" element={<GNGame />} />
            <Route path="/flip" element={<FlipGame />} />
            <Route path="/lucky" element={<LuckyNumberGame />} />
            <Route path="/dice" element={<DiceRollGame />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/deploy" element={<DeployToken />} />
            <Route path="/nft" element={<NFTMint />} />
            <Route path="/swap" element={<TokenSwap />} />
            <Route path="/daily-streak" element={<DailyStreak />} />
            <Route path="/defi" element={<DeFi />} />
            <Route path="/swap-test" element={<SwapTest />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

// Main App component with providers
function App() {
  return (
    <HelmetProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {/* OnchainKitProvider temporarily disabled due to name error */}
          {/* <OnchainKitProvider apiKey="Al1MeOxtVe32i7vc9mBiUO8vx9MgGuUp"> */}
            <FarcasterProvider>
              <AppContent />
            </FarcasterProvider>
          {/* </OnchainKitProvider> */}
        </QueryClientProvider>
      </WagmiProvider>
    </HelmetProvider>
  )
}

export default App
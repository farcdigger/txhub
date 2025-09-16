import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { HelmetProvider } from 'react-helmet-async'
import { FarcasterProvider, useFarcaster } from './contexts/FarcasterContext'
import { config } from './config/wagmi'
import Header from './components/Header'
import XPDisplay from './components/XPDisplay'
import FarcasterXPDisplay from './components/FarcasterXPDisplay'
import SkeletonLoader from './components/SkeletonLoader'
import Home from './pages/Home'
import GMGame from './pages/GMGame'
import GNGame from './pages/GNGame'
import FlipGame from './pages/FlipGame'
import LuckyNumberGame from './pages/LuckyNumberGame'
import DiceRollGame from './pages/DiceRollGame'
import Leaderboard from './pages/Leaderboard'
import { ChevronUp, Loader2 } from 'lucide-react'
import './styles/index.css'

const queryClient = new QueryClient()

// AppContent component - Farcaster Only
function AppContent() {
  const { isInitialized, isReady, isInFarcaster } = useFarcaster()

  // Show loading state while initializing or waiting for ready
  if (!isInitialized || !isReady) {
    return <SkeletonLoader />
  }

  // If not in Farcaster, show message
  if (!isInFarcaster) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '25px',
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <span style={{ fontSize: '48px' }}>🎮</span>
        </div>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          BaseHub
        </h1>
        <p style={{ 
          fontSize: '18px',
          opacity: 0.9,
          marginBottom: '24px',
          maxWidth: '400px'
        }}>
          This app is designed exclusively for Farcaster. Please open it through Farcaster to play games and earn XP!
        </p>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '16px 24px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            Open in Farcaster to start playing!
          </p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App farcaster-app">
        <FarcasterXPDisplay />
        <main className="container farcaster-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gm" element={<GMGame />} />
            <Route path="/gn" element={<GNGame />} />
            <Route path="/flip" element={<FlipGame />} />
            <Route path="/lucky" element={<LuckyNumberGame />} />
            <Route path="/dice" element={<DiceRollGame />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
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
          <FarcasterProvider>
            <AppContent />
          </FarcasterProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </HelmetProvider>
  )
}

export default App

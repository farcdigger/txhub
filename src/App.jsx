import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FarcasterProvider } from './contexts/FarcasterContext'
import Header from './components/Header'
import XPDisplay from './components/XPDisplay'
import Home from './pages/Home'
import GMGame from './pages/GMGame'
import GNGame from './pages/GNGame'
import FlipGame from './pages/FlipGame'
import LuckyNumberGame from './pages/LuckyNumberGame'
import DiceRollGame from './pages/DiceRollGame'
import Leaderboard from './pages/Leaderboard'
import { ChevronUp } from 'lucide-react'
import './styles/index.css'

const queryClient = new QueryClient()

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 100)
      setShowScrollTop(scrollTop > 150) // Header ve XP gizlendikten sonra göster
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <FarcasterProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Header />
            <XPDisplay />
            <main 
              className="container" 
              style={{ 
                paddingTop: isScrolled ? '20px' : '200px', 
                paddingBottom: '40px',
                transition: 'padding-top 0.3s ease'
              }}
            >
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
            
            {/* Scroll to Top Button */}
            {showScrollTop && (
              <button 
                onClick={scrollToTop}
                className="scroll-to-top"
                style={{
                  position: 'fixed',
                  bottom: '30px',
                  right: '30px',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  zIndex: 1000
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.1)'
                  e.target.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)'
                }}
              >
                <ChevronUp size={24} />
              </button>
            )}
          </div>
        </Router>
      </QueryClientProvider>
    </FarcasterProvider>
  )
}

export default App

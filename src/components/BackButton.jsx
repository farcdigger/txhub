import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const BackButton = ({ style = {} }) => {
  const navigate = useNavigate()

  return (
    <button 
      className="back-button"
      onClick={() => navigate('/')}
      style={{
        background: 'rgba(0, 0, 0, 0.05)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#6b7280',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      <ArrowLeft size={16} />
      Ana Sayfa
    </button>
  )
}

export default BackButton

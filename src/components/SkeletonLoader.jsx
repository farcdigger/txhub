import React from 'react'

const SkeletonLoader = () => {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-header">
        <div className="skeleton-logo"></div>
        <div className="skeleton-nav"></div>
      </div>
      
      <div className="skeleton-content">
        <div className="skeleton-card">
          <div className="skeleton-title"></div>
          <div className="skeleton-description"></div>
          <div className="skeleton-button"></div>
        </div>
        
        <div className="skeleton-card">
          <div className="skeleton-title"></div>
          <div className="skeleton-description"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoader

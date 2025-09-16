import React from 'react'
import { Helmet } from 'react-helmet-async'

const EmbedMeta = ({ 
  title, 
  description, 
  image = "/icon.svg", 
  url, 
  buttonText = "Play BaseHub",
  gameType = "game"
}) => {
  const fullUrl = url || window.location.href
  const fullTitle = title ? `${title} - BaseHub` : "BaseHub - Play Games and Earn XP"
  const fullDescription = description || "Play games and earn XP on Base network through Farcaster"

  const embedContent = {
    version: "1",
    imageUrl: image,
    button: {
      title: buttonText,
      action: {
        type: "launch_frame",
        name: fullTitle,
        url: fullUrl,
        splashImageUrl: image,
        splashBackgroundColor: "#6B76D9"
      }
    }
  }

  return (
    <Helmet>
      {/* Farcaster Mini App Embed Meta Tags */}
      <meta name="fc:miniapp" content={JSON.stringify(embedContent)} />
      
      {/* Open Graph Meta Tags for Social Sharing */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Page Title */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
    </Helmet>
  )
}

export default EmbedMeta

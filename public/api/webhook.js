// Farcaster Webhook Handler
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    
    console.log('Farcaster webhook received:', { type, data });
    
    // Handle different webhook types
    switch (type) {
      case 'user.connected':
        console.log('User connected:', data);
        break;
      case 'user.disconnected':
        console.log('User disconnected:', data);
        break;
      case 'cast.created':
        console.log('Cast created:', data);
        break;
      default:
        console.log('Unknown webhook type:', type);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

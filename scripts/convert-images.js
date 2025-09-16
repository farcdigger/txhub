const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Convert icon.svg to icon.png (512x512)
  try {
    await sharp(path.join(publicDir, 'icon.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon.png'));
    console.log('✅ icon.png created (512x512)');
  } catch (error) {
    console.error('❌ Error creating icon.png:', error);
  }
  
  // Convert splash.svg to splash.png (1200x630)
  try {
    await sharp(path.join(publicDir, 'splash.svg'))
      .resize(1200, 630)
      .png()
      .toFile(path.join(publicDir, 'splash.png'));
    console.log('✅ splash.png created (1200x630)');
  } catch (error) {
    console.error('❌ Error creating splash.png:', error);
  }
  
  // Convert image.svg to image.png (1200x630)
  try {
    await sharp(path.join(publicDir, 'image.svg'))
      .resize(1200, 630)
      .png()
      .toFile(path.join(publicDir, 'image.png'));
    console.log('✅ image.png created (1200x630)');
  } catch (error) {
    console.error('❌ Error creating image.png:', error);
  }
  
  console.log('🎨 All images converted successfully!');
}

convertSvgToPng().catch(console.error);

const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToPng() {
  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync('./public/icon.svg');
    
    // Convert SVG to PNG
    await sharp(svgBuffer)
      .png()
      .resize(512, 512)
      .toFile('./public/icon.png');
    
    console.log('✅ SVG converted to PNG successfully!');
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();

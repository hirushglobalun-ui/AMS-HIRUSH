// Simple script to create placeholder PWA icons
// Run with: node create-icons.js

const fs = require('fs');
const path = require('path');

function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#14B8A6"/>
  <text x="50%" y="50%" font-size="${size * 0.6}" font-weight="bold" fill="white" text-anchor="middle" dy="${size * 0.2}">H</text>
</svg>`;
}

// Create 192x192 icon
const icon192 = createSVGIcon(192);
fs.writeFileSync(path.join(__dirname, 'public', 'pwa-192x192.svg'), icon192);

// Create 512x512 icon
const icon512 = createSVGIcon(512);
fs.writeFileSync(path.join(__dirname, 'public', 'pwa-512x512.svg'), icon512);

console.log('✅ SVG icons created successfully!');
console.log('📝 Note: For production, convert these to PNG or create professional icons.');
console.log('   You can use an online tool like https://cloudconvert.com/svg-to-png');

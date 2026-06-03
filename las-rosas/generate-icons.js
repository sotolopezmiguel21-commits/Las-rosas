import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#3B5FCC"/>
  <rect x="206" y="100" width="100" height="200" rx="10" fill="white"/>
  <rect x="156" y="150" width="200" height="100" rx="10" fill="white"/>
  <rect x="226" y="310" width="60" height="100" rx="5" fill="white"/>
</svg>`

const buffer = Buffer.from(svg)

await sharp(buffer).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(buffer).resize(512, 512).png().toFile('public/icon-512.png')

console.log('Íconos generados correctamente')
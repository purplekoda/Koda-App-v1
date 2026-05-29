import { GoogleGenAI } from '@google/genai'
import { writeFileSync } from 'fs'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

const PROMPT = [
  'Wide landscape photograph of an open kitchen pantry shelf unit, well-lit with natural light.',
  'Shelves hold recognizable whole foods: a bag of rolled oats, a can of chickpeas, a bunch of fresh spinach in a clear bag, a block of firm tofu, three red apples, and a bag of brown rice.',
  'Items are neatly arranged with visible labels and a little breathing room between them — tidy and real, not sterile or stock-photo perfect.',
  'Warm neutral background, shallow depth of field, photorealistic, horizontal aspect ratio 16:9.',
  'No text overlays, no watermarks.',
].join(' ')

console.log('Generating pantry image with Imagen 3…')

const response = await ai.models.generateImages({
  model: 'imagen-3.0-generate-002',
  prompt: PROMPT,
  config: {
    numberOfImages: 1,
    aspectRatio: '16:9',
    outputMimeType: 'image/jpeg',
  },
})

const imageData = response.generatedImages[0].image.imageBytes
const buffer = Buffer.from(imageData, 'base64')
writeFileSync('public/demo/pantry.jpg', buffer)
console.log(`Saved ${buffer.length} bytes → public/demo/pantry.jpg`)

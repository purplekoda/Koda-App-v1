export default function manifest() {
  return {
    id: '/',
    name: 'Koda — Meal Planning',
    short_name: 'Koda',
    description: 'AI meal planning that figures out dinner for you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#1D9E75',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

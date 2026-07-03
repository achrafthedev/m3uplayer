import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works from any path (e.g. GitHub Pages
  // project sites served under /<repo>/) without extra configuration.
  base: './',
  plugins: [react()],
  server: {
    // "dev" is this container's hostname on the docker-compose network.
    allowedHosts: ['localhost', 'dev'],
  },
})

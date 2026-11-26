import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Links publicos da Cloudflare (rodar-mirai.bat). Sem isto, o Vite responde "Blocked request" a quem abre o link.
const linksPublicos = ['.trycloudflare.com'];

export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: linksPublicos },
  preview: { allowedHosts: linksPublicos },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
});

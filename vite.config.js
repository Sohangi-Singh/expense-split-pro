import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows clean imports like: import Button from '@/components/common/Button'
      '@': '/src',
    },
  },
});

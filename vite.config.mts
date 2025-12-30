import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';

const port = Number(process.env.PORT || 25123);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, 'src/renderer'),
  plugins: [
    vue(),
    ui({
      router: false,
      ui: {
        colors: {
          neutral: 'zinc',
        },
        select: {
          defaultVariants: {
            variant: 'soft',
          },
        },
        selectMenu: {
          slots: {
            base: 'min-w-45.75',
          },
          defaultVariants: {
            variant: 'soft',
          },
        },
        input: {
          defaultVariants: {
            variant: 'soft',
          },
        },
        textarea: {
          defaultVariants: {
            variant: 'soft',
          },
        },
        card: {
          defaultVariants: {
            variant: 'soft',
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src/renderer'),
    },
  },
  server: {
    port,
    strictPort: true,
  },
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  build: {
    outDir: path.resolve(rootDir, 'release/app/dist/renderer'),
    emptyOutDir: true,
  },
});

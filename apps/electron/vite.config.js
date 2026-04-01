import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

import { createRequire } from 'node:module';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const electronRequire = createRequire(path.join(currentDirectoryPath, 'package.json'));
const sharedReactPath = path.dirname(electronRequire.resolve('react/package.json'));
const sharedReactDomPath = path.dirname(electronRequire.resolve('react-dom/package.json'));

export default defineConfig({
  root: path.join(currentDirectoryPath, 'src', 'renderer'),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: sharedReactPath,
      'react-dom': sharedReactDomPath,
      'react/jsx-runtime': path.resolve(sharedReactPath, 'jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(sharedReactPath, 'jsx-dev-runtime.js')
    }
  },
  plugins: [
    react(),
    {
      name: 'workspace-jsx-in-js',
      async transform(code, id) {
        if (!id.includes('/packages/icons/src/') || !id.endsWith('.js')) {
          return null;
        }

        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic'
        });
      }
    }
  ],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true
  },
  build: {
    outDir: path.join(currentDirectoryPath, 'dist-renderer'),
    emptyOutDir: true
  }
});

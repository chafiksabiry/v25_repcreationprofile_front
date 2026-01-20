import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import qiankun from 'vite-plugin-qiankun';
import * as cheerio from 'cheerio';

// Plugin to remove React Refresh preamble
const removeReactRefreshScript = () => {
  return {
    name: 'remove-react-refresh',
    transformIndexHtml(html) {
      const $ = cheerio.load(html);
      $('script[src="/@react-refresh"]').remove();
      return $.html();
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: 'https://harxv25repcreationprofile.netlify.app/',
    plugins: [
      react({
        jsxRuntime: 'classic',
      }),
      qiankun('repcreationprofile', {
        useDevMode: true,
      }),
      removeReactRefreshScript(), // Add the script removal plugin
    ],

    define: {
      'import.meta.env': env,
    },
    server: {
      port: 5174,
      cors: true,
      hmr: {
        // Enable Hot Module Replacement for real-time updates during development
        // When true, allows components and modules to be updated without a full page refresh
        enabled: true,
        // You can also configure specific HMR options like:
        // host, port, protocol if needed
      },
      fs: {
        strict: true, // Ensure static assets are correctly resolved
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: 'umd',
          name: 'repcreationprofile',
          entryFileNames: 'index.js', // Fixed name for the JS entry file
          chunkFileNames: 'chunk-[name].js', // Fixed name for chunks
          assetFileNames: (assetInfo) => {
            // Ensure CSS files are consistently named
            if (assetInfo.name.endsWith('.css')) {
              return 'index.css';
            }
            return '[name].[ext]'; // Default for other asset types
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});

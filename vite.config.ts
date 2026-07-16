import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { resolve } from 'path'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
      dirs: ['src/components'],
      extensions: ['vue']
    }),
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]',
      inject: 'body-last',
      customDomId: '__svg__icons__dom__'
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/element-plus/dist/theme-chalk/src/fonts/*',
          dest: 'assets/fonts'
        }
      ]
    }),
    // Enable compression in production
    ...(process.env.NODE_ENV === 'production' ? [
      compression({
        algorithm: 'gzip',
        threshold: 10240, // 10KB
        deleteOriginFile: false
      })
    ] : [])
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  server: {
    port: 3001,
    open: true,
    host: true,
    cors: true,
    proxy: {
      // Proxy API requests to backend in development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1)
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/img/[name]-[hash].[ext]'
          }
          if (/css/.test(extType)) {
            return 'assets/css/[name]-[hash].[ext]'
          }
          if (/woff2?/.test(extType)) {
            return 'assets/fonts/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    // Brotli compression
    brotliSize: false
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element/index.scss" as *;`,
        javascriptEnabled: true
      }
    },
    // CSS modules for scoped styles if needed
    modules: {
      localsConvention: 'camelCase'
    }
  },
  define: {
    'process.env': {}
  }
})

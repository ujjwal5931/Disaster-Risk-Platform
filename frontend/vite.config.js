import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // In dev, forward /api calls to the backend
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split heavy deps into separate chunks for faster loading
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'map-vendor': ['leaflet', 'react-leaflet'],
                    'charts-vendor': ['recharts'],
                    'icons-vendor': ['lucide-react'],
                    'state-vendor': ['zustand', 'axios'],
                },
            },
        },
    },
});

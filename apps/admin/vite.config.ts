import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'convex/_generated': path.resolve(__dirname, '../../convex/_generated'),
        },
    },
    server: {
        port: 5174,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});

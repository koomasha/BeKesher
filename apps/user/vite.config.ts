import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { lingui } from '@lingui/vite-plugin';
import path from 'path';

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ['@lingui/babel-plugin-lingui-macro'],
            },
        }),
        lingui(),
    ],
    resolve: {
        alias: {
            'convex/_generated': path.resolve(__dirname, '../../convex/_generated'),
        },
    },
    server: {
        port: 5173,
        host: true,
        allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'],
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});

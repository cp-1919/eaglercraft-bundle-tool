// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/dev/main.js',
            name: 'SetupModule',
            fileName: 'dev',
            formats: ['iife']
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        },
        outDir: 'temp/dev',
    }
});
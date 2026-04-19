// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/template/main.js',
            name: 'SetupModule',
            fileName: 'setup',
            formats: ['iife']
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        },
        outDir: 'temp/template',
    }
});
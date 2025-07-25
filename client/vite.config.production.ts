import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Production optimizations
	build: {
		target: 'esnext',
		minify: 'terser',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte']
				}
			}
		}
	},
	
	// Server configuration for production
	server: {
		host: '0.0.0.0',
		port: 3001
	},
	
	// Environment variables
	define: {
		'process.env.NODE_ENV': '"production"'
	}
}); 
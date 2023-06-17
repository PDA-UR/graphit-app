// vite.config.js
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
	// config options
	build: {
		outDir: "../out/frontend/dist",
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			input: {
				home: "./index.html",
				visTest: "./src/pages/visTest/index.html",
				propertyEditor: "src/pages/propertyEditor/index.html",
				selectionTools: "src/pages/selectionTools/index.html",
			},
		},
	},
	base: isProduction ? "/app/" : "/",
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
	  },
});
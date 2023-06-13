// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
	// config options
	build: {
		outDir: "../out/frontend/dist",
		emptyOutDir: true,
		minify: false,
		sourcemap: true,
		mode: "development",
		rollupOptions: {
			input: {
				home: "./index.html",
				visTest: "./src/pages/visTest/index.html",
				propertyEditor: "src/pages/propertyEditor/index.html",
				selectionTools: "src/pages/selectionTools/index.html",
			},
		},
	},
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
	  },
});
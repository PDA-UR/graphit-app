// vite.config.js
import { defineConfig } from "vite";

// const isProduction = process.env.MODE === 'production';
const noServer = process.env.NO_SERVER === "true";

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
				selectionTools: "src/pages/selectionTools/index.html",
				tableEditor: "src/pages/tableEditor/index.html",
			},
		},
	},
	base: noServer ? "/" : "/app/",
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
	},
});

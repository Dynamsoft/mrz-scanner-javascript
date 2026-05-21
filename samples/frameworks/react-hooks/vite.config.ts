import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import basicSsl from "@vitejs/plugin-basic-ssl";

const SDK_RESOURCES = [
	"dynamsoft-mrz-scanner",
	"dynamsoft-capture-vision-bundle/dist",
	"dynamsoft-capture-vision-data",
];

for (const pkg of SDK_RESOURCES) {
	if (!existsSync(`public/${pkg}`)) {
		cpSync(`node_modules/${pkg}`, `public/${pkg}`, { recursive: true });
	}
}

export default defineConfig({
	plugins: [basicSsl(), react()],
	server: {
		host: "0.0.0.0",
		forwardConsole: true,
		headers: {
			// Enable SharedArrayBuffer so DCV can use the multi-threaded (pthread)
			// WASM variant for better performance.
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
});

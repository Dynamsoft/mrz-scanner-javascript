import { defineConfig, type Plugin, type UserConfig } from "vite";
import { readFileSync, readdirSync, cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import dts from "unplugin-dts/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const DCV = Object.keys(pkg.dependencies).find((k) =>
	k.includes("dynamsoft-capture-vision-bundle"),
)!;

const entry = resolve(import.meta.dirname, "src/build/mrz-scanner.ts");

const banner = `/*!
* Dynamsoft MRZ Scanner JavaScript Library
* @product Dynamsoft MRZ Scanner JS Edition Bundle
* @website http://www.dynamsoft.com
* @copyright Copyright ${new Date().getUTCFullYear()}, Dynamsoft Corporation
* @author Dynamsoft
* @version ${pkg.version}
* @fileoverview Dynamsoft MRZ Scanner JavaScript Edition is a ready-to-use SDK for web applications that accurately recognizes and parses Machine-Readable Zones on Machine-Readable Travel Documents.
* More info on Dynamsoft MRZ SCanner JS: https://www.dynamsoft.com/use-cases/mrz-scanner/
*/`;

// Auto-generate sample listing at / from the samples directory for dev server.
function sampleIndex(): Plugin {
	return {
		name: "sample-index",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url !== "/") return next();
				const files = readdirSync("samples")
					.filter((f) => String(f).endsWith(".html"))
					.map((f) => `samples/${f}`);
				const links = files.map((f) => `<li><a href="/${f}">${f}</a></li>`).join("\n");
				res.setHeader("content-type", "text/html");
				res.end(
					`<meta name="viewport" content="width=device-width,initial-scale=1"><style>li{margin:.5rem 0}li a{font-size:1.25rem}</style><h2>Samples</h2><ul>${links}</ul>`,
				);
			});
		},
	};
}

export default defineConfig((env): UserConfig => {
	// ---- Dev server ----
	if (env.command === "serve") {
		const nodeRequire = createRequire(import.meta.url);
		const SDK_RESOURCES = ["dynamsoft-capture-vision-bundle", "dynamsoft-capture-vision-data"];
		for (const sdkPkg of SDK_RESOURCES) {
			const srcVersion: string = nodeRequire(
				resolve(`node_modules/${sdkPkg}/package.json`),
			).version;
			const destPkgJson = resolve("public", sdkPkg, "package.json");
			const destVersion = existsSync(destPkgJson) ? nodeRequire(destPkgJson).version : null;
			if (srcVersion !== destVersion) {
				cpSync(`node_modules/${sdkPkg}`, `public/${sdkPkg}`, { recursive: true });
			}
		}

		return {
			plugins: [basicSsl(), sampleIndex()],
			appType: "mpa",
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
		};
	}

	/**
	 * ----Library builds----
	 * Pass 1: vite build              → ESM + CJS (DCV external) + d.ts
	 * Pass 2: vite build --mode bundle → IIFE standalone (DCV bundled)
	 */
	const bundle = env.mode === "bundle";

	return {
		plugins: [...(!bundle ? [dts({ bundleTypes: true, tsconfigPath: "./tsconfig.json" })] : [])],
		build: {
			emptyOutDir: !bundle,
			copyPublicDir: false,
			lib: {
				entry,
				name: "Dynamsoft",
				formats: bundle ? ["iife"] : ["es", "cjs"],
				fileName: bundle
					? () => "mrz-scanner.bundle.js"
					: (format: string) => (format === "es" ? "mrz-scanner.mjs" : "mrz-scanner.cjs"),
			},
			rollupOptions: {
				external: bundle ? [] : [DCV],
				output: {
					globals: { [DCV]: "Dynamsoft" },
					banner,
					exports: "named",
					extend: true,
				},
			},
		},
	};
});

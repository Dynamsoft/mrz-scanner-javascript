# MRZ Scanner — Online Demo

A self-contained plain TypeScript + HTML + CSS sample of the [Dynamsoft MRZ Scanner SDK](https://www.dynamsoft.com/use-cases/mrz-scanner/), deployed at <https://demo.dynamsoft.com/mrz-scanner/>. The demo has three phases — a landing screen, the MRZ Scanner, and a result view. This is intended as the public demo for the SDK, a ready-to-fork template for integrators who want a similar end-to-end flow, and an end-to-end development guide for MRZ JS integration.

## Overview

1. **Landing**: "Start Camera Scan" / "Scan from File" buttons. On wide viewports it also shows a QR code + "Continue on Desktop" so phone users get nudged to the better camera path.
2. **Scanner**: launch the MRZ Scanner. All configurations for the scanner are left as default.
3. **Result**: Summary card with name / portrait, Processed/Original image tabs, Personal Info + Document Info field tables, the raw MRZ text, and Re-scan / Return-home actions.

## File layout

```
samples/demo/
├── index.html               # markup for all three phases
├── css/
    ├── index.css            # shared stylesheet — palette in :root tokens
    ├── landing.css          # landing page, one for mobile and desktop
    ├── result.css           # result view matches default style of MRZ Scanner
├── tsconfig.json            # IDE/LSP project config (Vite handles build)
├── vite.config.ts           # demo-build config: bundles src/ + mirrors DCV into public/, serve /public and /dist
├── assets/                  # static assets (logo, QR code SVG)
└── src/                     # TypeScript source
    ├── dom.ts               # $<T>(id) helper, CaptureConfig type
    ├── view.ts              # body[data-view] state, mobile/desktop split, info menu
    ├── scanner.ts           # MRZScanner instance + camera/file/rescan entry points
    ├── results.ts           # displayResults(result, config)
    └── index.ts             # entry — wires DOM events to the exports above
```

The build output lands in `samples/demo/dist/` (gitignored).

## Running locally

From the `samples/demo` directory:

```shell
npm install
npm run build
npm run dev
```

Open the link in your browser as shown by Vite in the shell output(default `https://localhost:5173/`). Accept the self-signed cert.

This serves your source files directly, which has the benefit of live updates via Vite, so you can see your changes live without reloading (HMR). See below for running bundled files locally that you would deploy in production.

## Preview build

Once satisfied with the application, you can serve the production build files (from `/dist`) by running

```shell
npm run build
npm run preview
```

and opening the link to the Vite server (default `https://localhost:4173/`). Because `npm run build` is responsible for the build, `npm run preview` does not offer live reloads like `npm run dev`.

## Distributables

`vite build` reads `samples/demo/index.html`, bundles `src/*.ts` into `assets/index-<hash>.js` with all SDK imports resolved, and emits a self-contained `samples/demo/dist/` whose top level mirrors `public/`, which you can then deploy:

```
samples/demo/dist/
├── index.html
├── assets/                               # bundled demo + SDK ESM, plus
│   ├── index-<hash>.js                   #   own resources picked up by
│   ├── index-<hash>.css                  #   Vite from new URL(...)
│   ├── mrz-scanner.template-<hash>.json
│   └── mrz-scanner.ui-<hash>.xml
├── dynamsoft-capture-vision-bundle/      # WASM, parser data
└── dynamsoft-capture-vision-data/        # OCR data files
```

`vite.config.ts` sets `base: "./"` so all paths in `dist/index.html` are relative — the same output works under any deploy base URL.

## How the SDK is loaded

The TypeScript imports the SDK as an ES module:

```ts
import { MRZScanner, EnumDocumentSide } from "dynamsoft-mrz-scanner";
```

There is also no `engineResourcePaths` override anywhere in the demo's TypeScript. The SDK's default points at jsDelivr (`{rootDirectory: "https://cdn.jsdelivr.net/npm/"}`), so DCV is fetched directly from the CDN. To self-host DCV instead, pass `engineResourcePaths` to the `MRZScanner` constructor pointing at wherever you've deployed the `dynamsoft-capture-vision-bundle` and `dynamsoft-capture-vision-data` folders.

[self]: https://nodejs.org/api/packages.html#self-referencing-a-package-using-its-name

## SDK API reference

- [User guide](https://www.dynamsoft.com/mrz-scanner/docs/web/guides/mrz-scanner.html)
- [Customisation guide](https://www.dynamsoft.com/mrz-scanner/docs/web/guides/mrz-scanner-customization.html)
- [`MRZScanner`](https://www.dynamsoft.com/mrz-scanner/docs/web/api-reference/MRZScanner.html) /
  [`MRZScannerConfig`](https://www.dynamsoft.com/mrz-scanner/docs/web/api-reference/MRZScannerConfig.html) /
  [`MRZResult`](https://www.dynamsoft.com/mrz-scanner/docs/web/api-reference/MRZResult.html)

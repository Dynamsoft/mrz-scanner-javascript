# MRZ Scanner for Web — Getting Started

This guide walks you through standing up a basic MRZ Scanner web app from scratch. The library is loaded from a public CDN so the whole thing is a single HTML file you can open straight from your file system.

For background on MRZs and system requirements, see the [MRZ Introduction](https://www.dynamsoft.com/mrz-scanner/docs/web/introduction/index.html).

## Contents

- [License](#license)
- [Step 1: Create the Sample Page](#step-1-create-the-sample-page)
- [Step 2: Open the Page in a Browser](#step-2-open-the-page-in-a-browser)
- [Customizing the MRZ Scanner](#customizing-the-mrz-scanner)
- [Next Steps](#next-steps)

## License

### Trial License

To get started, grab a 30-day trial license from the [customer portal](https://www.dynamsoft.com/customer/license/trialLicense/?product=mrz&utm_source=guide&package=js). The trial can be renewed twice for 15 days each — a total of 60 days. Need more time? Contact the [Dynamsoft Support Team](https://www.dynamsoft.com/company/contact/).

> [!NOTE]
> The **MRZ Scanner** license covers the three foundational products it relies on: **Dynamsoft Label Recognizer**, **Dynamsoft Code Parser**, and **Dynamsoft Camera Enhancer**.

### Full License

For a full license, contact the [Dynamsoft Sales Team](https://www.dynamsoft.com/company/contact/).

## Step 1: Create the Sample Page

Create an `index.html` file anywhere on your machine. The substeps below build it up piece by piece; the full file is reproduced at the end.

### 1.1: Set Up the HTML Skeleton and Include the MRZ Scanner

Start with a minimal HTML skeleton, pointing a `<script>` tag at the MRZ Scanner bundle on jsDelivr:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Dynamsoft MRZ Scanner</title>
		<script src="https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@4.0.0/dist/mrz-scanner.bundle.js"></script>
		<!-- Alternative CDN: <script src="https://unpkg.com/dynamsoft-mrz-scanner@4.0.0/dist/mrz-scanner.bundle.js"></script> -->
	</head>

	<body>
		<h1>Dynamsoft MRZ Scanner</h1>
	</body>
</html>
```

Once loaded, the bundle exposes a global `Dynamsoft` namespace. The MRZ Scanner ships with a **Ready-to-Use UI**, so no container `<div>` is required in the body — once launched, the UI takes over the page.

> [!NOTE]
> The commented line points to unpkg, which serves the same npm bundle from a different CDN. Swap it in (and comment out the jsDelivr line) if jsDelivr is blocked on your network or you'd rather use unpkg.

> [!IMPORTANT]
> **Production deployments:** Don't ship to production against the public CDN — it's fine for getting started, but for a real deployment you'll want to install the SDK from npm and self-host the runtime assets from your own origin over HTTPS. See the [MRZ Scanner User Guide](https://www.dynamsoft.com/mrz-scanner/docs/web/guides/mrz-scanner.html) for the full production setup.

### 1.2: Add a Container for the Result

Add a `<div>` to the body to display the cropped images and parsed fields after a scan:

```html
<body>
	<h1>Dynamsoft MRZ Scanner</h1>
	<div id="results"></div>
</body>
```

### 1.3: Initialize the MRZ Scanner

In a `<script type="module">` tag at the end of the body, grab the result container and create a new `Dynamsoft.MRZScanner`:

```html
<script type="module">
	const results = document.querySelector("#results");

	const mrzscanner = new Dynamsoft.MRZScanner({
		license: "YOUR_LICENSE_KEY_HERE",
	});
</script>
```

Only one field is required:

- **`license`** — replace `YOUR_LICENSE_KEY_HERE` with your trial or full key (see [License](#license)). An invalid license causes a launch error.

Loaded from the CDN, the bundle resolves its UI/template assets and the DCV engine resources (WASM, model data) from the same CDN automatically — no extra configuration needed. Self-hosting the SDK adds a couple of extra steps; see the [MRZ Scanner User Guide](https://www.dynamsoft.com/mrz-scanner/docs/web/guides/mrz-scanner.html) for the full production setup.

### 1.4: Launch the Scanner

Below the constructor, `await` `launch()` at the module's top level:

```js
const result = await mrzscanner.launch();
if (!result?.data) {
	results.textContent = "No MRZ scanned. Please try again.";
}
```

`launch()` opens the **MRZScannerView** (live camera + guide frame). When an MRZ is recognized — from the live feed or an uploaded image — the promise resolves with an `MRZResult`. A cancelled or failed scan resolves with no `data`, so we fall back to a short message.

### 1.5: Render the Result

Expand the success branch to append both document-side crops, the portrait crop, and a `<pre>` dump of the parsed data:

```js
const result = await mrzscanner.launch();
if (!result?.data) {
	results.textContent = "No MRZ scanned. Please try again.";
} else {
	const mrzSide = result.getDocumentImage(Dynamsoft.EnumDocumentSide.MRZ);
	const portraitSide = result.getDocumentImage(Dynamsoft.EnumDocumentSide.Opposite);
	const portrait = result.getPortraitImage();
	if (portraitSide?.toCanvas) results.appendChild(portraitSide.toCanvas());
	if (mrzSide?.toCanvas) results.appendChild(mrzSide.toCanvas());
	if (portrait?.toCanvas) results.appendChild(portrait.toCanvas());

	const pre = document.createElement("pre");
	pre.textContent = JSON.stringify(result.data, null, 2);
	results.appendChild(pre);
}
```

Key bits:

- `result.data` — the parsed MRZ payload (names, document number, dates, etc.). Missing means the scan failed or was cancelled.
- `result.getDocumentImage(side)` — deskewed crop of the document. `EnumDocumentSide.MRZ` is the side carrying the MRZ; `EnumDocumentSide.Opposite` is the other side, only populated when the portrait was found on the opposite side (multi-side scanning). The result also exposes `getOriginalImage(side)` for the raw uncropped frame.
- `result.getPortraitImage()` — cropped portrait, regardless of which side it was found on.
- `toCanvas()` — returns an `HTMLCanvasElement` ready to append.

For a human-readable label table instead of raw JSON, iterate `result.data` and look up each key in `Dynamsoft.MRZDataLabel` (e.g. `documentNumber` → `"Document Number"`).

### 1.6: The Complete `index.html` File

The finished file:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Dynamsoft MRZ Scanner</title>
		<script src="https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@4.0.0/dist/mrz-scanner.bundle.js"></script>
		<!-- Alternative CDN: <script src="https://unpkg.com/dynamsoft-mrz-scanner@4.0.0/dist/mrz-scanner.bundle.js"></script> -->
	</head>

	<body>
		<h1>Dynamsoft MRZ Scanner</h1>
		<div id="results"></div>

		<script type="module">
			const results = document.querySelector("#results");

			const mrzscanner = new Dynamsoft.MRZScanner({
				license: "YOUR_LICENSE_KEY_HERE",
			});

			const result = await mrzscanner.launch();
			if (!result?.data) {
				results.textContent = "No MRZ scanned. Please try again.";
			} else {
				const mrzSide = result.getDocumentImage(Dynamsoft.EnumDocumentSide.MRZ);
				const portraitSide = result.getDocumentImage(Dynamsoft.EnumDocumentSide.Opposite);
				const portrait = result.getPortraitImage();
				if (portraitSide?.toCanvas) results.appendChild(portraitSide.toCanvas());
				if (mrzSide?.toCanvas) results.appendChild(mrzSide.toCanvas());
				if (portrait?.toCanvas) results.appendChild(portrait.toCanvas());

				const pre = document.createElement("pre");
				pre.textContent = JSON.stringify(result.data, null, 2);
				results.appendChild(pre);
			}
		</script>
	</body>
</html>
```

## Step 2: Open the Page in a Browser

Double-click `index.html` (or drag it into a browser window) and grant camera permission when prompted — the MRZScannerView will appear and start scanning.

> [!NOTE]
> Chrome, Edge, and Firefox treat `file://` URLs as a secure context, so the camera API works when you open the file directly. Safari is stricter and may refuse camera access on `file://`. If that happens, serve `index.html` over a local development server — `http://localhost` URLs count as secure contexts too, so any lightweight static server will do. **For VS Code users:** the **Five Server** extension is a quick way to do this — install it from the marketplace, open `index.html`, and click **Go Live** in the status bar to serve the page at `http://127.0.0.1:5500/`.

## Customizing the MRZ Scanner

The scanner exposes a focused set of customization options across two configuration interfaces — `MRZScannerConfig` (top-level) and `MRZScannerViewConfig` (nested under `scannerViewConfig`). With these you can restrict which MRZ document types are recognized, control which images are returned on the result, show or hide individual UI elements, tune the multi-side flip flow, restyle toolbar buttons, localize every on-screen message, and re-skin the overlay via theme tokens.

For the full option reference with snippets for each group, see the [MRZ Scanner Customization Guide](https://www.dynamsoft.com/mrz-scanner/docs/web/guides/mrz-scanner-customization.html).

## Next Steps

- The [MRZ Scanner Customization Guide](https://www.dynamsoft.com/mrz-scanner/docs/web/guides/mrz-scanner-customization.html) for deeper API context.
- [FAQ](https://www.dynamsoft.com/mrz-scanner/docs/web/faq/index.html) to help with any troubleshooting questions you might have.
- Reach out to [Dynamsoft Support](https://www.dynamsoft.com/company/contact/) for help with integration or to request an extended trial license.

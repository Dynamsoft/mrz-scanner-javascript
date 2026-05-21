// Scanner orchestration — owns the MRZScanner instance and the three
// user-facing entry points (camera, file, re-scan).

import { MRZScanner } from "dynamsoft-mrz-scanner";
import { $, type CaptureConfig } from "./dom.js";
import { showLanding, showScanner } from "./view.js";
import { displayResults } from "./results.js";

const startCameraScanButton = $<HTMLButtonElement>("startCameraScan");
const uploadFileButton = $<HTMLButtonElement>("uploadFile");
const homeError = $("home-error");

const LICENSE =
	"YOUR_LICENSE_KEY_HERE";

// The demo always returns all three image kinds — there's no UI to
// toggle them and the result view is built around showing each one.
const CAPTURE_CONFIG: CaptureConfig = {
	returnOriginalImage: true,
	returnDocumentImage: true,
	returnPortraitImage: true,
};

let mrzScanner: MRZScanner | null = null;

try {
	mrzScanner = new MRZScanner({ license: LICENSE });
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error("Failed to initialize scanner:", error);
	homeError.innerHTML = `<div class="error-message">Failed to initialize scanner: ${message}</div>`;
	startCameraScanButton.disabled = true;
	uploadFileButton.disabled = true;
}

function setActionButtonsDisabled(disabled: boolean): void {
	startCameraScanButton.disabled = disabled;
	uploadFileButton.disabled = disabled;
}

function pickImageFile(): Promise<File | null> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.style.display = "none";
		const finish = (file: File | null) => {
			document.body.removeChild(input);
			resolve(file);
		};
		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			finish(target.files?.[0] ?? null);
		};
		input.addEventListener("cancel", () => finish(null));
		document.body.appendChild(input);
		input.click();
	});
}

async function launchScanner(file: File | null): Promise<void> {
	if (mrzScanner) mrzScanner.dispose();
	mrzScanner = new MRZScanner({ license: LICENSE, ...CAPTURE_CONFIG });
	showScanner();
	try {
		const result = await mrzScanner.launch(file ?? undefined);
		if (result) displayResults(result, CAPTURE_CONFIG);
	} finally {
		// Fall back to landing if neither displayResults nor an outer
		// handler transitioned away from the scanner view (e.g. user
		// dismissed without scanning, or launch rejected).
		if (document.body.dataset.view === "scanner") showLanding();
	}
}

export async function startCameraScan(): Promise<void> {
	setActionButtonsDisabled(true);
	homeError.innerHTML = "";
	try {
		await launchScanner(null);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("Scanning error:", error);
		homeError.innerHTML = `<div class="error-message">Scanning error: ${message}</div>`;
	} finally {
		setActionButtonsDisabled(false);
	}
}

export async function startFileUpload(): Promise<void> {
	// Prompt the user for a file before doing any heavy work.
	const file = await pickImageFile();
	if (!file) return;

	setActionButtonsDisabled(true);
	homeError.innerHTML = "";
	try {
		await launchScanner(file);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("File scan error:", error);
		homeError.innerHTML = `<div class="error-message">File scan error: ${message}</div>`;
	} finally {
		setActionButtonsDisabled(false);
	}
}

export async function rescan(): Promise<void> {
	// Hide the result view before the scanner mounts — otherwise it peeks
	// out from behind the scanner overlay. On success displayResults will
	// flip back to the result view; on dismissal the user lands here; on
	// error the catch block keeps us on the landing with the error message.
	showLanding();
	try {
		await launchScanner(null);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("Re-scan error:", error);
		homeError.innerHTML = `<div class="error-message">Scanning error: ${message}</div>`;
	}
}

/** Strict element lookup that throws on missing nodes. */
export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Missing #${id}`);
	return el as T;
};

/** Capture-flag toggles passed to the MRZScanner constructor and read
 * by the result view to decide which images to render. */
export interface CaptureConfig {
	returnOriginalImage: boolean;
	returnDocumentImage: boolean;
	returnPortraitImage: boolean;
}

// View-state — owns body[data-view] and the info-menu dropdown. The
// mobile/desktop landing swap is handled entirely by CSS media queries
// (see landing.css) so the correct view renders before this module runs.

import { $ } from "./dom.js";

const homeError = $("home-error");

export function showLanding(): void {
	document.body.dataset.view = "landing";
	homeError.innerHTML = "";
}

export function showResult(): void {
	document.body.dataset.view = "result";
}

// While the SDK's scanner overlay is mounted.
export function showScanner(): void {
	document.body.dataset.view = "scanner";
}

// ---- Info menu (dropdown in the result header) ----

const infoMenu = $("info-menu");
document.querySelector<HTMLButtonElement>(".info-btn")!.addEventListener("click", () => {
	infoMenu.classList.toggle("open");
});
document.addEventListener("click", (e) => {
	if (!infoMenu.contains(e.target as Node)) infoMenu.classList.remove("open");
});

// Result rendering — populates the result-section DOM from an MRZResult,
// owns the Processed/Original tab toggle.

import { EnumDocumentSide } from "dynamsoft-mrz-scanner";
import type { MRZDate, MRZImage, MRZResult } from "dynamsoft-mrz-scanner";
import { $, type CaptureConfig } from "./dom.js";
import { showLanding, showResult } from "./view.js";

type TabKey = "processed" | "original";

const portraitPlaceholderTemplate = $<HTMLTemplateElement>("portrait-placeholder");
const homeError = $("home-error");

function formatDate(dateObj: MRZDate | undefined | null): string {
	if (!dateObj || !dateObj.year) return "—";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${dateObj.year}-${pad(dateObj.month)}-${pad(dateObj.day)}`;
}

// Friendly labels for the EnumMRZDocumentType values the SDK returns.
const DOC_TYPE_LABEL: Record<string, string> = {
	td1_id: "ID Card (TD1)",
	td2_id: "ID Card (TD2)",
	td3_passport: "Passport (TD3)",
	mrva_visa: "Visa (MRV-A)",
	mrvb_visa: "Visa (MRV-B)",
};

function formatDocType(raw: unknown): string {
	if (raw == null) return "";
	const key = String(raw);
	return DOC_TYPE_LABEL[key] ?? key;
}

function formatAge(age: number | undefined | null): string {
	if (age == null) return "";
	return `${age} year${age === 1 ? "" : "s"} old`;
}

function escapeHTML(str: unknown): string {
	return String(str ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function dataRow(label: string, value: unknown): string {
	return `<div class="data-row">
		<span class="data-row-label">${escapeHTML(label)}</span>
		<span class="data-row-value">${escapeHTML(value || "—")}</span>
	</div>`;
}

function appendImageCard(container: HTMLElement, imageData: MRZImage | null): void {
	if (!imageData) return;
	const card = document.createElement("div");
	card.className = "tab-image-card";
	card.appendChild(imageData.toCanvas());
	container.appendChild(card);
}

function switchTab(tab: TabKey): void {
	const processedPanel = $("tab-processed");
	const originalPanel = $("tab-original");
	const tabBtns = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
	const [processedBtn, originalBtn] = tabBtns;

	const isProcessed = tab === "processed";
	processedPanel.classList.toggle("active", isProcessed);
	originalPanel.classList.toggle("active", !isProcessed);
	processedBtn.classList.toggle("active", isProcessed);
	originalBtn.classList.toggle("active", !isProcessed);
}

document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
	btn.addEventListener("click", () => switchTab(btn.dataset.tab as TabKey));
});

export function displayResults(result: MRZResult, config: CaptureConfig): void {
	if (!result.data) {
		showLanding();
		homeError.innerHTML = `<div class="error-message">No MRZ data detected. Please try again.</div>`;
		return;
	}

	const d = result.data;

	const name = [d.firstName, d.lastName].filter(Boolean).join(" ");
	$("res-name").textContent = name || "—";

	const genderAge = [d.sex, formatAge(d.age)].filter(Boolean).join(", ");
	$("res-gender-age").textContent = genderAge;

	const expiryStr = formatDate(d.dateOfExpiry);
	$("res-expiry").textContent = expiryStr !== "—" ? `Expiry: ${expiryStr}` : "";

	const portraitContainer = $("portrait-container");
	const portraitImage = config.returnPortraitImage ? result.getPortraitImage() : null;

	if (portraitImage) {
		portraitContainer.replaceChildren(portraitImage.toCanvas());
	} else {
		portraitContainer.replaceChildren(portraitPlaceholderTemplate.content.cloneNode(true));
	}

	const processedPanel = $("tab-processed");
	processedPanel.innerHTML = "";
	if (config.returnDocumentImage) {
		appendImageCard(processedPanel, result.getDocumentImage(EnumDocumentSide.MRZ));
		appendImageCard(processedPanel, result.getDocumentImage(EnumDocumentSide.Opposite));
	}
	if (processedPanel.children.length === 0) {
		processedPanel.innerHTML = `<p class="tab-empty-msg">No document images available</p>`;
	}

	const originalPanel = $("tab-original");
	originalPanel.innerHTML = "";
	if (config.returnOriginalImage) {
		appendImageCard(originalPanel, result.getOriginalImage(EnumDocumentSide.MRZ));
		appendImageCard(originalPanel, result.getOriginalImage(EnumDocumentSide.Opposite));
	}
	if (originalPanel.children.length === 0) {
		originalPanel.innerHTML = `<p class="tab-empty-msg">No original images available</p>`;
	}

	$("personal-info-rows").innerHTML =
		dataRow("Given Name", d.firstName) +
		dataRow("Surname", d.lastName) +
		dataRow("Date of Birth", formatDate(d.dateOfBirth)) +
		dataRow("Gender", d.sex) +
		dataRow("Nationality", d.nationality);

	$("document-info-rows").innerHTML =
		dataRow("Doc. Type", formatDocType(d.documentType)) +
		dataRow("Doc. Number", d.documentNumber) +
		dataRow("Issuing State", d.issuingState) +
		dataRow("Expiry Date", formatDate(d.dateOfExpiry));

	$("mrz-raw-text").textContent = d.mrzText || "";

	switchTab("processed");
	showResult();
}

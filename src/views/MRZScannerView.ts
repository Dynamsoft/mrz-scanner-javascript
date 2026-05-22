import {
	EnumCapturedResultItemType,
	OriginalImageResultItem,
	CapturedResultReceiver,
	CapturedResult,
	Feedback,
	MultiFrameResultCrossFilter,
	Quadrilateral,
	ImageProcessor,
	IdentityProcessor,
	IntermediateResultReceiver,
	LocalizedTextLinesUnit,
	EnumCodeType,
} from "dynamsoft-capture-vision-bundle";
import { SharedResources } from "../MRZScanner";
import {
	EnumResultStatus,
	UtilizedTemplateNames,
	EnumMRZScanMode,
	EnumMRZDocumentType,
} from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./utils/LoadingScreen";
import { createStyle, getElement, STANDARD_RESOLUTIONS } from "./utils";
import { MRZData, MRZResult, MRZResultImpl } from "./utils/MRZParser";
import {
	processImageFromCapturedResult,
	expandQuad,
	getValidDocumentQuad,
	validatePortraitLocation,
	hasHighConfidencePortraitZone,
	PORTRAIT_MARGINS,
	attachImageHelpers,
	type MRZImage,
} from "./utils/ImageProcessingHelper";
import {
	ScannerUIElements,
	buildScannerOverlay,
	DCE_HIDE_CONTROLS_STYLE,
	SCANNER_VIEW_STYLE,
	FRAME_MRZ_SVG,
	FRAME_PORTRAIT_SVG,
	DEFAULT_MESSAGES_CONFIG,
} from "./MRZScannerViewUI";

// ─── UI Customization Configuration Interfaces ────────────────────────────────

/**
 * Configuration for a single toolbar button
 */
export interface ToolbarButton {
	id: string;
	icon?: string;
	label?: string;
	isHidden?: boolean;
	className?: string;
}

/**
 * Partial configuration for toolbar buttons (id is required internally)
 */
export type ToolbarButtonConfig = Partial<Omit<ToolbarButton, "id">>;

/**
 * Configuration for all toolbar buttons
 */
export interface ToolbarButtonsConfig {
	close?: ToolbarButtonConfig;
	loadImage?: ToolbarButtonConfig;
	cameraSwitch?: ToolbarButtonConfig;
	flash?: ToolbarButtonConfig;
	flashOff?: ToolbarButtonConfig;
	sound?: ToolbarButtonConfig;
	soundOff?: ToolbarButtonConfig;
}

/**
 * Configuration for format selector button labels
 */
export interface FormatSelectorConfig {
	passportLabel?: string;
	idLabel?: string;
	visaLabel?: string;
	allLabel?: string;
}

/**
 * Configuration for UI messages and localization
 */
export interface MessagesConfig {
	positionMRZ?: string;
	holdSteady?: string;
	scanSuccess?: string;
	flipDocument?: string;
	flipDocumentCountdown?: string; // Template with {seconds} placeholder
	positionPortrait?: string;
	scanMRZFirst?: string;
	scanningPortrait?: string;
	portraitScanned?: string;
	bothSidesScanned?: string;
	skipPortraitLabel?: string;
	loadImageFailed?: string;
	cameraAccessDenied?: string;
	rotateDevice?: string;
}

export interface ThemeConfig {
	colors?: {
		primary?: string;
		accent?: string;
		backgroundDark?: string;
		backgroundBadge?: string;
		backgroundOverlay?: string;
		backgroundSkipLabel?: string;
		text?: string;
		textSecondary?: string;
		divider?: string;
		guideFrame?: string;
		spinnerColor?: string;
		spinnerBackground?: string;
	};

	typography?: {
		fontFamily?: string;
		badgeFontSize?: string;
		badgeFontSizeDesktop?: string;
		formatBtnFontSize?: string;
		formatBtnFontSizeSmall?: string;
	};

	spacing?: {
		topBarHeight?: string;
		topBarHeightDesktop?: string;
		guideFrameWidth?: string;
		guideFrameWidthDesktop?: string;
		badgeMargin?: string;
		badgeBorderRadius?: string;
	};
}

// ─── Main Configuration Interface ─────────────────────────────────────────────

export interface MRZScannerViewConfig {
	cameraEnhancerUIPath?: string; // DEPRECATED!
	uiPath?: string;

	container?: HTMLElement | string;
	templateFilePath?: string;
	utilizedTemplateNames?: UtilizedTemplateNames;
	mrzFormatType?: EnumMRZDocumentType | Array<EnumMRZDocumentType>;

	// Customize Scanner
	enableScanRegion?: boolean;
	showLoadImageButton?: boolean;
	showFormatSelector?: boolean;
	showSoundToggle?: boolean;

	enableMultiFrameCrossFilter?: boolean; // true by default

	loadImageAcceptedTypes?: string; // Default: "image/*"
	loadImageFileConverter?: (file: File) => Promise<Blob>; // Converter for non-image files (e.g. PDF → image Blob)

	// Milliseconds to pause scanning after MRZ side is captured, giving the user time to flip
	// the document before portrait-side scanning begins. Only applies to different-side scenarios.
	// Default: 3000 (3 seconds)
	flipDocumentTimeout?: number;

	// ─── UI Customization Options ─────────────────────────────────────────────────
	toolbarButtonsConfig?: ToolbarButtonsConfig;
	formatSelectorConfig?: FormatSelectorConfig;
	messagesConfig?: MessagesConfig;
	themeConfig?: ThemeConfig;
}

const PASSPORT_RATIO = { width: 125, height: 88 };
const MRTD_TYPES: EnumCodeType[] = [
	EnumCodeType.CT_MRTD_TD1_ID,
	EnumCodeType.CT_MRTD_TD2_ID,
	EnumCodeType.CT_MRTD_TD3_PASSPORT,
	EnumCodeType.CT_MRTD_TD2_VISA,
	EnumCodeType.CT_MRTD_TD3_VISA,
	EnumCodeType.CT_MRTD_TD2_FRENCH_ID,
];

// Mapping from EnumMRZDocumentType to EnumCodeType
const MRZ_DOCUMENT_TYPE_TO_CODE_TYPE: Record<EnumMRZDocumentType, EnumCodeType[]> = {
	[EnumMRZDocumentType.Passport]: [EnumCodeType.CT_MRTD_TD3_PASSPORT],
	[EnumMRZDocumentType.TD1]: [EnumCodeType.CT_MRTD_TD1_ID],
	[EnumMRZDocumentType.TD2]: [EnumCodeType.CT_MRTD_TD2_ID, EnumCodeType.CT_MRTD_TD2_FRENCH_ID],
	[EnumMRZDocumentType.MRVA]: [EnumCodeType.CT_MRTD_TD3_VISA],
	[EnumMRZDocumentType.MRVB]: [EnumCodeType.CT_MRTD_TD2_VISA],
};
const MRZScanGuideRatios = {
	// Use TD3/passport as default
	...Object.fromEntries(MRTD_TYPES.map((t) => [t, PASSPORT_RATIO])),
	[EnumCodeType.CT_MRTD_TD1_ID]: { width: 85.6, height: 53.98 },
	[EnumCodeType.CT_MRTD_TD2_ID]: { width: 105, height: 74 },
	[EnumCodeType.CT_MRTD_TD2_VISA]: { width: 120, height: 80 },
	[EnumCodeType.CT_MRTD_TD3_VISA]: { width: 105, height: 74 },
	[EnumCodeType.CT_MRTD_TD2_FRENCH_ID]: { width: 105, height: 74 },
} as Record<EnumCodeType, { width: number; height: number }>;

const CROP_MARGIN_PX = 14;

// Implementation
export default class MRZScannerView {
	private isSoundFeedbackOn: boolean = false;
	private isFlashOn: boolean = false;

	private static readonly FORMAT_ORDER = ["visa", "all", "passport", "id"] as const;
	private currentFormatMode: (typeof MRZScannerView.FORMAT_ORDER)[number] = "all";

	private scanModeManager!: Record<EnumCodeType, boolean>;
	private currentScanMode: EnumMRZScanMode = EnumMRZScanMode.All;

	private messages: typeof DEFAULT_MESSAGES_CONFIG;

	private resizeTimer: number | null = null;
	private defaultBackCameraId: string | null = null;

	private originalImageData: MRZImage | null = null;

	private initialized: boolean = false;
	private initializedUI: boolean = false;

	// Multi-side scanning state
	private isMRZScanned: boolean = false;
	private isPortraitScanned: boolean = false;
	private areSidesDifferent: boolean = false;

	// UI-only: true while the flip countdown animation is showing (does NOT gate detection).
	private isWaitingForFlip: boolean = false;
	private flipTimeoutHandle: number | null = null;
	private flipCountdownHandle: number | null = null;
	// Timer for the portrait-phase skip label (5 s after entering portrait phase).
	private portraitSkipTimerHandle: number | null = null;
	private static readonly PORTRAIT_SKIP_TIMEOUT_MS = 5000;
	// Mutex: prevents concurrent same-side portrait detection across frames.
	private isProcessingSameSideFrame: boolean = false;
	private isProcessingPortraitFrame: boolean = false;
	// Number of consecutive same-side misses (low confidence or failed detection)
	// before the flip animation is shown. Prevents a single transient miss from
	// incorrectly triggering the flip on single-sided documents.
	private sameSideMissCount: number = 0;
	private static readonly SAME_SIDE_MISSES_BEFORE_FLIP = 3;

	// Number of consecutive frames the portrait-side document quad has passed
	// cross-verification. Capture is deferred until this reaches the threshold,
	// which ensures the card is genuinely settled after a flip.
	private consecutiveStablePortraitFrames: number = 0;
	private static readonly PORTRAIT_STABLE_FRAMES_REQUIRED = 3;

	// Latest LocalizedTextLinesUnit from the intermediate result receiver, used to
	// gate the expensive findPortraitZone() call behind a confidence pre-check.
	private latestLocalizedTextLines: LocalizedTextLinesUnit | null = null;

	// Stored data from first scan (MRZ side)
	private mrzSideData: {
		processedData: MRZData | null;
		primaryOriginalImage: MRZImage | null;
		primaryDocumentImage: MRZImage | null;
		portraitImage: MRZImage | null;
	} = {
		processedData: null,
		primaryOriginalImage: null,
		primaryDocumentImage: null,
		portraitImage: null,
	};

	// Custom overlay UI elements
	private ui: ScannerUIElements | null = null;

	// SVG scan spinner (lives in DCE shadow root, queried in initializeUI)
	private scanSpinnerEl: HTMLElement | null = null;

	// Scan Resolve
	private currentScanResolver?: (result: MRZResult) => void;

	private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

	private showScannerLoadingOverlay(message?: string) {
		const configContainer = getElement(this.config.container);
		if (!configContainer) throw new Error("Scanner view container not found");
		this.loadingScreen = showLoadingScreen(configContainer, { message });
		configContainer.style.display = "block";
		configContainer.style.position = "relative";
	}

	private hideScannerLoadingOverlay(hideContainer: boolean = false) {
		if (this.loadingScreen) {
			this.loadingScreen.hide();
			this.loadingScreen = null;

			if (hideContainer) {
				getElement(this.config.container)!.style.display = "none";
			}
		}
	}

	private handleResize = () => {
		this.setGuideFrameVisible(false);
		if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
		this.resizeTimer = window.setTimeout(() => {
			this.setGuideFrameVisible(this.config.enableScanRegion !== false);
			this.updateScanRegion();
		}, 500);
	};

	constructor(
		private resources: SharedResources,
		private config: MRZScannerViewConfig,
	) {
		// Merge user messages config with defaults
		this.messages = { ...DEFAULT_MESSAGES_CONFIG, ...config.messagesConfig };
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		this.initializeScanModeManager();
		this.currentScanMode = this.getScanMode();

		createStyle("dynamsoft-mrz-loading-screen-style", DEFAULT_LOADING_SCREEN_STYLE);
		createStyle("dynamsoft-mrz-scanner-view-style", SCANNER_VIEW_STYLE);

		try {
			const { cameraView, cameraEnhancer, cvRouter } = this.resources;
			if (!cameraView || !cameraEnhancer || !cvRouter) {
				throw new Error("Camera resources not initialized");
			}

			try {
				cameraView.setScanRegionMaskStyle({
					strokeStyle: "transparent",
					fillStyle: "transparent",
					lineWidth: 0,
				});
				cameraView.setVideoFit("cover");
			} catch (e) {
				// UI not ready yet
			}

			cvRouter.setInput(cameraEnhancer);

			if (this.config.enableMultiFrameCrossFilter === true) {
				const filter = new MultiFrameResultCrossFilter();
				filter.enableResultCrossVerification(EnumCapturedResultItemType.CRIT_TEXT_LINE, true);

				await cvRouter.addResultFilter(filter);
			}

			const resultReceiver = new CapturedResultReceiver();
			resultReceiver.onCapturedResultReceived = (result: CapturedResult) =>
				this.handleMRZResult(result);
			cvRouter.addResultReceiver(resultReceiver);

			if (this.resources.returnPortraitImage) {
				const intermediateReceiver = new IntermediateResultReceiver();
				intermediateReceiver.onLocalizedTextLinesReceived = (unit: LocalizedTextLinesUnit) => {
					this.latestLocalizedTextLines = unit;
				};
				cvRouter.getIntermediateResultManager().addResultReceiver(intermediateReceiver);
			}

			this.initialized = true;
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error(errMsg);
			alert(errMsg);
			this.closeCamera();
			const result = new MRZResultImpl({ status: EnumResultStatus.RS_FAILED });
			this.currentScanResolver?.(result);
		}
	}

	// ─── UI initialisation ────────────────────────────────────────────────────

	private initializeUI() {
		const configContainer = getElement(this.config.container);
		if (!configContainer) throw new Error("Container element not found");

		// Suppress DCE native controls via an injected stylesheet in the shadow root
		const DCEContainer = configContainer.children[configContainer.children.length - 1];
		if (DCEContainer?.shadowRoot) {
			if (!DCEContainer.shadowRoot.querySelector("#mrz-dce-hide-style")) {
				const hideStyle = document.createElement("style");
				hideStyle.id = "mrz-dce-hide-style";
				hideStyle.textContent = DCE_HIDE_CONTROLS_STYLE;
				DCEContainer.shadowRoot.appendChild(hideStyle);
			}
			this.scanSpinnerEl = DCEContainer.shadowRoot.querySelector(".dce-mn-scan-spinner");
			if (this.scanSpinnerEl) {
				const colors = this.config.themeConfig?.colors;
				if (colors?.spinnerColor) {
					this.scanSpinnerEl.style.setProperty("--mrz-spinner-color", colors.spinnerColor);
				}
				if (colors?.spinnerBackground) {
					this.scanSpinnerEl.style.setProperty(
						"--mrz-spinner-background",
						colors.spinnerBackground,
					);
				}
			}
		}

		// Build and inject our overlay
		const showLoadImage = this.config.showLoadImageButton !== false;
		const visibleFormatButtons = this.getVisibleFormatButtons();
		const showFormatSelector = this.config.showFormatSelector === true;
		const showSoundToggle = this.config.showSoundToggle !== false;

		this.ui = buildScannerOverlay({
			showLoadImage,
			showFormatSelector,
			visibleFormatButtons,
			showSoundToggle,
			toolbarButtonsConfig: this.config.toolbarButtonsConfig,
			formatSelectorConfig: this.config.formatSelectorConfig,
			messagesConfig: this.config.messagesConfig,
			themeConfig: this.config.themeConfig,
		});
		configContainer.appendChild(this.ui.overlay);

		// Wire events
		this.ui.closeBtn.addEventListener("click", () => this.handleCloseBtn());
		this.ui.loadImageBtn.addEventListener("click", () => this.loadImageFile());
		this.ui.cameraSwitchBtn.addEventListener("click", () => this.switchCamera());
		this.ui.flashBtn.addEventListener("click", () => this.toggleFlash());
		this.ui.soundBtn.addEventListener("click", () => this.toggleSoundFeedback());
		this.ui.skipPortraitLabel.addEventListener("click", () => this.handleSkipPortrait());

		if (this.ui.formatPassportBtn) {
			this.ui.formatPassportBtn.addEventListener("click", () => this.setFormatMode("passport"));
		}
		if (this.ui.formatIdBtn) {
			this.ui.formatIdBtn.addEventListener("click", () => this.setFormatMode("id"));
		}
		if (this.ui.formatVisaBtn) {
			this.ui.formatVisaBtn.addEventListener("click", () => this.setFormatMode("visa"));
		}
		if (this.ui.formatAllBtn) {
			this.ui.formatAllBtn.addEventListener("click", () => this.setFormatMode("all"));
		}

		if (this.ui.formatSelector) {
			let startX = 0;
			this.ui.formatSelector.addEventListener(
				"touchstart",
				(e) => {
					startX = e.touches[0].clientX;
				},
				{ passive: true },
			);
			this.ui.formatSelector.addEventListener(
				"touchend",
				(e) => {
					const deltaX = e.changedTouches[0].clientX - startX;
					if (Math.abs(deltaX) < 50) return;
					const order = this.getVisibleFormatButtons();
					const idx = order.indexOf(this.currentFormatMode);
					if (idx < 0) return;
					if (deltaX < 0 && idx < order.length - 1) this.setFormatMode(order[idx + 1]);
					else if (deltaX > 0 && idx > 0) this.setFormatMode(order[idx - 1]);
				},
				{ passive: true },
			);
		}

		// Set initial sound state (off)
		this.toggleSoundFeedback(false);

		// Set initial active format button to match current scan mode
		this.syncFormatButtons();

		// Hide flash button — will be shown/hidden after camera opens based on capability
		this.ui.flashBtn.classList.add("mrz-hidden");

		// Setup portrait-only mode for mobile devices
		this.setupPortraitOnlyMode();

		this.initializedUI = true;
	}

	/**
	 * Returns the set of enabled MRZ types from config, or all types if unspecified.
	 */
	private getEnabledTypes(): Set<EnumCodeType> {
		const types = this.config.mrzFormatType;
		if (!types) return new Set(MRTD_TYPES);

		const typesArray = Array.isArray(types) ? types : [types];
		// Convert EnumMRZDocumentType to EnumCodeType
		const codeTypes = typesArray.flatMap((docType) => MRZ_DOCUMENT_TYPE_TO_CODE_TYPE[docType]);
		return codeTypes.length > 0 ? new Set(codeTypes) : new Set(MRTD_TYPES);
	}

	/**
	 * Returns the format buttons to display based on enabled types.
	 * Includes "all" only when multiple categories are active.
	 *
	 * @returns The visible button identifiers in display order. A result of
	 *   length `<= 1` indicates the selector should be hidden entirely.
	 */
	private getVisibleFormatButtons(): Array<(typeof MRZScannerView.FORMAT_ORDER)[number]> {
		const enabled = this.getEnabledTypes();

		const categories = (["passport", "id", "visa"] as const).filter((cat) =>
			MRZScannerView.FORMAT_DOC_TYPES[cat].some((t) => enabled.has(t)),
		);

		// Show "all" button only when 2+ categories are available
		if (categories.length <= 1) {
			return categories;
		}

		return ["all", ...categories];
	}

	// ─── Flash ────────────────────────────────────────────────────────────────

	private async toggleFlash() {
		try {
			const { cameraEnhancer } = this.resources;
			if (!cameraEnhancer) return;
			if (this.isFlashOn) {
				await cameraEnhancer.turnOffTorch();
				this.isFlashOn = false;
			} else {
				await cameraEnhancer.turnOnTorch();
				this.isFlashOn = true;
			}
			this.syncFlashIcon();
		} catch {
			// Device doesn't support flash; hide the button
			this.ui?.flashBtn.classList.add("mrz-hidden");
		}
	}

	private syncFlashIcon() {
		if (!this.ui) return;
		this.ui.flashOnIcon.style.display = this.isFlashOn ? "inline" : "none";
		this.ui.flashOffIcon.style.display = this.isFlashOn ? "none" : "inline";
	}

	private probeFlashSupport() {
		try {
			const { cameraEnhancer } = this.resources;
			if (!cameraEnhancer) return;
			const caps = cameraEnhancer.getCapabilities();
			if (caps && (caps as any).torch) {
				this.ui?.flashBtn.classList.remove("mrz-hidden");
			} else {
				this.ui?.flashBtn.classList.add("mrz-hidden");
			}
		} catch {
			this.ui?.flashBtn.classList.add("mrz-hidden");
		}
	}

	// ─── Camera switch ────────────────────────────────────────────────────────

	private async switchCamera() {
		try {
			const { cameraEnhancer } = this.resources;
			if (!cameraEnhancer) return;

			// Use enumerateDevices directly to avoid DCE's _setCapabilities which
			// opens every camera individually (triggers permission prompts on Firefox Android).
			const devices = await navigator.mediaDevices.enumerateDevices();
			const cameras = devices
				.filter((d) => d.kind === "videoinput")
				.map((d) => ({ deviceId: d.deviceId, label: d.label }));
			if (cameras.length <= 1) {
				this.ui?.cameraSwitchBtn.classList.add("mrz-hidden");
				return;
			}

			const currentSettings = cameraEnhancer.getCameraSettings();
			const isOnDefaultBack = currentSettings?.deviceId === this.defaultBackCameraId;

			let target: { deviceId: string } | undefined;
			if (isOnDefaultBack) {
				// Go to front camera; fall back to first non-default camera if label is unlabelled
				target =
					cameras.find((c: { label: string; deviceId: string }) =>
						/front|user|selfie/i.test(c.label),
					) ??
					cameras.find(
						(c: { label: string; deviceId: string }) => c.deviceId !== this.defaultBackCameraId,
					);
			} else {
				// Return to the original default back camera
				target = cameras.find(
					(c: { label: string; deviceId: string }) => c.deviceId === this.defaultBackCameraId,
				);
			}

			if (!target) return;
			await cameraEnhancer.selectCamera(target.deviceId);
			this.setGuideFrameVisible(false);
			window.setTimeout(() => {
				this.setGuideFrameVisible(this.config.enableScanRegion !== false);
				this.updateScanRegion();
			}, 300);
		} catch (ex: any) {
			console.warn("Camera switch failed:", ex?.message || ex);
		}
	}

	// ─── Sound feedback ───────────────────────────────────────────────────────

	private toggleSoundFeedback(enabled?: boolean) {
		this.isSoundFeedbackOn = enabled !== undefined ? enabled : !this.isSoundFeedbackOn;
		if (!this.ui) return;
		this.ui.soundOnIcon.style.display = this.isSoundFeedbackOn ? "inline" : "none";
		this.ui.soundOffIcon.style.display = this.isSoundFeedbackOn ? "none" : "inline";
	}

	// ─── Guide frame ──────────────────────────────────────────────────────────

	private setGuideFrame(type: "mrz" | "portrait") {
		if (!this.ui) return;
		// Save the flip animation node before replacing innerHTML (which would destroy it).
		const { flipAnimation } = this.ui;
		this.ui.guideFrame.innerHTML = type === "mrz" ? FRAME_MRZ_SVG : FRAME_PORTRAIT_SVG;
		this.ui.guideFrame.appendChild(flipAnimation);
	}

	private setGuideFrameVisible(visible: boolean) {
		if (!this.ui) return;
		this.ui.guideFrame.style.visibility = visible ? "visible" : "hidden";
	}

	private showGuideSuccessBorder(duration: number = 1000) {
		if (!this.ui) return;
		this.ui.guideFrame.classList.add("mrz-guide-success");
		window.setTimeout(() => {
			this.ui?.guideFrame.classList.remove("mrz-guide-success");
		}, duration);
	}

	// ─── Flip animation ───────────────────────────────────────────────────────

	private showFlipAnimation(): void {
		if (!this.ui) return;
		const { flipAnimation } = this.ui;
		const flipCard = flipAnimation.querySelector(".mrz-flip-card") as HTMLElement | null;
		if (!flipCard) return;
		// Reset any previous animation run before making the element visible
		flipCard.classList.remove("mrz-flip-animate");
		flipAnimation.classList.add("mrz-flip-visible");
		// Force a reflow so removing the class above takes effect before re-adding it
		void flipCard.offsetWidth;
		flipCard.classList.add("mrz-flip-animate");
		// Auto-hide the animation picture 2 seconds after the flip completes
		flipCard.addEventListener(
			"animationend",
			() => {
				window.setTimeout(() => this.hideFlipAnimation(), 2000);
			},
			{ once: true },
		);
	}

	private hideFlipAnimation(): void {
		if (!this.ui) return;
		const { flipAnimation } = this.ui;
		flipAnimation.classList.remove("mrz-flip-visible");
		const flipCard = flipAnimation.querySelector(".mrz-flip-card") as HTMLElement | null;
		flipCard?.classList.remove("mrz-flip-animate");
	}

	// ─── Status badge ─────────────────────────────────────────────────────────

	private showBadge(line1: string, line1Success: boolean, line2?: string, line2Success?: boolean) {
		if (!this.ui) return;
		const { badge, badgeLine1, badgeLine2 } = this.ui;

		badgeLine1.textContent = line1;
		badgeLine1.className = `mrz-badge-line${line1Success ? " mrz-success" : ""}`;

		if (line2 !== undefined) {
			badgeLine2.textContent = line2;
			badgeLine2.className = `mrz-badge-line${line2Success ? " mrz-success" : ""}`;
			badgeLine2.style.display = "block";
		} else {
			badgeLine2.style.display = "none";
		}

		badge.classList.add("mrz-badge-visible");
	}

	// ─── Format selector ──────────────────────────────────────────────────────

	private static readonly FORMAT_DOC_TYPES: Record<
		(typeof MRZScannerView.FORMAT_ORDER)[number],
		EnumCodeType[]
	> = {
		passport: [EnumCodeType.CT_MRTD_TD3_PASSPORT],
		id: [
			EnumCodeType.CT_MRTD_TD1_ID,
			EnumCodeType.CT_MRTD_TD2_ID,
			EnumCodeType.CT_MRTD_TD2_FRENCH_ID,
		],
		visa: [EnumCodeType.CT_MRTD_TD2_VISA, EnumCodeType.CT_MRTD_TD3_VISA],
		all: MRTD_TYPES,
	};

	private static buildScanModeManager(enabledTypes: EnumCodeType[]): Record<EnumCodeType, boolean> {
		const enabled = new Set(enabledTypes);
		return Object.fromEntries(MRTD_TYPES.map((dt) => [dt, enabled.has(dt)])) as Record<
			EnumCodeType,
			boolean
		>;
	}

	private async setFormatMode(mode: (typeof MRZScannerView.FORMAT_ORDER)[number]) {
		try {
			const enabled = this.getEnabledTypes();
			this.scanModeManager = MRZScannerView.buildScanModeManager(
				MRZScannerView.FORMAT_DOC_TYPES[mode].filter((t) => enabled.has(t)),
			);
			this.currentScanMode = this.getScanMode();
			this.stopCapturing();
			this.updateScanRegion();
			await this.startCapturing();
			this.syncFormatButtons();
		} catch (ex: any) {
			console.error("MRZ Scanner switch scan mode error:", ex?.message || ex);
			this.closeCamera();
			this.currentScanResolver?.(new MRZResultImpl({ status: EnumResultStatus.RS_FAILED }));
		}
	}

	private syncFormatButtons() {
		if (!this.ui) return;
		const { formatPassportBtn, formatIdBtn, formatVisaBtn, formatAllBtn } = this.ui;

		const m = this.scanModeManager;
		const hasPassport = m[EnumCodeType.CT_MRTD_TD3_PASSPORT];
		const hasId =
			m[EnumCodeType.CT_MRTD_TD1_ID] ||
			m[EnumCodeType.CT_MRTD_TD2_ID] ||
			m[EnumCodeType.CT_MRTD_TD2_FRENCH_ID];
		const hasVisa = m[EnumCodeType.CT_MRTD_TD2_VISA] || m[EnumCodeType.CT_MRTD_TD3_VISA];

		type FormatMode = (typeof MRZScannerView.FORMAT_ORDER)[number];
		let active: FormatMode = "all";
		if (hasPassport && !hasId && !hasVisa) active = "passport";
		else if (hasId && !hasPassport && !hasVisa) active = "id";
		else if (hasVisa && !hasPassport && !hasId) active = "visa";
		this.currentFormatMode = active;

		const btnMap: Record<FormatMode, HTMLElement | null> = {
			visa: formatVisaBtn,
			all: formatAllBtn,
			passport: formatPassportBtn,
			id: formatIdBtn,
		};

		for (const [mode, btn] of Object.entries(btnMap)) {
			if (btn) btn.className = `mrz-format-btn${mode === active ? " mrz-format-active" : ""}`;
		}

		// Slide the row so the active button is centred in the container.
		// Each button is `flex: 1` of N visible buttons, so one step = 100/N %.
		// translateX(%) is relative to the row's own width.
		const activeBtn = btnMap[active];
		if (!activeBtn) return;
		const visible = this.getVisibleFormatButtons();
		const activeIdx = visible.indexOf(active);
		const N = visible.length;
		const btnsRow = activeBtn.parentElement as HTMLElement;
		btnsRow.style.transform = `translateX(${((N - 1) / 2 - activeIdx) * (100 / N)}%)`;
	}

	// ─── Portrait-only mode ───────────────────────────────────────────────────

	private setupPortraitOnlyMode() {
		if (!this.ui) return;

		const rotationOverlay = this.ui.rotationOverlay;
		const landscapeQuery = window.matchMedia("(orientation: landscape) and (max-width: 1023px)");

		const handleOrientation = (e: MediaQueryList | MediaQueryListEvent) => {
			rotationOverlay.classList.toggle("mrz-rotation-visible", e.matches);
		};

		landscapeQuery.addEventListener("change", handleOrientation);
		handleOrientation(landscapeQuery);
	}

	// ─── Scan region ──────────────────────────────────────────────────────────

	private updateScanRegion() {
		if (this.config.enableScanRegion === false) return;
		let docType: EnumCodeType;
		switch (this.currentScanMode) {
			case EnumMRZScanMode.TD1:
			case EnumMRZScanMode.TD1AndTD2:
				docType = EnumCodeType.CT_MRTD_TD1_ID;
				break;
			case EnumMRZScanMode.TD2:
				docType = EnumCodeType.CT_MRTD_TD2_ID;
				break;
			case EnumMRZScanMode.MRVA:
			case EnumMRZScanMode.MRVAAndMRVB:
				docType = EnumCodeType.CT_MRTD_TD3_VISA;
				break;
			case EnumMRZScanMode.MRVB:
				docType = EnumCodeType.CT_MRTD_TD2_VISA;
				break;
			default:
				docType = EnumCodeType.CT_MRTD_TD3_PASSPORT;
				break;
		}
		this.calculateScanRegion(docType);
	}

	private calculateScanRegion(documentType: EnumCodeType) {
		const { cameraEnhancer, cameraView } = this.resources;
		if (!cameraEnhancer || !cameraEnhancer.isOpen() || !cameraView) return;

		const targetRatio =
			MRZScanGuideRatios[documentType].width / MRZScanGuideRatios[documentType].height;
		const visibleRegion = cameraView.getVisibleRegionOfVideo({ inPixels: true });
		if (!visibleRegion) return;

		const { width, height } = visibleRegion;
		let region: {
			left: number;
			right: number;
			top: number;
			bottom: number;
			isMeasuredInPercentage: boolean;
		};

		if (width > height) {
			// Landscape
			const targetHeight = 0.5 * height;
			const targetWidth = targetHeight * targetRatio;
			const widthPercent = Math.round((targetWidth / width) * 100);
			const leftPercent = (100 - widthPercent) / 2;
			region = {
				left: leftPercent,
				right: leftPercent + widthPercent,
				top: 25,
				bottom: 75,
				isMeasuredInPercentage: true,
			};
		} else {
			// Portrait
			const targetWidth = 0.9 * width;
			const targetHeight = targetWidth / targetRatio;
			const heightPercent = Math.round((targetHeight / height) * 100);
			const topPercent = (100 - heightPercent) / 2;
			region = {
				left: 5,
				right: 95,
				top: topPercent,
				bottom: topPercent + heightPercent,
				isMeasuredInPercentage: true,
			};
		}

		try {
			cameraView.setScanRegionMaskVisible(true);
		} catch (e) {}

		try {
			const layer1 = cameraView.getDrawingLayer(1);
			if (layer1) layer1.setVisible(false);
		} catch (e) {}

		try {
			const layer3 = cameraView.getDrawingLayer(3);
			if (layer3) layer3.setVisible(false);
		} catch (e) {}

		try {
			cameraEnhancer.setScanRegion(region);
		} catch (e) {}
	}

	// ─── Camera lifecycle ─────────────────────────────────────────────────────

	async openCamera(): Promise<void> {
		try {
			const { cameraEnhancer, cameraView } = this.resources;
			if (!cameraEnhancer || !cameraView) throw new Error("Camera resources not initialized");
			const configContainer = getElement(this.config.container);
			if (!configContainer) throw new Error("Container element not found");
			configContainer.style.display = "block";

			const currentCameraView = cameraView.getUIElement();

			if (!cameraEnhancer.isOpen()) {
				if (!currentCameraView.parentElement) {
					configContainer.append(currentCameraView);
				}

				// Skip DCE's camera inspection to avoid multiple getUserMedia calls
				// triggering a permission prompt for each on Firefox Android.
				cameraEnhancer.ifSkipCameraInspection = true;

				// Set resolution before open() so the desired constraints are included
				// in the initial getUserMedia call, avoiding a later renegotiation.
				await cameraEnhancer.setResolution(STANDARD_RESOLUTIONS["2k"]);

				await cameraEnhancer.open();

				const settings = cameraEnhancer.getCameraSettings();
				if (settings?.deviceId) this.defaultBackCameraId = settings.deviceId;
			} else if (cameraEnhancer.isPaused()) {
				await cameraEnhancer.resume();
			}

			const uiShadowRoot = currentCameraView.shadowRoot;
			if (uiShadowRoot) {
				const nativeLikeUI = uiShadowRoot.querySelector(
					".dce-macro-use-mobile-native-like-ui",
				) as HTMLElement;
				if (nativeLikeUI) nativeLikeUI.style.display = "block";
			}

			// Build overlay once per instance
			if (!this.initializedUI && cameraEnhancer.isOpen()) {
				this.initializeUI();
			}

			// Use enumerateDevices directly to check for multiple cameras without
			// triggering DCE's _setCapabilities (which opens every camera individually).
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter((d) => d.kind === "videoinput");
			const frontCamera = videoDevices.find((d) => /front|user|selfie/i.test(d.label));
			const hasToggleTarget =
				videoDevices.length > 1 &&
				(frontCamera || videoDevices.some((d) => d.deviceId !== this.defaultBackCameraId));
			if (hasToggleTarget) {
				this.ui?.cameraSwitchBtn.classList.remove("mrz-hidden");
			} else {
				this.ui?.cameraSwitchBtn.classList.add("mrz-hidden");
			}

			// Probe torch support
			this.probeFlashSupport();

			window.addEventListener("resize", this.handleResize);
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error(errMsg);

			const isPermissionDenied =
				ex?.name === "NotAllowedError" ||
				(typeof errMsg === "string" && errMsg.toLowerCase().includes("permission denied"));

			if (isPermissionDenied) {
				alert(this.messages.cameraAccessDenied);
			} else {
				alert(errMsg);
			}

			this.closeCamera();
			this.currentScanResolver?.(new MRZResultImpl({ status: EnumResultStatus.RS_FAILED }));
		}
	}

	async closeCamera(hideContainer: boolean = true) {
		try {
			window.removeEventListener("resize", this.handleResize);
			if (this.resizeTimer) {
				window.clearTimeout(this.resizeTimer);
				this.resizeTimer = null;
			}

			this.defaultBackCameraId = null;

			const { cameraEnhancer, cameraView } = this.resources;
			const configContainer = getElement(this.config.container);
			if (!configContainer) return;
			configContainer.style.display = hideContainer ? "none" : "block";

			if (cameraView?.getUIElement().parentElement) {
				configContainer.removeChild(cameraView.getUIElement());
			}

			// Remove our overlay when camera closes so it gets re-created fresh
			if (this.ui?.overlay.parentElement) {
				configContainer.removeChild(this.ui.overlay);
			}
			this.ui = null;
			this.initializedUI = false;

			if (!cameraEnhancer) return;
			cameraEnhancer.close();
			this.stopCapturing();
		} catch (ex: any) {
			console.error(`Close Camera error: ${ex?.message || ex}`);
		}
	}

	pauseCamera() {
		this.resources.cameraEnhancer?.pause();
	}

	stopCapturing() {
		const { cameraView, cvRouter } = this.resources;
		if (!cvRouter || !cameraView) return;
		cvRouter.stopCapturing();
		cameraView.clearAllInnerDrawingItems();
	}

	// ─── Close button ─────────────────────────────────────────────────────────

	private handleCloseBtn() {
		this.closeCamera();

		if (this.currentScanResolver) {
			if (this.isMRZScanned && !this.isPortraitScanned && this.areSidesDifferent) {
				const mrzResult = new MRZResultImpl({
					status: EnumResultStatus.RS_SUCCESS,
					data: this.mrzSideData.processedData!,
					primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
					primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
					portraitImage: this.mrzSideData.portraitImage,
				});
				this.currentScanResolver?.(mrzResult);
				this.resetScanningState();
			} else {
				this.currentScanResolver(new MRZResultImpl({ status: EnumResultStatus.RS_CANCELLED }));
				this.resetScanningState();
			}
		}
	}

	// ─── Portrait skip ────────────────────────────────────────────────────────

	private startPortraitSkipTimer(): void {
		if (this.portraitSkipTimerHandle !== null) return; // already running
		this.portraitSkipTimerHandle = window.setTimeout(() => {
			this.portraitSkipTimerHandle = null;
			this.ui?.skipPortraitLabel.classList.add("mrz-skip-portrait-visible");
		}, MRZScannerView.PORTRAIT_SKIP_TIMEOUT_MS);
	}

	private clearPortraitSkipTimer(): void {
		if (this.portraitSkipTimerHandle !== null) {
			window.clearTimeout(this.portraitSkipTimerHandle);
			this.portraitSkipTimerHandle = null;
		}
		this.ui?.skipPortraitLabel.classList.remove("mrz-skip-portrait-visible");
	}

	private handleSkipPortrait(): void {
		this.closeCamera();

		if (this.currentScanResolver) {
			const mrzResult = new MRZResultImpl({
				status: EnumResultStatus.RS_SUCCESS,
				data: this.mrzSideData.processedData!,
				primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
				primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
				portraitImage: null,
			});
			this.resources.onResultUpdated?.(mrzResult);
			this.currentScanResolver?.(mrzResult);
			this.resetScanningState();
		}
	}

	// ─── Image file loader ────────────────────────────────────────────────────

	private async loadImageFile() {
		const { cvRouter } = this.resources;
		if (!cvRouter) throw new Error("Router not initialized");

		const input = document.createElement("input");
		input.type = "file";
		input.accept = this.config.loadImageAcceptedTypes ?? "image/*";
		input.style.display = "none";
		document.body.appendChild(input);

		try {
			this.showScannerLoadingOverlay("Processing file...");
			await this.closeCamera(false);

			const file = await new Promise<File>((resolve, reject) => {
				input.onchange = (e: Event) => {
					const f = (e.target as HTMLInputElement).files?.[0];
					if (!f) {
						reject(new Error("No file selected"));
						return;
					}
					resolve(f);
				};
				input.addEventListener("cancel", async () => {
					this.hideScannerLoadingOverlay(false);
					this.showScannerLoadingOverlay("Initializing camera...");
					await this.openCamera();
					this.setGuideFrameVisible(this.config.enableScanRegion !== false);
					this.updateScanRegion();
					await this.startCapturing();
					this.hideScannerLoadingOverlay();
				});
				input.click();
			});

			if (!file) return;

			let fileBlob: Blob;
			if (this.config.loadImageFileConverter && !file.type.startsWith("image/")) {
				try {
					fileBlob = await this.config.loadImageFileConverter(file);
				} catch (error) {
					throw new Error(
						`Error converting file: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			} else if (file.type.startsWith("image/")) {
				fileBlob = file;
			} else {
				throw new Error(
					"Unsupported file type. Please provide a converter function for this file type.",
				);
			}

			const templatePair = this.config.utilizedTemplateNames![this.currentScanMode];
			const currentTemplate = typeof templatePair === "string" ? templatePair : templatePair.full;
			const capturedResult = await cvRouter.capture(fileBlob, currentTemplate);

			const result = await processImageFromCapturedResult(capturedResult, {
				returnDocumentImage: this.resources.returnDocumentImage,
				returnPortraitImage: this.resources.returnPortraitImage,
			});

			this.originalImageData = result.imageData;

			const mrzResult = new MRZResultImpl({
				status: EnumResultStatus.RS_SUCCESS,
				data: result.processedData,
				primaryOriginalImage: result.imageData,
				primaryDocumentImage: result.primaryDocumentImage,
				portraitImage: result.portraitImage,
			});

			this.resources.onResultUpdated?.(mrzResult);
			this.currentScanResolver?.(mrzResult);
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error(errMsg);
			alert(errMsg);
			this.closeCamera();
			this.currentScanResolver?.(new MRZResultImpl({ status: EnumResultStatus.RS_FAILED }));
		} finally {
			this.hideScannerLoadingOverlay(true);
			document.body.removeChild(input);
		}
	}

	// ─── Scan mode management ─────────────────────────────────────────────────

	private initializeScanModeManager() {
		const { mrzFormatType } = this.config;

		this.scanModeManager = MRZScannerView.buildScanModeManager(MRTD_TYPES);

		if (!mrzFormatType || (Array.isArray(mrzFormatType) && mrzFormatType.length === 0)) return;

		// Reset all to false first
		Object.keys(this.scanModeManager).forEach((key) => {
			this.scanModeManager[key as EnumCodeType] = false;
		});

		// Convert EnumMRZDocumentType to EnumCodeType and enable them
		const types = Array.isArray(mrzFormatType) ? mrzFormatType : [mrzFormatType];
		types.forEach((docType) => {
			const codeTypes = MRZ_DOCUMENT_TYPE_TO_CODE_TYPE[docType];
			codeTypes.forEach((codeType) => {
				this.scanModeManager[codeType] = true;
			});
		});
	}

	private getScanMode(): EnumMRZScanMode {
		const m = this.scanModeManager;
		const hasPassport = m[EnumCodeType.CT_MRTD_TD3_PASSPORT];
		const hasTD1 = m[EnumCodeType.CT_MRTD_TD1_ID];
		const hasTD2 = m[EnumCodeType.CT_MRTD_TD2_ID] || m[EnumCodeType.CT_MRTD_TD2_FRENCH_ID];
		const hasMRVA = m[EnumCodeType.CT_MRTD_TD3_VISA];
		const hasMRVB = m[EnumCodeType.CT_MRTD_TD2_VISA];
		const hasVisa = hasMRVA || hasMRVB;
		const hasID = hasTD1 || hasTD2;

		const categoryCount = [hasPassport, hasVisa, hasID].filter(Boolean).length;

		if (categoryCount === 3) {
			return EnumMRZScanMode.All;
		}

		if (categoryCount === 2) {
			if (hasPassport && hasID && !hasVisa) {
				if (hasTD1 && !hasTD2) return EnumMRZScanMode.PassportAndTD1;
				if (hasTD2 && !hasTD1) return EnumMRZScanMode.PassportAndTD2;
				if (hasTD1 && hasTD2) return EnumMRZScanMode.All;
			}
			return EnumMRZScanMode.All;
		}

		if (hasPassport) return EnumMRZScanMode.TD3;
		if (hasMRVA && hasMRVB) return EnumMRZScanMode.MRVAAndMRVB;
		if (hasMRVA) return EnumMRZScanMode.MRVA;
		if (hasMRVB) return EnumMRZScanMode.MRVB;
		if (hasTD1 && hasTD2) return EnumMRZScanMode.TD1AndTD2;
		if (hasTD1) return EnumMRZScanMode.TD1;
		if (hasTD2) return EnumMRZScanMode.TD2;

		return EnumMRZScanMode.All;
	}

	// ─── Capturing ────────────────────────────────────────────────────────────

	private firstFrame = true;
	private async startCapturing() {
		const { cvRouter } = this.resources;
		if (!cvRouter) throw new Error("Router not initialized");
		const templatePair = this.config.utilizedTemplateNames![this.currentScanMode];
		const mrzOnlyTemplate =
			typeof templatePair === "string" ? `${templatePair}-MRZOnly` : templatePair.mrzOnly;
		try {
			this.firstFrame = true;
			await cvRouter.startCapturing(mrzOnlyTemplate);
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error("Failed to start capturing:", errMsg);
			this.closeCamera();
			this.currentScanResolver?.(new MRZResultImpl({ status: EnumResultStatus.RS_FAILED }));
		}
	}

	private hasSwitchedToFullTemplate: boolean = false;
	private async switchToFullTemplate(): Promise<void> {
		if (this.hasSwitchedToFullTemplate) return;
		this.hasSwitchedToFullTemplate = true;
		const { cvRouter } = this.resources;
		if (!cvRouter) return;
		const templatePair = this.config.utilizedTemplateNames![this.currentScanMode];
		const fullTemplate = typeof templatePair === "string" ? templatePair : templatePair.full;
		try {
			cvRouter.stopCapturing();
			await cvRouter.startCapturing(fullTemplate);
		} catch (ex) {
			console.warn("Template switch failed:", ex);
			this.hasSwitchedToFullTemplate = false;
		}
	}

	// ─── Launch ───────────────────────────────────────────────────────────────

	async launch(): Promise<MRZResult | undefined> {
		try {
			this.resetScanningState();
			await this.initialize();

			return new Promise(async (resolve) => {
				this.currentScanResolver = resolve;

				this.showScannerLoadingOverlay("Initializing camera...");
				await this.openCamera();

				// Show guide frame and set scan region
				this.setGuideFrame("mrz");
				this.setGuideFrameVisible(this.config.enableScanRegion !== false);
				this.updateScanRegion();

				await this.startCapturing();
				this.hideScannerLoadingOverlay();

				// Initial badge message
				if (this.resources.returnPortraitImage) {
					this.showBadge(this.messages.scanMRZFirst, false);
				} else {
					this.showBadge(this.messages.positionMRZ, false);
				}
			});
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error("MRZ Scanner launch error:", errMsg);
			this.closeCamera();
			this.currentScanResolver?.(new MRZResultImpl({ status: EnumResultStatus.RS_FAILED }));
		}
	}

	// ─── Result handling ──────────────────────────────────────────────────────

	private isDocumentTypeEnabled(codeType: EnumCodeType): boolean {
		return this.scanModeManager[codeType] === true;
	}

	async handleMRZResult(result: CapturedResult) {
		if (this.firstFrame) {
			this.firstFrame = false;
			return;
		}

		if (result.items.length <= 1 && !this.isMRZScanned) {
			this.hideScanSpinner();
			return;
		}

		if (this.isMRZScanned && !this.isPortraitScanned && this.resources.returnPortraitImage) {
			// Always update originalImageData from the current frame so portrait/document
			// crops are taken from the frame being analyzed, not a stale previous one.
			const originalImages = result.items.filter(
				(item: any) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE,
			) as OriginalImageResultItem[];
			if (originalImages.length > 0) {
				this.originalImageData = attachImageHelpers(originalImages[0].imageData);
			}

			// Content-based routing (mirrors Android's onMRZDataReceived / onNoMRZPageReceived):
			// If this frame still contains MRZ text the card hasn't been flipped yet — try
			// to find the portrait on the same side.  If there is no MRZ text the user has
			// turned the card over — try to find the portrait on this new side immediately,
			// no timeout needed.
			const hasMRZ = !!result?.parsedResult?.parsedResultItems?.length;
			if (hasMRZ) {
				await this.tryPortraitOnSameSide(result, this.resources.onResultUpdated);
			} else if (originalImages.length > 0) {
				await this.handlePortraitSideScan(result, this.resources.onResultUpdated);
			}
			return;
		}

		if (result.items.length <= 1) {
			if (!this.isMRZScanned) this.hideScanSpinner();
			return;
		}

		try {
			const { onResultUpdated } = this.resources;

			const parsedResultItems = result?.parsedResult?.parsedResultItems;

			const filteredParsedResultItems = parsedResultItems?.filter((item: any) => {
				const codeType = item.codeType as EnumCodeType;
				return this.isDocumentTypeEnabled(codeType);
			});

			if (!this.isMRZScanned) {
				if (filteredParsedResultItems?.length) {
					this.showScanSpinner();
				} else {
					this.hideScanSpinner();
				}
			}

			if (filteredParsedResultItems?.length && !this.isMRZScanned) {
				this.isMRZScanned = true;

				if (this.isSoundFeedbackOn) Feedback.beep();

				const filteredResult: CapturedResult = {
					...result,
					parsedResult: result.parsedResult
						? {
								...result.parsedResult,
								parsedResultItems: filteredParsedResultItems,
							}
						: result.parsedResult,
				};

				let overrideDocumentResult: CapturedResult["processedDocumentResult"] | null = null;
				if (
					(this.resources.returnDocumentImage || this.resources.returnPortraitImage) &&
					this.resources.cvRouter
				) {
					const originalImageItem = result.items.find(
						(it: any) => it.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE,
					) as OriginalImageResultItem | undefined;
					if (originalImageItem) {
						try {
							const ddnResult = await this.resources.cvRouter.capture(
								originalImageItem.imageData,
								"DetectAndNormalizeDocument_Default",
							);
							overrideDocumentResult = ddnResult?.processedDocumentResult ?? null;
						} catch (ex) {
							console.warn("DDN failed:", ex);
						}
					}
				}

				const processedResult = await processImageFromCapturedResult(filteredResult, {
					returnDocumentImage: this.resources.returnDocumentImage,
					returnPortraitImage: false, // Portrait handled separately in video mode
					overrideDocumentResult,
				});

				// Store original image for portrait extraction
				this.originalImageData = processedResult.imageData;

				const documentQuad = overrideDocumentResult?.detectedQuadResultItems?.[0]?.location ?? null;

				await this.handleMRZSideScan(
					processedResult.processedData,
					processedResult.primaryDocumentImage,
					documentQuad,
					onResultUpdated,
				);
			}
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error(errMsg);
			alert(errMsg);
			this.closeCamera();
			this.currentScanResolver?.(new MRZResultImpl({ status: EnumResultStatus.RS_FAILED }));
		}
	}

	private async handleMRZSideScan(
		processedData: MRZData,
		primaryDocumentImage: MRZImage | null,
		documentQuad: Quadrilateral | null,
		onResultUpdated?: (result: MRZResult) => void,
	): Promise<void> {
		let portraitImage: MRZImage | null = null;
		let portraitFound = false;

		if (this.resources.returnPortraitImage && this.originalImageData) {
			try {
				const portraitQuad = await IdentityProcessor.findPortraitZone();

				if (portraitQuad && !(portraitQuad as any).errorCode && portraitQuad.points?.length === 4) {
					const isValid = documentQuad
						? validatePortraitLocation(portraitQuad, documentQuad)
						: true;

					if (isValid) {
						const expandedQuad = expandQuad(portraitQuad, PORTRAIT_MARGINS, this.originalImageData);
						portraitImage = attachImageHelpers(
							await ImageProcessor.cropAndDeskewImage(this.originalImageData, expandedQuad),
						);
						portraitFound = true;
					}
				}
			} catch (ex) {
				console.warn("Error finding portrait zone:", ex);
			}
		}

		this.isMRZScanned = true;
		this.mrzSideData = {
			processedData,
			primaryOriginalImage: this.originalImageData,
			primaryDocumentImage,
			portraitImage,
		};

		if (this.resources.returnPortraitImage && !portraitFound) {
			// Portrait not found on this frame — defer the flip UI decision to
			// tryPortraitOnSameSide so it gets one more chance on the very next frame.
			// This prevents a brief flash of the flip animation for single-sided
			// documents where findPortraitZone() just had a transient miss.
			this.hideScanSpinner();
			this.showGuideSuccessBorder(1000);
			this.showBadge(this.messages.scanSuccess, true, this.messages.scanningPortrait, false);
			// areSidesDifferent intentionally left false here; tryPortraitOnSameSide
			// will set it (and show the flip animation) if its attempt also fails.
			this.startPortraitSkipTimer();
		} else {
			this.hideScanSpinner();
			this.areSidesDifferent = false;
			this.isPortraitScanned = true;

			this.showGuideSuccessBorder(1000);
			const line2 = portraitImage ? this.messages.portraitScanned : undefined;
			this.showBadge(this.messages.scanSuccess, true, line2, !!line2);

			setTimeout(() => {
				this.closeCamera();

				const mrzResult = new MRZResultImpl({
					status: EnumResultStatus.RS_SUCCESS,
					data: processedData,
					primaryOriginalImage: this.originalImageData,
					primaryDocumentImage,
					portraitImage,
				});

				onResultUpdated?.(mrzResult);
				this.currentScanResolver?.(mrzResult);
				this.resetScanningState();
			}, 1000);
		}
	}

	private async tryPortraitOnSameSide(
		result: CapturedResult,
		onResultUpdated?: (result: MRZResult) => void,
	): Promise<void> {
		// Mutex: only one frame processed at a time.
		if (this.isProcessingSameSideFrame) return;

		this.isProcessingSameSideFrame = true;
		let portraitFound = false;

		try {
			// Confidence pre-check: skip the expensive findPortraitZone() call when
			// intermediate results confirm there is no high-confidence portrait zone
			// in this frame (mirrors Android's auxiliary region confidence gate).
			// Placed inside try so the finally block still runs on low-confidence
			// frames, allowing the flip animation to trigger after the first miss.
			if (!hasHighConfidencePortraitZone(this.latestLocalizedTextLines)) return;

			// originalImageData is already updated by handleMRZResult before this call.
			const portraitQuad = await IdentityProcessor.findPortraitZone();
			if (this.isPortraitScanned) return;

			if (portraitQuad && !(portraitQuad as any).errorCode && portraitQuad.points?.length === 4) {
				const documentQuad = getValidDocumentQuad(result);
				const isValid = documentQuad ? validatePortraitLocation(portraitQuad, documentQuad) : true;

				if (isValid && this.originalImageData) {
					portraitFound = true;

					const expandedQuad = expandQuad(portraitQuad, PORTRAIT_MARGINS, this.originalImageData);
					const portraitImage = attachImageHelpers(
						await ImageProcessor.cropAndDeskewImage(this.originalImageData, expandedQuad),
					);

					// Cancel any outstanding flip countdown since portrait was found on same side.
					if (this.flipTimeoutHandle !== null) {
						window.clearTimeout(this.flipTimeoutHandle);
						this.flipTimeoutHandle = null;
					}
					if (this.flipCountdownHandle !== null) {
						window.clearInterval(this.flipCountdownHandle);
						this.flipCountdownHandle = null;
					}

					this.areSidesDifferent = false;
					this.isWaitingForFlip = false;
					this.isPortraitScanned = true;
					this.mrzSideData.portraitImage = portraitImage;

					this.hideScanSpinner();
					this.showGuideSuccessBorder(1000);
					this.showBadge(this.messages.scanSuccess, true, this.messages.portraitScanned, true);

					setTimeout(() => {
						this.closeCamera();

						const mrzResult = new MRZResultImpl({
							status: EnumResultStatus.RS_SUCCESS,
							data: this.mrzSideData.processedData!,
							primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
							primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
							portraitImage,
						});

						onResultUpdated?.(mrzResult);
						this.currentScanResolver?.(mrzResult);
						this.resetScanningState();
					}, 1000);
				}
			}
		} catch (ex) {
			console.warn("tryPortraitOnSameSide error:", ex);
		} finally {
			if (!portraitFound) {
				this.isProcessingSameSideFrame = false;
				this.sameSideMissCount++;

				// Require several consecutive misses before concluding the portrait is
				// on the other side. A single transient low-confidence frame should not
				// trigger the flip animation on single-sided documents.
				if (
					!this.areSidesDifferent &&
					this.sameSideMissCount >= MRZScannerView.SAME_SIDE_MISSES_BEFORE_FLIP
				) {
					this.areSidesDifferent = true;

					void this.switchToFullTemplate();

					const flipTimeout = this.config.flipDocumentTimeout ?? 3000;
					const totalSeconds = Math.ceil(flipTimeout / 1000);
					let remaining = totalSeconds;

					const formatCountdown = (seconds: number) =>
						this.messages.flipDocumentCountdown.replace("{seconds}", String(seconds));

					this.setGuideFrame("portrait");
					this.showFlipAnimation();
					this.showGuideSuccessBorder(1000);
					this.showBadge(this.messages.scanSuccess, true, formatCountdown(remaining), false);

					this.isWaitingForFlip = true;

					this.flipCountdownHandle = window.setInterval(() => {
						remaining--;
						if (remaining > 0) {
							this.showBadge(this.messages.scanSuccess, true, formatCountdown(remaining), false);
						}
					}, 1000) as unknown as number;

					this.flipTimeoutHandle = window.setTimeout(() => {
						window.clearInterval(this.flipCountdownHandle!);
						this.flipCountdownHandle = null;
						this.flipTimeoutHandle = null;
						this.isWaitingForFlip = false;
						this.showBadge(this.messages.scanSuccess, true, this.messages.flipDocument, false);
					}, flipTimeout) as unknown as number;
				}
			}
		}
	}

	private async handlePortraitSideScan(
		result: CapturedResult,
		onResultUpdated?: (result: MRZResult) => void,
	): Promise<void> {
		if (this.isProcessingPortraitFrame) return;

		if (!hasHighConfidencePortraitZone(this.latestLocalizedTextLines)) {
			this.hideScanSpinner();
			return;
		}

		let secondaryDocumentQuad: Quadrilateral | null = null;
		if (this.resources.returnDocumentImage || this.resources.returnPortraitImage) {
			secondaryDocumentQuad = getValidDocumentQuad(result);

			if (secondaryDocumentQuad) {
				this.consecutiveStablePortraitFrames++;
				if (!this.isWaitingForFlip) this.showScanSpinner();
			} else {
				this.consecutiveStablePortraitFrames = 0;
				this.hideScanSpinner();
				if (this.resources.returnDocumentImage) {
					return;
				}
			}

			if (this.consecutiveStablePortraitFrames < MRZScannerView.PORTRAIT_STABLE_FRAMES_REQUIRED) {
				return;
			}
		}

		this.isProcessingPortraitFrame = true;

		let portraitFound = false;

		try {
			const portraitQuad = await IdentityProcessor.findPortraitZone();

			if (
				portraitQuad &&
				!(portraitQuad as any).errorCode &&
				portraitQuad.points?.length === 4 &&
				this.originalImageData
			) {
				portraitFound = true;
				this.isPortraitScanned = true;

				const secondaryOriginalImage: MRZImage | null = this.originalImageData;
				let secondaryDocumentImage: MRZImage | null = null;

				if (this.resources.returnDocumentImage && secondaryDocumentQuad) {
					try {
						const expandedQuad = expandQuad(
							secondaryDocumentQuad,
							CROP_MARGIN_PX,
							this.originalImageData,
						);
						secondaryDocumentImage = attachImageHelpers(
							await ImageProcessor.cropAndDeskewImage(this.originalImageData!, expandedQuad),
						);
					} catch (ex) {
						console.warn("Error extracting secondary document image:", ex);
					}
				}

				let portraitImage: MRZImage | null = null;
				try {
					const expandedQuad = expandQuad(portraitQuad, PORTRAIT_MARGINS, this.originalImageData);
					portraitImage = attachImageHelpers(
						await ImageProcessor.cropAndDeskewImage(this.originalImageData, expandedQuad),
					);
				} catch (ex) {
					console.warn("Error cropping portrait image:", ex);
				}

				this.hideFlipAnimation();
				if (this.isSoundFeedbackOn) Feedback.beep();
				this.hideScanSpinner();
				this.showGuideSuccessBorder(1000);
				this.showBadge(this.messages.scanSuccess, true, this.messages.bothSidesScanned, true);

				setTimeout(() => {
					this.closeCamera();

					const mrzResult = new MRZResultImpl({
						status: EnumResultStatus.RS_SUCCESS,
						data: this.mrzSideData.processedData!,
						primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
						secondaryOriginalImage,
						primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
						secondaryDocumentImage,
						portraitImage: portraitImage || this.mrzSideData.portraitImage,
					});

					onResultUpdated?.(mrzResult);
					this.currentScanResolver?.(mrzResult);
					this.resetScanningState();
				}, 1000);
			}
		} catch (ex) {
			console.error("Error finding portrait on second side:", ex);
		} finally {
			if (!portraitFound) {
				this.isProcessingPortraitFrame = false;
			}
		}
	}

	// ─── Scan spinner (SVG in DCE shadow root) ────────────────────────────────

	private showScanSpinner(): void {
		this.scanSpinnerEl?.classList.add("dce-visible");
	}

	private hideScanSpinner(): void {
		this.scanSpinnerEl?.classList.remove("dce-visible");
	}

	// ─── State reset ──────────────────────────────────────────────────────────

	private resetScanningState(): void {
		this.hideScanSpinner();
		this.hideFlipAnimation();
		this.isMRZScanned = false;
		this.isPortraitScanned = false;
		this.areSidesDifferent = false;
		this.isWaitingForFlip = false;
		this.isProcessingSameSideFrame = false;
		this.isProcessingPortraitFrame = false;
		this.consecutiveStablePortraitFrames = 0;
		this.sameSideMissCount = 0;
		this.latestLocalizedTextLines = null;
		this.hasSwitchedToFullTemplate = false;

		if (this.flipTimeoutHandle !== null) {
			window.clearTimeout(this.flipTimeoutHandle);
			this.flipTimeoutHandle = null;
		}
		if (this.flipCountdownHandle !== null) {
			window.clearInterval(this.flipCountdownHandle);
			this.flipCountdownHandle = null;
		}
		this.clearPortraitSkipTimer();

		this.mrzSideData = {
			processedData: null,
			primaryOriginalImage: null,
			primaryDocumentImage: null,
			portraitImage: null,
		};
	}
}

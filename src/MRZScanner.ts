import {
	LicenseManager,
	_toBlob,
	_toCanvas,
	CoreModule,
	DSImageData,
	EngineResourcePaths,
	CodeParserModule,
	CaptureVisionRouter,
	CameraEnhancer,
	CameraView,
} from "dynamsoft-capture-vision-bundle";
import {
	DEFAULT_TEMPLATE_NAMES,
	EnumMRZScanMode,
	EnumMRZScannerViews,
	EnumResultStatus,
	UtilizedTemplateNames,
	TemplatePair,
	EnumMRZDocumentType,
} from "./views/utils/types";
import { createStyle, getElement, isEmptyObject } from "./views/utils";
import MRZScannerView, { MRZScannerViewConfig } from "./views/MRZScannerView";
import { MRZResult, MRZResultImpl } from "./views/utils/MRZParser";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./views/utils/LoadingScreen";
import { processImageFromCapturedResult } from "./views/utils/ImageProcessingHelper";
import DEFAULT_MRZ_SCANNER_TEMPLATE_PATH from "./dcv-config/mrz-scanner.template.json";
import DEFAULT_DCE_UI_PATH from "./dcv-config/mrz-scanner.ui.xml?raw";

// DCE looks for this class to locate the camera core container; without it,
// it falls back to "dce-video-container" and triggers redundant getUserMedia
// prompts on Firefox Android.
const DCE_CAMERA_CORE_CLASS = "dm-camera-core-container";
const UI_VIEWFINDER_CLASS = "dce-viewfinder-container";

const DEFAULT_DCV_ENGINE_RESOURCE_PATHS = {
	rootDirectory: "https://cdn.jsdelivr.net/npm/",
};

const DEFAULT_CONTAINER_HEIGHT = "100dvh";

export interface MRZScannerConfig {
	license?: string;
	container?: HTMLElement | string;

	// DCV specific configs
	templateFilePath?: string;
	utilizedTemplateNames?: UtilizedTemplateNames;
	engineResourcePaths?: EngineResourcePaths;

	// Views Config
	scannerViewConfig?: Omit<MRZScannerViewConfig, "templateFilePath" | "utilizedTemplateNames">;

	mrzFormatType?: Array<EnumMRZDocumentType>;

	// Image extraction options (all default to false — no performance impact when not opted in)
	returnOriginalImage?: boolean;
	returnDocumentImage?: boolean;
	returnPortraitImage?: boolean;
}

export interface SharedResources {
	cvRouter?: CaptureVisionRouter;
	cameraEnhancer?: CameraEnhancer;
	cameraView?: CameraView;
	result?: MRZResult;
	onResultUpdated?: (result: MRZResult) => void;

	returnOriginalImage?: boolean;
	returnDocumentImage?: boolean;
	returnPortraitImage?: boolean;
}

class MRZScanner {
	private scannerView?: MRZScannerView;

	private resources: Partial<SharedResources> = {};
	private isInitialized = false;
	private isCapturing = false;

	private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

	private isDynamsoftResourcesLoaded = false;

	protected isFileMode: boolean = false;

	private showLoadingOverlay(message?: string) {
		const container = this.config.scannerViewConfig?.container;
		if (!container) throw new Error("Scanner view container not configured");

		const configContainer = getElement(container);
		if (!configContainer) throw new Error("Scanner view container element not found");

		this.loadingScreen = showLoadingScreen(configContainer, { message });
		configContainer.style.display = "block";
		configContainer.style.position = "relative";
	}

	private hideLoadingOverlay(hideContainer: boolean = false) {
		const configContainer = getElement(this.config.scannerViewConfig?.container);
		if (!configContainer) return;

		if (this.loadingScreen) {
			this.loadingScreen.hide();
			this.loadingScreen = null;
			configContainer.style.display = "none";

			if (hideContainer && this.config?.container) {
				getElement(this.config.container)!.style.display = "none";
			}
		}
	}

	constructor(private config: MRZScannerConfig) {
		if (!this.isDynamsoftResourcesLoaded) {
			this.initializeDynamsoftResources();
		}
	}

	/**
	 * Normalizes template names to TemplatePair format.
	 * Accepts either a string (legacy format) or TemplatePair object.
	 * When a string is provided, auto-derives the MRZ-only variant as `${name}-MRZOnly`.
	 */
	private static normalizeTemplateName(value: string | TemplatePair): TemplatePair {
		if (typeof value === "string") {
			return {
				full: value,
				mrzOnly: `${value}-MRZOnly`,
			};
		}
		return value;
	}

	async initialize(): Promise<{
		resources: SharedResources;
		components: {
			scannerView?: MRZScannerView;
		};
	}> {
		if (this.isInitialized) {
			return {
				resources: this.resources as SharedResources,
				components: {
					scannerView: this.scannerView,
				},
			};
		}

		try {
			const mrzScannerConfigSuccess = this.initializeMRZScannerConfig();
			if (!mrzScannerConfigSuccess) {
				console.error("Failed to initialize mrz scanner config");
				return { resources: this.resources, components: {} };
			}

			// Create loading screen style
			createStyle("dynamsoft-mrz-loading-screen-style", DEFAULT_LOADING_SCREEN_STYLE);
			this.showLoadingOverlay("Loading...");

			await this.initializeDCVResources();

			this.resources.onResultUpdated = (result) => {
				this.resources.result = result;
			};

			// Propagate image extraction flags to shared resources
			// returnDocumentImage and returnPortraitImage default to true per API spec
			this.resources.returnOriginalImage = this.config.returnOriginalImage ?? false;
			this.resources.returnDocumentImage = this.config.returnDocumentImage ?? true;
			this.resources.returnPortraitImage = this.config.returnPortraitImage ?? true;

			const components: {
				scannerView?: MRZScannerView;
			} = {};

			// Initialize scanner view for main flow only
			if (!this.isFileMode && this.config.scannerViewConfig) {
				this.scannerView = new MRZScannerView(this.resources, this.config.scannerViewConfig);
				components.scannerView = this.scannerView;
				await this.scannerView.initialize();
			}

			this.isInitialized = true;

			return { resources: this.resources, components };
		} catch (ex: any) {
			this.isInitialized = false;

			let errMsg = ex?.message || ex;
			const error = `Initialization Failed: ${errMsg}`;
			console.error(error);

			throw new Error(error);
		} finally {
			this.hideLoadingOverlay(true);
		}
	}

	private initializeDynamsoftResources() {
		//The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
		CoreModule.engineResourcePaths = (
			isEmptyObject(this.config?.engineResourcePaths)
				? DEFAULT_DCV_ENGINE_RESOURCE_PATHS
				: this.config.engineResourcePaths
		) as EngineResourcePaths;

		// Optional. Used to load wasm resources in advance, reducing latency between video playing and document modules.
		// Can add other specs. Please check https://www.dynamsoft.com/code-parser/docs/core/code-types/mrtd.html
		CoreModule.loadWasm();
		// In v3.4+, all MRTD specs are consolidated into a single "MRTD" spec file
		CodeParserModule.loadSpec("MRTD");

		this.isDynamsoftResourcesLoaded = true;
	}

	private async initializeDCVResources(): Promise<void> {
		try {
			if (!this.isDynamsoftResourcesLoaded) {
				this.initializeDynamsoftResources();
			}

			// Change trial link to include product and deploymenttype
			(LicenseManager as any)._onAuthMessage = (message: string) =>
				message.replace(
					"(https://www.dynamsoft.com/customer/license/trialLicense?product=unknown&deploymenttype=unknown)",
					"(https://www.dynamsoft.com/customer/license/trialLicense?product=mrz&deploymenttype=web)",
				);

			await LicenseManager.initLicense(this.config?.license || "", {
				executeNow: true,
			});

			if (!this.isFileMode) {
				const uiPath = this.config.scannerViewConfig?.cameraEnhancerUIPath;
				let cameraUI: string | undefined = undefined;

				if (uiPath) {
					if (uiPath.trimStart().startsWith("<")) {
						cameraUI = uiPath;
					} else {
						try {
							cameraUI = await fetch(uiPath).then((res) => res.text());
						} catch (ex) {
							console.warn(`Failed to fetch UI from ${uiPath}, using default UI:`, ex);
						}
					}
				}

				// Inject DCE's internal container class so it recognises our viewfinder
				// element without entering the native-like UI processing path.
				if (cameraUI) {
					cameraUI = cameraUI.replace(
						UI_VIEWFINDER_CLASS,
						`${DCE_CAMERA_CORE_CLASS} ${UI_VIEWFINDER_CLASS}`,
					);
				}

				this.resources.cameraEnhancer = await CameraEnhancer.createInstance(cameraUI);
				this.resources.cameraView = this.resources.cameraEnhancer;
			}

			this.resources.cvRouter = await CaptureVisionRouter.createInstance();

			const mrzModels = ["MRZLocalization", "MRZCharRecognition", "MRZTextLineRecognition"];
			await CaptureVisionRouter.appendDLModelBuffer(mrzModels);

			const templatePath = this.config.templateFilePath!;
			const settingsResult = await this.resources.cvRouter.initSettings(templatePath);
			if (settingsResult?.errorCode !== 0) {
				throw new Error(
					`Failed to load template (${settingsResult.errorCode}): ${settingsResult.errorString}`,
				);
			}
		} catch (ex: any) {
			let errMsg =
				typeof ex === "string"
					? ex
					: (ex?.message ?? (typeof ex === "object" ? JSON.stringify(ex) : String(ex)));

			const error = errMsg?.toLowerCase().includes("license")
				? `The MRZ Scanner license is invalid or has expired. Please contact the site administrator to resolve this issue.`
				: `Resource Initialization Failed: ${errMsg}`;

			console.error(error);
			throw new Error(error);
		}
	}

	private shouldCreateDefaultContainer(): boolean {
		const hasNoMainContainer = !this.config.container;
		const hasNoViewContainers = !this.config.scannerViewConfig?.container;
		return hasNoMainContainer && hasNoViewContainers;
	}

	private createDefaultMRZScannerContainer(): HTMLElement {
		const container = document.createElement("div");
		container.className = "mrz-scanner-main-container";
		Object.assign(container.style, {
			height: DEFAULT_CONTAINER_HEIGHT,
			width: "100%",
			/* Adding the following CSS rules to make sure the "default" container appears on top and over other elements. */
			position: "absolute",
			left: "0",
			top: "0",
			zIndex: "999",
		});
		document.body.append(container);
		return container;
	}

	private checkForTemporaryLicense(license?: string) {
		return !license?.length ||
			license?.startsWith("A") ||
			license?.startsWith("L") ||
			license?.startsWith("P") ||
			license?.startsWith("Y")
			? "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9"
			: license;
	}

	private validateViewConfigs(): boolean {
		// Ensure valid container references where provided
		try {
			if (this.config.container && !getElement(this.config.container)) {
				const error = `Invalid main container reference`;
				alert(error);
				console.error(error);
				return false;
			}

			if (
				this.config.scannerViewConfig?.container &&
				!getElement(this.config.scannerViewConfig?.container)
			) {
				const error = `Invalid scanner view container reference`;
				alert(error);
				console.error(error);
				return false;
			}
		} catch (e: unknown) {
			const error = `Error accessing container references: ${e instanceof Error ? e.message : String(e)}`;
			alert(error);
			console.error(error);
			return false;
		}

		return true;
	}

	private initializeMRZScannerConfig(): boolean {
		this.config = this.config ?? {};

		const validViewConfig = this.validateViewConfigs();
		if (!validViewConfig) {
			return false;
		}

		if (this.shouldCreateDefaultContainer()) {
			this.config.container = this.createDefaultMRZScannerContainer();
		} else if (this.config.container) {
			this.config.container = getElement(this.config.container) ?? undefined;
		}
		const viewContainers = this.config.container
			? this.createViewContainers(getElement(this.config.container)!)
			: {};

		const baseConfig = {
			license: this.checkForTemporaryLicense(this.config.license),
			utilizedTemplateNames: Object.fromEntries(
				Object.values(EnumMRZScanMode).map((val) => [
					val,
					MRZScanner.normalizeTemplateName(
						this.config.utilizedTemplateNames?.[val] || DEFAULT_TEMPLATE_NAMES[val],
					),
				]),
			) as Record<EnumMRZScanMode, TemplatePair>,
			templateFilePath: this.config?.templateFilePath || DEFAULT_MRZ_SCANNER_TEMPLATE_PATH,
		};

		// Views Config
		const scannerViewConfig = {
			...this.config.scannerViewConfig,
			container:
				viewContainers[EnumMRZScannerViews.Scanner] ||
				getElement(this.config.scannerViewConfig?.container) ||
				null,
			cameraEnhancerUIPath:
				this.config.scannerViewConfig?.uiPath ||
				this.config.scannerViewConfig?.cameraEnhancerUIPath || // TODO: cameraEnhancerUIPath will be deprecated!
				DEFAULT_DCE_UI_PATH,
			templateFilePath: baseConfig.templateFilePath,
			utilizedTemplateNames: baseConfig.utilizedTemplateNames,
			enableMultiFrameCrossFilter:
				this.config.scannerViewConfig?.enableMultiFrameCrossFilter ?? true,
			mrzFormatType: this.config.mrzFormatType,
		};

		Object.assign(this.config, {
			...baseConfig,
			scannerViewConfig,
		});

		return true;
	}

	private createViewContainers(mainContainer: HTMLElement): Record<string, HTMLElement> {
		mainContainer.textContent = "";

		const views: EnumMRZScannerViews[] = [EnumMRZScannerViews.Scanner];

		return views.reduce(
			(containers, view) => {
				const viewContainer = document.createElement("div");
				viewContainer.className = `mrz-scanner-${view}-view-container`;

				Object.assign(viewContainer.style, {
					height: "100%",
					width: "100%",
					display: "none",
					position: "relative",
				});

				mainContainer.append(viewContainer);
				containers[view] = viewContainer;
				return containers;
			},
			{} as Record<string, HTMLElement>,
		);
	}

	dispose(): void {
		this.scannerView = undefined;

		// Dispose resources
		if (this.resources.cameraEnhancer) {
			this.resources.cameraEnhancer.dispose();
			this.resources.cameraEnhancer = undefined;
			this.resources.cameraView = undefined;
		}

		if (this.resources.cvRouter) {
			this.resources.cvRouter.dispose();
			this.resources.cvRouter = undefined;
		}

		this.resources.result = undefined;
		this.resources.onResultUpdated = undefined;

		// Hide and clean containers
		const cleanContainer = (container?: HTMLElement | string) => {
			const element = getElement(container);
			if (element) {
				element.style.display = "none";
				element.textContent = "";
			}
		};

		cleanContainer(this.config.container);
		cleanContainer(this.config.scannerViewConfig?.container);

		this.isInitialized = false;
	}

	/**
	 * Processes a static image source (Blob, URL, DSImageData, or HTML element).
	 * String inputs are fetched as URLs; all other types are forwarded to capture() as-is.
	 */
	private async processImageSource(
		imageSource:
			| Blob
			| string
			| DSImageData
			| HTMLImageElement
			| HTMLVideoElement
			| HTMLCanvasElement,
	): Promise<MRZResult> {
		try {
			this.showLoadingOverlay("Processing image...");

			const cvRouter = this.resources.cvRouter;
			if (!cvRouter) throw new Error("CaptureVisionRouter not initialized");

			// A string input is treated as a URL (http(s):, blob:, data:, or relative).
			// fetch().blob() does not decode the image — it only wraps the response bytes,
			// so the JPEG/PNG decode still happens exactly once inside capture().
			let captureInput:
				| Blob
				| DSImageData
				| HTMLImageElement
				| HTMLVideoElement
				| HTMLCanvasElement;
			if (typeof imageSource === "string") {
				const response = await fetch(imageSource);
				if (!response.ok)
					throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
				captureInput = await response.blob();
			} else {
				captureInput = imageSource;
			}

			// After initializeMRZScannerConfig(), utilizedTemplateNames is normalized to TemplatePair
			const normalizedTemplates = this.config.utilizedTemplateNames as Record<
				EnumMRZScanMode,
				TemplatePair
			>;
			const currentTemplate = normalizedTemplates.all.full;

			const capturedResult = await cvRouter.capture(captureInput, currentTemplate);

			const result = await processImageFromCapturedResult(capturedResult, {
				returnDocumentImage: this.resources.returnDocumentImage,
				returnPortraitImage: this.resources.returnPortraitImage,
			});

			const mrzResult = new MRZResultImpl({
				status: EnumResultStatus.RS_SUCCESS,
				data: result.processedData,
				primaryOriginalImage: result.imageData,
				primaryDocumentImage: result.primaryDocumentImage,
				portraitImage: result.portraitImage,
			});
			// Emit result through shared resources
			this.resources.onResultUpdated?.(mrzResult);
			return mrzResult;
		} catch (error) {
			console.error("Failed to process image source:", error);
			return new MRZResultImpl({ status: EnumResultStatus.RS_FAILED });
		} finally {
			this.hideLoadingOverlay(false);
		}
	}

	async launch(
		imageSource?:
			| Blob
			| string
			| DSImageData
			| HTMLImageElement
			| HTMLVideoElement
			| HTMLCanvasElement,
	): Promise<MRZResult> {
		if (this.isCapturing) {
			throw new Error("Capture session already in progress");
		}

		try {
			this.isCapturing = true;

			// A static image source short-circuits the camera/scanner flow.
			this.isFileMode = !!imageSource;

			const { components } = await this.initialize();
			if (this.config.container) {
				getElement(this.config.container)!.style.display = "block";
			}

			if (this.isFileMode) {
				await this.processImageSource(imageSource!);
				return this.resources.result!;
			}

			// Use existing result if available
			if (!components.scannerView && this.resources.result) {
				return this.resources.result;
			}

			// Scanner view is required for main flow without existing result
			if (!components.scannerView) {
				throw new Error("Scanner view is required when no previous result exists");
			}

			// Execute scanner view
			const scanResult = await components.scannerView.launch();

			if (scanResult?.status !== EnumResultStatus.RS_SUCCESS) {
				return new MRZResultImpl({ status: scanResult?.status ?? EnumResultStatus.RS_FAILED });
			}

			return this.resources.result!;
		} catch (error: unknown) {
			const errMsg = error instanceof Error ? error.message : String(error);
			alert(errMsg);
			console.error(errMsg);
			return new MRZResultImpl({ status: EnumResultStatus.RS_FAILED });
		} finally {
			this.isCapturing = false;
			this.dispose();
		}
	}
}

export default MRZScanner;

// Export UI customization types
export type {
	ToolbarButtonConfig,
	ToolbarButtonsConfig,
	FormatSelectorConfig,
	MessagesConfig,
	ThemeConfig,
} from "./views/MRZScannerView";

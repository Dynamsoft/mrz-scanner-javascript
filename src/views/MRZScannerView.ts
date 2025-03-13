import { EnumCapturedResultItemType, EnumImagePixelFormat, OriginalImageResultItem } from "dynamsoft-core";
import { CapturedResultReceiver, CapturedResult } from "dynamsoft-capture-vision-router";
import { SharedResources } from "../MRZScanner";
import { EnumResultStatus, UtilizedTemplateNames, EnumMRZScanMode, EnumMRZDocumentType } from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./utils/LoadingScreen";
import { createStyle, findClosestResolutionLevel, getElement } from "./utils";
import { MRZData, MRZResult, processMRZData } from "./utils/MRZParser";
import { ParsedResultItem } from "dynamsoft-code-parser";
import { Feedback } from "dynamsoft-camera-enhancer";
import { MultiFrameResultCrossFilter } from "dynamsoft-utility";

enum _DEMO_VIRTUAL_CAMERA_LIST {
  VIRTUAL_PASSPORT = "virtual1",
  VIRTUAL_TD1 = "virtual2",
  VIRTUAL_TD2 = "virtual3",
  PHYSICAL_CAMERA = "camera",
}

export type _DEMO_CameraType = _DEMO_VIRTUAL_CAMERA_LIST;

export type _DEMO_OnlyVirtualCameraType =
  | _DEMO_VIRTUAL_CAMERA_LIST.VIRTUAL_PASSPORT
  | _DEMO_VIRTUAL_CAMERA_LIST.VIRTUAL_TD1
  | _DEMO_VIRTUAL_CAMERA_LIST.VIRTUAL_TD2;

const _DEMO_VIRTUAL_CAMERA_LIST_LABEL: Record<_DEMO_OnlyVirtualCameraType, string> = {
  [_DEMO_VIRTUAL_CAMERA_LIST.VIRTUAL_TD2]: "Virtual Camera 3: ID (TD2)",
  [_DEMO_VIRTUAL_CAMERA_LIST.VIRTUAL_TD1]: "Virtual Camera 2: ID (TD1)",
  [_DEMO_VIRTUAL_CAMERA_LIST.VIRTUAL_PASSPORT]: "Virtual Camera 1: Passport",
};

export interface MRZScannerViewConfig {
  cameraEnhancerUIPath?: string;
  container?: HTMLElement | string;
  templateFilePath?: string;
  utilizedTemplateNames?: UtilizedTemplateNames;
  mrzFormatType?: EnumMRZDocumentType | Array<EnumMRZDocumentType>;

  // Customize Scanner
  showScanGuide?: boolean;
  showUploadImage?: boolean;
  showFormatSelector?: boolean;
  showSoundToggle?: boolean;

  enableMultiFrameCrossFilter?: boolean; // true by default
}

const MRZScanGuideRatios: Record<EnumMRZDocumentType, { width: number; height: number }> = {
  [EnumMRZDocumentType.TD1]: { width: 85.6, height: 53.98 },
  [EnumMRZDocumentType.TD2]: { width: 105, height: 74 },
  [EnumMRZDocumentType.Passport]: { width: 125, height: 88 },
};

interface DCEElements {
  selectCameraBtn: HTMLElement | null;
  uploadImageBtn: HTMLElement | null;
  soundFeedbackBtn: HTMLElement | null;
  closeScannerBtn: HTMLElement | null;
  scanModeSelectContainer: HTMLElement | null;
  passportModeOption: HTMLElement | null;
  td1ModeOption: HTMLElement | null;
  td2ModeOption: HTMLElement | null;
  toast: HTMLElement | null;
}

// Implementation
export default class MRZScannerView {
  // DEMO
  private demoScanningMode: _DEMO_CameraType = _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA;
  private demoScanningResolution = "1080p";

  private isSoundFeedbackOn: boolean = false;

  private scanModeManager: Record<EnumMRZDocumentType, boolean> = {
    [EnumMRZDocumentType.Passport]: true,
    [EnumMRZDocumentType.TD1]: true,
    [EnumMRZDocumentType.TD2]: true,
  };
  private currentScanMode: EnumMRZScanMode = EnumMRZScanMode.All;

  private resizeTimer: number | null = null;

  private capturedResultItems: CapturedResult["items"] = [];
  private originalImageData: OriginalImageResultItem["imageData"] | null = null;

  private initialized: boolean = false;
  private initializedDCE: boolean = false;

  // Elements
  private DCE_ELEMENTS: DCEElements = {
    selectCameraBtn: null,
    uploadImageBtn: null,
    soundFeedbackBtn: null,
    closeScannerBtn: null,
    scanModeSelectContainer: null,
    passportModeOption: null,
    td1ModeOption: null,
    td2ModeOption: null,
    toast: null,
  };

  // Scan Resolve
  private currentScanResolver?: (result: MRZResult) => void;

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

  private showScannerLoadingOverlay(message?: string) {
    const configContainer = getElement(this.config.container);
    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    if (this.loadingScreen) {
      this.loadingScreen.hide();
      this.loadingScreen = null;

      if (hideContainer) {
        getElement(this.config.container).style.display = "none";
      }
    }
  }

  private handleResize = () => {
    // Hide all guides first
    this.toggleScanGuide(false);

    // Clear existing timer
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
    }

    // Set new timer
    this.resizeTimer = window.setTimeout(() => {
      // Re-show guides and update scan region
      this.toggleScanGuide(true);
    }, 500);
  };

  constructor(private resources: SharedResources, private config: MRZScannerViewConfig) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initializeScanModeManager();
    this.currentScanMode = this.getScanMode();

    // Create loading screen style
    createStyle("dynamsoft-mrz-loading-screen-style", DEFAULT_LOADING_SCREEN_STYLE);

    try {
      const { cameraView, cameraEnhancer, cvRouter } = this.resources;

      // Set up cameraView styling
      cameraView.setScanRegionMaskStyle({
        strokeStyle: "transparent",
        fillStyle: "transparent",
        lineWidth: 0,
      });
      cameraView.setVideoFit("cover");

      // Set cameraEnhancer as input for CaptureVisionRouter
      cvRouter.setInput(cameraEnhancer);

      // Initialize the template parameters for mrz scanning
      await cvRouter.initSettings(this.config.templateFilePath);

      if (this.config.enableMultiFrameCrossFilter === true) {
        const filter = new MultiFrameResultCrossFilter();
        filter.enableResultCrossVerification(EnumCapturedResultItemType.CRIT_TEXT_LINE, true);
        filter.enableResultDeduplication(EnumCapturedResultItemType.CRIT_TEXT_LINE, true);
        await cvRouter.addResultFilter(filter);
      }

      const resultReceiver = new CapturedResultReceiver();
      resultReceiver.onCapturedResultReceived = (result) => this.handleMRZResult(result);
      await cvRouter.addResultReceiver(resultReceiver);

      // Set default value for sound feedback
      this.toggleSoundFeedback(false);

      // Set defaults from config TODO not needed?
      if (this.config.showScanGuide === false) {
        this.toggleScanGuide(false);
      }

      this.initialized = true;
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "Dynamsoft MRZ Scanner initialize error",
        },
      };
      this.currentScanResolver(result);
    }
  }

  private initializeElements() {
    const configContainer = getElement(this.config.container);

    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) {
      throw new Error("Shadow root not found");
    }

    this.DCE_ELEMENTS = {
      selectCameraBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-select-camera-icon"),
      uploadImageBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-upload-image-icon"),
      soundFeedbackBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-sound-feedback"),
      closeScannerBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-close"),
      scanModeSelectContainer: DCEContainer.shadowRoot.querySelector(".dce-mn-scan-mode-select"),
      passportModeOption: DCEContainer.shadowRoot.querySelector(".scan-mode-option-passport"),
      td1ModeOption: DCEContainer.shadowRoot.querySelector(".scan-mode-option-td1"),
      td2ModeOption: DCEContainer.shadowRoot.querySelector(".scan-mode-option-td2"),
      toast: DCEContainer.shadowRoot.querySelector(".dce-mn-toast"),
    };

    this.setupScanModeSelector();
    this.assignDCEClickEvents();

    // Hide toast
    this.DCE_ELEMENTS.toast.style.display = "none";

    // Hide configs

    if (this.config.showUploadImage === false) {
      this.DCE_ELEMENTS.uploadImageBtn.style.display = "none";
    }

    if (this.config.showSoundToggle === false) {
      this.DCE_ELEMENTS.soundFeedbackBtn.style.display = "none";
    }

    this.initializedDCE = true;
  }

  private setupScanModeSelector() {
    if (this.config.showFormatSelector === false) {
      this.DCE_ELEMENTS.scanModeSelectContainer.style.display = "none";
      return;
    }

    switch (this.currentScanMode) {
      case EnumMRZScanMode.PassportAndTD1:
        this.DCE_ELEMENTS.td2ModeOption.style.display = "none";
        break;
      case EnumMRZScanMode.PassportAndTD2:
        this.DCE_ELEMENTS.td1ModeOption.style.display = "none";
        break;
      case EnumMRZScanMode.TD1AndTD2:
        this.DCE_ELEMENTS.passportModeOption.style.display = "none";
        break;
      case EnumMRZScanMode.All:
        break;
      default:
        this.DCE_ELEMENTS.scanModeSelectContainer.style.display = "none";
        break;
    }
  }

  private assignDCEClickEvents() {
    if (!Object.values(this.DCE_ELEMENTS).every(Boolean)) {
      throw new Error("Camera control elements not found");
    }

    this.closeCamera = this.closeCamera.bind(this);

    this.DCE_ELEMENTS.uploadImageBtn.onclick = () => this.uploadImage();
    this.DCE_ELEMENTS.soundFeedbackBtn.onclick = () => this.toggleSoundFeedback();
    this.DCE_ELEMENTS.closeScannerBtn.onclick = () => this.handleCloseBtn();

    this.DCE_ELEMENTS.selectCameraBtn.onclick = (event) => {
      event.stopPropagation();
      this.toggleSelectCameraBox();
    };

    // Select mode
    this.DCE_ELEMENTS.passportModeOption.onclick = async () => {
      if (this.DCE_ELEMENTS.passportModeOption.style.display !== "none") {
        await this.toggleScanDocType(EnumMRZDocumentType.Passport);
      }
    };

    this.DCE_ELEMENTS.td1ModeOption.onclick = async () => {
      if (this.DCE_ELEMENTS.td1ModeOption.style.display !== "none") {
        await this.toggleScanDocType(EnumMRZDocumentType.TD1);
      }
    };

    this.DCE_ELEMENTS.td2ModeOption.onclick = async () => {
      if (this.DCE_ELEMENTS.td2ModeOption.style.display !== "none") {
        await this.toggleScanDocType(EnumMRZDocumentType.TD2);
      }
    };
  }

  private handleCloseBtn() {
    this.closeCamera();

    if (this.currentScanResolver) {
      this.currentScanResolver({
        status: {
          code: EnumResultStatus.RS_CANCELLED,
          message: "Cancelled",
        },
      });
    }
  }

  private attachOptionClickListeners() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;

    const settingsContainer = DCEContainer.shadowRoot.querySelector(
      ".dce-mn-camera-and-resolution-settings"
    ) as HTMLElement;

    const cameraOptions = DCEContainer.shadowRoot.querySelectorAll(".dce-mn-camera-option");
    const resolutionOptions = DCEContainer.shadowRoot.querySelectorAll(".dce-mn-resolution-option");

    // Add click handlers to all options
    [...cameraOptions, ...resolutionOptions].forEach((option) => {
      option.addEventListener("click", async (e) => {
        if (settingsContainer.style.display !== "none") {
          this.toggleSelectCameraBox();

          if (
            !this._demo_IsFirefoxAndroid &&
            Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).includes(this.demoScanningMode)
          ) {
            if (option.getAttribute("data-davice-id")) {
              // Handle device selection
              if (!Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).includes(option.getAttribute("data-davice-id"))) {
                this._demo_saveSelectedCamera(option.getAttribute("data-davice-id"));

                this._demo_playVideoWithRes(
                  "stop",
                  _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA,
                  option.getAttribute("data-davice-id") as _DEMO_VIRTUAL_CAMERA_LIST
                );
                this.demoScanningMode = _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA;
              }
            } else if (option.getAttribute("data-height")) {
              // Handle resolution selection
              const height = option.getAttribute("data-height");

              // Map height to correct resolution string
              let resolution: "480p" | "720p" | "1080p" | "2k" | "4k";
              switch (height) {
                case "2160":
                  resolution = "4k";
                  break;
                case "1440":
                  resolution = "2k";
                  break;
                case "1080":
                  resolution = "1080p";
                  break;
                case "720":
                  resolution = "720p";
                  break;
                case "480":
                  resolution = "480p";
                  break;
                default:
                  return; // Invalid resolution
              }

              this._demo_playVideoWithRes(resolution, this.demoScanningMode);
              this.demoScanningResolution = resolution;
            }
          }
        }
      });
    });
    this._demo_AttachFakeEventsToCameras();
  }

  private _demo_AttachFakeEventsToCameras() {
    if (this._demo_IsFirefoxAndroid) {
      return; // Don't attach demo events for Firefox Android
    }

    const configContainer = getElement(this.config.container);

    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const cameraOptionsContainer = DCEContainer.shadowRoot.querySelector(".dce-mn-cameras");
    if (!cameraOptionsContainer) return;

    // Check if demo cameras already exist
    Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).forEach((cam) => {
      const demoCamera = cameraOptionsContainer.querySelector(`[data-davice-id="${cam}"]`) as HTMLElement;

      demoCamera.onclick = async (e) => {
        e.stopPropagation();
        this._demo_playVideoWithRes("1080p", cam as _DEMO_CameraType);
        this.demoScanningMode = cam as _DEMO_CameraType;

        this._demo_saveSelectedCamera(cam);
      };
    });
  }

  private _demo_CheckForFakeCamera(id: string) {
    return Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).some((cam) => {
      return id === cam && this.demoScanningMode === cam;
    });
  }

  private highlightCameraAndResolutionOption() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;

    const settingsContainer = DCEContainer.shadowRoot.querySelector(
      ".dce-mn-camera-and-resolution-settings"
    ) as HTMLElement;
    const cameraOptions = settingsContainer.querySelectorAll(".dce-mn-camera-option");
    const resOptions = settingsContainer.querySelectorAll(".dce-mn-resolution-option");

    const selectedCamera = this.resources.cameraEnhancer.getSelectedCamera();
    const selectedResolution = this.resources.cameraEnhancer.getResolution();

    cameraOptions.forEach((options) => {
      const o = options as HTMLElement;
      const deviceId = o.getAttribute("data-davice-id");

      if (
        this._demo_CheckForFakeCamera(deviceId) ||
        (this.demoScanningMode === _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA && deviceId === selectedCamera?.deviceId)
      ) {
        o.style.border = "2px solid #fe814a";
        this._demo_saveSelectedCamera(deviceId);
      } else {
        o.style.border = "none";
      }
    });

    const heightMap: Record<string, string> = {
      "480p": "480",
      "720p": "720",
      "1080p": "1080",
      "2k": "1440",
      "4k": "2160",
    };

    const resolutionLvl = findClosestResolutionLevel(selectedResolution);

    resOptions.forEach((options) => {
      const o = options as HTMLElement;
      const height = o.getAttribute("data-height");

      if (this.demoScanningMode !== _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA) {
        if (height === heightMap[this.demoScanningResolution]) {
          o.style.border = "2px solid #fe814a";
        } else {
          o.style.border = "none";
        }
      } else {
        if (height === heightMap[resolutionLvl]) {
          o.style.border = "2px solid #fe814a";
        } else {
          o.style.border = "none";
        }
      }
    });
  }

  private toggleSelectCameraBox() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const settingsBox = DCEContainer.shadowRoot.querySelector(".dce-mn-resolution-box") as HTMLElement;

    // DEMO purpose - add camera
    this._demo_AddFakeCameras();

    // Highlight current camera and resolution
    this.highlightCameraAndResolutionOption();

    // Attach highlighting camera and resolution options on option click
    this.attachOptionClickListeners();

    settingsBox.click();
  }

  private get _demo_IsFirefoxAndroid(): boolean {
    return (
      navigator.userAgent.toLowerCase().includes("firefox") && navigator.userAgent.toLowerCase().includes("android")
    );
  }

  private _demo_saveSelectedCamera(deviceId: string) {
    try {
      localStorage.setItem("dds-demo-save-selected-item", deviceId);
    } catch (error) {
      console.warn("Failed to save camera preference:", error);
    }
  }

  private _demo_AddFakeCameras() {
    if (this._demo_IsFirefoxAndroid) {
      return; // Don't add demo cameras for Firefox Android
    }

    const configContainer = getElement(this.config.container);

    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const cameraOptionsContainer = DCEContainer.shadowRoot.querySelector(".dce-mn-cameras");
    if (!cameraOptionsContainer) return;

    Object.entries(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).forEach(([key, label]) => {
      const existingDemoCam = cameraOptionsContainer.querySelector(`[data-davice-id="${key}"]`);
      if (!existingDemoCam) {
        const demoCam = document.createElement("div");
        demoCam.className = "dce-mn-camera-option";
        demoCam.setAttribute("data-davice-id", key);
        demoCam.innerText = label;
        cameraOptionsContainer.prepend(demoCam);
      }
    });
  }

  private async uploadImage() {
    const { cvRouter } = this.resources;

    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    try {
      this.showScannerLoadingOverlay("Processing image...");
      await this.closeCamera(false);

      // Get file from input
      const file = await new Promise<File>((resolve, reject) => {
        input.onchange = (e: Event) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (!f?.type.startsWith("image/")) {
            reject(new Error("Please select an image file"));
            return;
          }
          resolve(f);
        };

        input.addEventListener("cancel", async () => {
          this.hideScannerLoadingOverlay(false);
          await this.launch(this.demoScanningMode);
        });

        input.click();
      });

      if (!file) {
        this.hideScannerLoadingOverlay(false);
        await this.launch(this.demoScanningMode);

        return;
      }

      // Convert file to blob
      const currentTemplate = this.config.utilizedTemplateNames[this.currentScanMode];

      if (this.config.showScanGuide !== false) {
        // Update ROI if scanGuide can be shown
        const newSettings = await cvRouter.getSimplifiedSettings(currentTemplate);
        newSettings.roiMeasuredInPercentage = true;
        newSettings.roi.points = [
          {
            x: 0,
            y: 0,
          },
          {
            x: 100,
            y: 0,
          },
          {
            x: 100,
            y: 100,
          },
          {
            x: 0,
            y: 100,
          },
        ];
        await cvRouter.updateSettings(currentTemplate, newSettings);
      }

      const capturedResult = await cvRouter.capture(file, currentTemplate);
      this.capturedResultItems = capturedResult.items;
      const originalImage = this.capturedResultItems.filter(
        (item) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE
      ) as OriginalImageResultItem[];

      const imageData = originalImage[0].imageData;
      (imageData as any).toCanvas = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Create ImageData from the bytes
        const imgData = new ImageData(new Uint8ClampedArray(imageData.bytes.buffer), imageData.width, imageData.height);
        ctx.putImageData(imgData, 0, 0);

        return canvas;
      };
      this.originalImageData = imageData;

      const textLineResultItems = capturedResult?.textLineResultItems;
      const parsedResultItems = capturedResult?.parsedResultItems;

      let processedData = {} as MRZData;

      if (textLineResultItems?.length) {
        const mrzText = textLineResultItems[0]?.text || "";
        const parsedResult = parsedResultItems[0] as ParsedResultItem;

        processedData = processMRZData(mrzText, parsedResult);
      }

      const mrzResult = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: this.originalImageData,
        _imageData: this.originalImageData,
        data: processedData,
      };
      // Emit result through shared resources
      this.resources.onResultUpdated?.(mrzResult);

      // Resolve scan promise
      this.currentScanResolver(mrzResult);

      // Done processing
      this.hideScannerLoadingOverlay(true);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();

      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "Error processing uploaded image",
        },
      };
      this.currentScanResolver(result);
    } finally {
      document.body.removeChild(input);
    }
  }

  private toggleSoundFeedback(enabled?: boolean) {
    this.isSoundFeedbackOn = enabled !== undefined ? enabled : !this.isSoundFeedbackOn;

    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;

    const soundFeedbackContainer = DCEContainer.shadowRoot.querySelector(".dce-mn-sound-feedback") as HTMLElement;

    const onIcon = soundFeedbackContainer.querySelector(".dce-mn-sound-feedback-on") as HTMLElement;
    const offIcon = soundFeedbackContainer.querySelector(".dce-mn-sound-feedback-off") as HTMLElement;

    offIcon.style.display = this.isSoundFeedbackOn ? "none" : "block";
    onIcon.style.display = this.isSoundFeedbackOn ? "block" : "none";
  }

  private calculateScanRegion(documentType: EnumMRZDocumentType) {
    const { cameraEnhancer, cameraView } = this.resources;

    if (!cameraEnhancer || !cameraEnhancer.isOpen()) return;

    // Get visible region of video
    const visibleRegion = cameraView.getVisibleRegionOfVideo({ inPixels: true });

    if (!visibleRegion) return;

    // Get the total video dimensions
    const video = cameraView.getVideoElement();
    const totalWidth = video.videoWidth;
    const totalHeight = video.videoHeight;

    // Get the document ratio for the specific document type
    const targetRatio = MRZScanGuideRatios[documentType];

    // Calculate the base unit to scale the document dimensions
    let baseUnit: number;

    // Calculate bottom margin of 5rem in pixels (assuming 16px per rem)
    const bottomMarginPx = 5 * 16;
    const effectiveHeightWithMargin = visibleRegion.height - bottomMarginPx;

    if (visibleRegion.width > visibleRegion.height) {
      // Landscape orientation
      const availableHeight = effectiveHeightWithMargin * 0.75;
      baseUnit = availableHeight / targetRatio.height;

      // Check if width would exceed bounds
      const resultingWidth = baseUnit * targetRatio.width;
      if (resultingWidth > visibleRegion.width * 0.9) {
        // If too wide, recalculate using width as reference
        baseUnit = (visibleRegion.width * 0.9) / targetRatio.width;
      }
    } else {
      // Portrait orientation
      const availableWidth = visibleRegion.width * 0.9;
      baseUnit = availableWidth / targetRatio.width;

      // Check if height would exceed bounds
      const resultingHeight = baseUnit * targetRatio.height;
      if (resultingHeight > effectiveHeightWithMargin * 0.75) {
        // If too tall, recalculate using height as reference
        baseUnit = (effectiveHeightWithMargin * 0.75) / targetRatio.height;
      }
    }

    // Calculate actual dimensions in pixels
    const actualWidth = baseUnit * targetRatio.width;
    const actualHeight = baseUnit * targetRatio.height;

    // Calculate the offsets to center the region horizontally and vertically
    const leftOffset = (visibleRegion.width - actualWidth) / 2;
    const topOffset = (effectiveHeightWithMargin - actualHeight) / 2;

    // Calculate pixel coordinates of the scan region relative to the visible region
    const scanLeft = leftOffset;
    const scanRight = leftOffset + actualWidth;
    const scanTop = topOffset;
    const scanBottom = topOffset + actualHeight;

    // Convert to percentages relative to the TOTAL video size, considering the visible region offset
    const absoluteLeft = visibleRegion.x + scanLeft;
    const absoluteRight = visibleRegion.x + scanRight;
    const absoluteTop = visibleRegion.y + scanTop;
    const absoluteBottom = visibleRegion.y + scanBottom;

    const left = (absoluteLeft / totalWidth) * 100;
    const right = (absoluteRight / totalWidth) * 100;
    const top = (absoluteTop / totalHeight) * 100;
    const bottom = (absoluteBottom / totalHeight) * 100;

    // Apply scan region
    const region = {
      left: Math.round(left),
      right: Math.round(right),
      top: Math.round(top),
      bottom: Math.round(bottom),
      isMeasuredInPercentage: true,
    };

    cameraView?.setScanRegionMaskVisible(true);
    cameraEnhancer.setScanRegion(region);
  }

  private toggleScanGuide(enabled?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;
    const passportGuide = DCEContainer.shadowRoot.querySelector(".dce-scanguide-passport") as HTMLElement;
    const td1Guide = DCEContainer.shadowRoot.querySelector(".dce-scanguide-td1") as HTMLElement;
    const td2Guide = DCEContainer.shadowRoot.querySelector(".dce-scanguide-td2") as HTMLElement;

    if (enabled === false || this.config.showScanGuide === false) {
      passportGuide.style.display = "none";
      td1Guide.style.display = "none";
      td2Guide.style.display = "none";
      return;
    }

    switch (this.currentScanMode) {
      case EnumMRZScanMode.All:
      case EnumMRZScanMode.Passport:
      case EnumMRZScanMode.PassportAndTD1:
      case EnumMRZScanMode.PassportAndTD2:
        passportGuide.style.display = "block";
        td1Guide.style.display = "none";
        td2Guide.style.display = "none";

        this.calculateScanRegion(EnumMRZDocumentType.Passport);
        break;

      case EnumMRZScanMode.TD1:
      case EnumMRZScanMode.TD1AndTD2:
        passportGuide.style.display = "none";
        td1Guide.style.display = "block";
        td2Guide.style.display = "none";

        this.calculateScanRegion(EnumMRZDocumentType.TD1);
        break;

      case EnumMRZScanMode.TD2:
        passportGuide.style.display = "none";
        td1Guide.style.display = "none";
        td2Guide.style.display = "block";

        this.calculateScanRegion(EnumMRZDocumentType.TD2);
        break;

      default:
      // TODO show error
    }
  }

  async openCamera(_demo_cameraType: _DEMO_CameraType = _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA): Promise<void> {
    try {
      this.showScannerLoadingOverlay("Initializing camera...");

      const { cameraEnhancer, cameraView } = this.resources;

      const configContainer = getElement(this.config.container);
      configContainer.style.display = "block";

      // If it's the first scan, automatically start with demo video
      // Stop  videoSrc if its on firefox
      if (!this._demo_IsFirefoxAndroid && Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).includes(_demo_cameraType)) {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          configContainer.append(currentCameraView);
        }

        await cameraEnhancer.open();
        await this._demo_playVideoWithRes(this.demoScanningResolution as any, _demo_cameraType, null, true);
      } else if (cameraEnhancer.isOpen()) {
        if (cameraEnhancer.isPaused()) {
          await cameraEnhancer.resume();
        }
      } else {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          getElement(this.config.container).append(currentCameraView);
        }
        await cameraEnhancer.open();
      }
      this.toggleScanGuide();

      this.demoScanningMode = this._demo_IsFirefoxAndroid
        ? _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA
        : _demo_cameraType;

      // Assign element
      if (
        (!this.initializedDCE && cameraEnhancer.isOpen()) ||
        (!this._demo_IsFirefoxAndroid && Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).includes(_demo_cameraType))
      ) {
        await this.initializeElements();
      }

      // if not demo, click btn to switch cam
      this._demo_saveSelectedCamera(_demo_cameraType);
      if (!(!this._demo_IsFirefoxAndroid && Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).includes(_demo_cameraType))) {
        this.demoScanningMode = _DEMO_VIRTUAL_CAMERA_LIST.PHYSICAL_CAMERA;

        const DCEContainer = configContainer.children[configContainer.children.length - 1];

        const cameraOptions = DCEContainer.shadowRoot.querySelectorAll(".dce-mn-camera-option");
        cameraOptions.forEach((el) => {
          if (el.getAttribute("data-davice-id") === _demo_cameraType) {
            (el as HTMLElement).click();
          }
        });
      }

      // Add resize
      window.addEventListener("resize", this.handleResize);

      // Turn on torch auto by default
      const DCEContainer = configContainer.children[configContainer.children.length - 1];
      if (!DCEContainer?.shadowRoot) {
        throw new Error("Shadow root not found");
      }
      (DCEContainer.shadowRoot.querySelector(".dce-mn-torch-off") as HTMLElement).style.display = "none";
      (DCEContainer.shadowRoot.querySelector(".dce-mn-torch-on") as HTMLElement).style.display = "none";
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "MRZ Scanner Open Camera Error",
        },
      };
      this.currentScanResolver(result);
    } finally {
      this.hideScannerLoadingOverlay();
    }
  }

  private async _demo_playVideoWithRes(
    resolution: "480p" | "720p" | "1080p" | "2k" | "4k" | "stop",
    demoType?: _DEMO_CameraType,
    deviceId?: string,
    fromOpenCamera?: boolean // flag to check if it's coming from main demo page
  ) {
    if (this._demo_IsFirefoxAndroid) return;

    const { cameraEnhancer } = this.resources;

    if (!fromOpenCamera) {
      this.showScannerLoadingOverlay(
        `Opening ${_DEMO_VIRTUAL_CAMERA_LIST_LABEL?.[demoType as _DEMO_OnlyVirtualCameraType] || "Camera"}`
      );
    }

    cameraEnhancer.close();
    cameraEnhancer.getVideoEl().setAttribute("crossOrigin", "anonymous");

    if (resolution !== "stop") {
      const baseUrl = "https://tst.dynamsoft.com/temp/mrz-scanner/demo-video/";
      const demoPath = `${demoType}/`;
      cameraEnhancer.videoSrc = `${baseUrl}${demoPath}${resolution}-dynamsoft-sample-vid.mp4`;

      this._demo_saveSelectedCamera(demoType);
    } else {
      cameraEnhancer.videoSrc = "";
      cameraEnhancer.selectCamera(deviceId);
      this._demo_saveSelectedCamera(deviceId);
    }

    cameraEnhancer.open().then(() => this.toggleScanGuide());

    this.hideScannerLoadingOverlay(false);
  }

  async closeCamera(hideContainer: boolean = true) {
    try {
      // Remove resize event listener
      window.removeEventListener("resize", this.handleResize);
      // Clear any existing resize timer
      if (this.resizeTimer) {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = null;
      }

      const { cameraEnhancer, cameraView } = this.resources;

      const configContainer = getElement(this.config.container);
      configContainer.style.display = hideContainer ? "none" : "block";

      if (cameraView?.getUIElement().parentElement) {
        configContainer.removeChild(cameraView.getUIElement());
      }

      cameraEnhancer.close();
      this.stopCapturing();
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(`Close Camera error: ${errMsg}`);
    }
  }

  pauseCamera() {
    const { cameraEnhancer } = this.resources;
    cameraEnhancer.pause();
  }

  stopCapturing() {
    const { cameraView, cvRouter } = this.resources;

    cvRouter.stopCapturing();
    cameraView.clearAllInnerDrawingItems();
  }

  async handleMRZResult(result: CapturedResult) {
    this.capturedResultItems = result.items;

    // If only original image is returned in result.items (i.e. no text line or parsed result items), skip processing result
    if (result.items.length <= 1) {
      return;
    }

    try {
      const { onResultUpdated } = this.resources;

      const originalImage = result.items.filter(
        (item) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE
      ) as OriginalImageResultItem[];
      this.originalImageData = originalImage.length && originalImage[0].imageData;

      const textLineResultItems = result?.textLineResultItems;
      const parsedResultItems = result?.parsedResultItems;

      if (textLineResultItems) {
        if (this.isSoundFeedbackOn) {
          Feedback.beep();
        }
        const mrzText = textLineResultItems?.[0]?.text || "";
        const parsedResult = parsedResultItems[0] as ParsedResultItem;

        const processedData = processMRZData(mrzText, parsedResult);

        // Clean up camera and capture
        this.closeCamera();

        const mrzResult: MRZResult = {
          status: {
            code: EnumResultStatus.RS_SUCCESS,
            message: "Success",
          },
          originalImageResult: this.originalImageData,
          _imageData: this.originalImageData,
          data: processedData,
        };

        // Emit result through shared resources
        onResultUpdated?.(mrzResult);

        // Resolve scan promise
        this.currentScanResolver(mrzResult);
      }
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);

      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "Error capturing image",
        },
      };
      this.currentScanResolver(result);
    }
  }

  private initializeScanModeManager() {
    const { mrzFormatType } = this.config;

    // Initialize with all modes enabled by default
    this.scanModeManager = {
      [EnumMRZDocumentType.Passport]: true,
      [EnumMRZDocumentType.TD1]: true,
      [EnumMRZDocumentType.TD2]: true,
    };

    // If no format type specified, keep all enabled
    if (!mrzFormatType || (Array.isArray(mrzFormatType) && mrzFormatType.length === 0)) {
      return;
    }

    // Reset all to false first
    Object.keys(this.scanModeManager).forEach((key) => {
      this.scanModeManager[key as EnumMRZDocumentType] = false;
    });

    // Enable only specified types
    const types = Array.isArray(mrzFormatType) ? mrzFormatType : [mrzFormatType];
    types.forEach((type) => {
      this.scanModeManager[type] = true;
    });
  }

  private getScanMode(): EnumMRZScanMode {
    const enabled = Object.entries(this.scanModeManager)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([type]) => type as EnumMRZDocumentType)
      .sort()
      .join(",");

    const modeMap: Record<string, EnumMRZScanMode> = {
      [EnumMRZDocumentType.Passport]: EnumMRZScanMode.Passport,
      [EnumMRZDocumentType.TD1]: EnumMRZScanMode.TD1,
      [EnumMRZDocumentType.TD2]: EnumMRZScanMode.TD2,
      [`${EnumMRZDocumentType.Passport},${EnumMRZDocumentType.TD1}`]: EnumMRZScanMode.PassportAndTD1,
      [`${EnumMRZDocumentType.Passport},${EnumMRZDocumentType.TD2}`]: EnumMRZScanMode.PassportAndTD2,
      [`${EnumMRZDocumentType.TD1},${EnumMRZDocumentType.TD2}`]: EnumMRZScanMode.TD1AndTD2,
      [`${EnumMRZDocumentType.Passport},${EnumMRZDocumentType.TD1},${EnumMRZDocumentType.TD2}`]: EnumMRZScanMode.All,
      "": EnumMRZScanMode.All, // Handle case when no types are enabled
    };

    return modeMap[enabled];
  }

  private DCEShowToast(info: string, duration: number = 3000) {
    if (!this.DCE_ELEMENTS.toast) {
      return;
    }
    this.DCE_ELEMENTS.toast.textContent = info;
    this.DCE_ELEMENTS.toast.style.display = "";

    setTimeout(() => {
      this.DCE_ELEMENTS.toast.style.display = "none";
    }, duration) as any;
  }

  private async startCapturing() {
    const { cvRouter, cameraEnhancer } = this.resources;

    const currentTemplate = this.config.utilizedTemplateNames[this.currentScanMode];

    try {
      if (this.config.showScanGuide !== false) {
        // Update ROI if scanGuide can be shown
        const newSettings = await cvRouter.getSimplifiedSettings(currentTemplate);
        newSettings.roiMeasuredInPercentage = true;
        newSettings.roi.points = [
          {
            x: 0,
            y: 50,
          },
          {
            x: 100,
            y: 50,
          },
          {
            x: 100,
            y: 100,
          },
          {
            x: 0,
            y: 100,
          },
        ];
        await cvRouter.updateSettings(currentTemplate, newSettings);
      }

      await cvRouter.startCapturing(currentTemplate);

      // By default, cameraEnhancer captures grayscale images to optimize performance.
      // To capture RGB Images, we set the Pixel Format to EnumImagePixelFormat.IPF_ABGR_8888
      cameraEnhancer.setPixelFormat(EnumImagePixelFormat.IPF_ABGR_8888);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error("Failed to start capturing:", errMsg);
      this.closeCamera();

      if (this.currentScanResolver) {
        this.currentScanResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: "Failed to start capturing",
          },
        });
      }
    }
  }

  private async toggleScanDocType(docType: EnumMRZDocumentType): Promise<void> {
    try {
      if (
        this.scanModeManager[docType] &&
        Object.entries(this.scanModeManager).filter(([type, enabled]) => enabled && type !== docType).length === 0
      ) {
        console.warn("MRZ Scanner - At least one mode must be enabled");
        this.DCEShowToast("At least one mode must be enabled");
        return;
      }

      // Toggle the mode
      this.scanModeManager[docType] = !this.scanModeManager[docType];

      // Update current scan mode
      this.currentScanMode = this.getScanMode();

      this.stopCapturing();
      await this.startCapturing();

      this.toggleScanGuide();

      this.DCE_ELEMENTS.td1ModeOption.classList.toggle("selected", this.scanModeManager[EnumMRZDocumentType.TD1]);
      this.DCE_ELEMENTS.td2ModeOption.classList.toggle("selected", this.scanModeManager[EnumMRZDocumentType.TD2]);
      this.DCE_ELEMENTS.passportModeOption.classList.toggle(
        "selected",
        this.scanModeManager[EnumMRZDocumentType.Passport]
      );
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error("MRZ Scanner switch scan mode error: ", errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "MRZ Scanner switch scan mode error",
        },
      };
      this.currentScanResolver(result);
    }
  }

  async launch(_demo_cameraType?: _DEMO_CameraType): Promise<MRZResult> {
    try {
      await this.initialize();

      const { cvRouter, cameraEnhancer } = this.resources;

      return new Promise(async (resolve) => {
        this.currentScanResolver = resolve;

        // Start capturing
        await this.openCamera(_demo_cameraType || this.demoScanningMode);

        if (
          (!this.initializedDCE && cameraEnhancer.isOpen()) ||
          (!this._demo_IsFirefoxAndroid && Object.keys(_DEMO_VIRTUAL_CAMERA_LIST_LABEL).includes(_demo_cameraType))
        ) {
          await this.initializeElements();
        }
        await this.startCapturing();

        //Show scan guide
        this.toggleScanGuide();
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error("MRZ Scanner launch error: ", errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "MRZ Scanner launch error",
        },
      };
      this.currentScanResolver(result);
    }
  }
}

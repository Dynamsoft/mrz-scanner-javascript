import {
  _toBlob,
  _toCanvas,
  EnumCapturedResultItemType,
  EnumImagePixelFormat,
  MimeType,
  OriginalImageResultItem,
  CapturedResultReceiver,
  CapturedResult,
  ParsedResultItem,
  Feedback,
  MultiFrameResultCrossFilter,
  TextLineResultItem,
} from "dynamsoft-capture-vision-bundle";
import { SharedResources } from "../MRZScanner";
import { EnumResultStatus, UtilizedTemplateNames, EnumMRZScanMode, EnumMRZDocumentType } from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./utils/LoadingScreen";
import { createStyle, findClosestResolutionLevel, getElement } from "./utils";
import { MRZData, MRZResult, processMRZData } from "./utils/MRZParser";

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
  showPoweredByDynamsoft?: boolean; // true by default

  enableMultiFrameCrossFilter?: boolean; // true by default

  uploadAcceptedTypes?: string; // Default: "image/*"
  uploadFileConverter?: (file: File) => Promise<Blob>; // Function to convert non-image files to blobs
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

      if (this.config.enableMultiFrameCrossFilter === true) {
        const filter = new MultiFrameResultCrossFilter();
        filter.enableResultCrossVerification(EnumCapturedResultItemType.CRIT_TEXT_LINE, true);
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
      this.DCE_ELEMENTS.uploadImageBtn.style.visibility = "hidden";
    }

    if (this.config.showSoundToggle === false) {
      this.DCE_ELEMENTS.soundFeedbackBtn.style.visibility = "hidden";
    }

    if (this.config?.showPoweredByDynamsoft === false) {
      const poweredByDynamsoft = DCEContainer.shadowRoot.querySelector(".dce-mn-msg-poweredby") as HTMLElement;
      poweredByDynamsoft.style.display = "none";
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

    this.DCE_ELEMENTS.uploadImageBtn.onclick = () => this.uploadFile();
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
        const deviceId = option.getAttribute("data-davice-id");
        const resHeight = option.getAttribute("data-height");
        const resWidth = option.getAttribute("data-width");
        if (deviceId) {
          this.resources.cameraEnhancer.selectCamera(deviceId).then(() => {
            this.toggleScanGuide();
          });
        } else if (resHeight && resWidth) {
          this.resources.cameraEnhancer
            .setResolution({
              width: parseInt(resWidth),
              height: parseInt(resHeight),
            })
            .then(() => {
              this.toggleScanGuide();
            });
        }

        if (settingsContainer.style.display !== "none") {
          this.toggleSelectCameraBox();
        }
      });
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
      if (o.getAttribute("data-davice-id") === selectedCamera?.deviceId) {
        o.style.border = "2px solid #fe814a";
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

      if (height === heightMap[resolutionLvl]) {
        o.style.border = "2px solid #fe814a";
      } else {
        o.style.border = "none";
      }
    });
  }

  private toggleSelectCameraBox() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const settingsBox = DCEContainer.shadowRoot.querySelector(".dce-mn-resolution-box") as HTMLElement;

    // Highlight current camera and resolution
    this.highlightCameraAndResolutionOption();

    // Attach highlighting camera and resolution options on option click
    this.attachOptionClickListeners();

    settingsBox.click();
  }

  private async relaunch() {
    return;
  }

  private async uploadFile() {
    const { cvRouter } = this.resources;

    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = this.config.uploadAcceptedTypes ?? "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    try {
      this.showScannerLoadingOverlay("Processing file...");
      await this.closeCamera(false);

      // Get file from input
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
          // Start capturing
          this.showScannerLoadingOverlay("Initializing camera...");

          await this.openCamera();

          //Show scan guide
          this.toggleScanGuide();

          await this.startCapturing();

          this.hideScannerLoadingOverlay();
        });

        input.click();
      });

      if (!file) {
        return;
      }

      let fileBlob: Blob;

      // Use custom converter if provided and file is not an image
      if (this.config.uploadFileConverter && !file.type.startsWith("image/")) {
        try {
          fileBlob = await this.config.uploadFileConverter(file);
        } catch (error) {
          throw new Error(`Error converting file: ${error.message}`);
        }
      } else if (file.type.startsWith("image/")) {
        // For images, use existing conversion path
        fileBlob = file;
      } else {
        throw new Error("Unsupported file type. Please provide a converter function for this file type.");
      }

      // Update ROI for full image scanning
      const currentTemplate = this.config.utilizedTemplateNames[this.currentScanMode];
      if (this.config.showScanGuide !== false) {
        const newSettings = await cvRouter.getSimplifiedSettings(currentTemplate);
        newSettings.roiMeasuredInPercentage = true;
        newSettings.roi.points = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ];
        await cvRouter.updateSettings(currentTemplate, newSettings);
      }

      // Capture mrz from file
      const capturedResult = await cvRouter.capture(fileBlob, currentTemplate);
      this.capturedResultItems = capturedResult.items;
      const originalImage = this.capturedResultItems.filter(
        (item) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE
      ) as OriginalImageResultItem[];

      if (originalImage.length === 0) {
        throw new Error("No image data found in the captured result");
      }

      const imageData = originalImage[0].imageData;
      (imageData as any).toCanvas = () => _toCanvas(imageData);
      (imageData as any).toBlob = async () => await _toBlob(`image/png` as MimeType, imageData);

      this.originalImageData = imageData;

      const parsedResultItems = capturedResult?.parsedResult?.parsedResultItems;

      let processedData = {} as MRZData;

      if (parsedResultItems?.length) {
        const mrzText = ((parsedResultItems[0] as any)?.referencedItem as TextLineResultItem)?.text || ""; // TODO
        const parsedResult = parsedResultItems[0] as ParsedResultItem;
        processedData = processMRZData(mrzText, parsedResult);
      }

      const mrzResult = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: this.originalImageData,
        data: processedData,

        imageData: true,
        _imageData: this.originalImageData,
      };

      this.resources.onResultUpdated?.(mrzResult);
      this.currentScanResolver(mrzResult);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();

      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: `Error processing file: ${errMsg}`,
        },
      };
      this.currentScanResolver(result);
    } finally {
      this.hideScannerLoadingOverlay(true);
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

    const targetRatio = MRZScanGuideRatios[documentType].width / MRZScanGuideRatios[documentType].height;

    let region: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      isMeasuredInPercentage: boolean;
    };

    // Get visible region to determine orientation
    const visibleRegion = cameraView.getVisibleRegionOfVideo({ inPixels: true });
    const { width, height } = visibleRegion;

    if (!visibleRegion) return;

    if (visibleRegion.width > visibleRegion.height) {
      // Horizontal orientation
      const targetHeight = 0.5 * height;
      const targetWidth = targetHeight * targetRatio;
      const widthPercent = Math.round((targetWidth / width) * 100);

      // Center horizontally
      const leftPercent = (100 - widthPercent) / 2;
      const rightPercent = leftPercent + widthPercent;

      region = {
        left: leftPercent,
        right: rightPercent,
        top: 25,
        bottom: 75,
        isMeasuredInPercentage: true,
      };
    } else {
      // Portrait orientation
      const targetWidth = 0.9 * width;
      const targetHeight = targetWidth / targetRatio;
      const heightPercent = Math.round((targetHeight / height) * 100);

      // Center Vertically
      const topPercent = (100 - heightPercent) / 2;
      const bottomPercent = topPercent + heightPercent;

      region = {
        left: 5,
        right: 95,
        top: topPercent,
        bottom: bottomPercent,
        isMeasuredInPercentage: true,
      };
    }

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

  async openCamera(): Promise<void> {
    try {
      const { cameraEnhancer, cameraView } = this.resources;

      const configContainer = getElement(this.config.container);
      configContainer.style.display = "block";

      if (!cameraEnhancer.isOpen()) {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          configContainer.append(currentCameraView);
        }

        await cameraEnhancer.open();
      } else if (cameraEnhancer.isPaused()) {
        await cameraEnhancer.resume();
      }

      // Try to set default as 2k
      await cameraEnhancer.setResolution({
        width: 2560,
        height: 1440,
      });

      // Assign element
      if (!this.initializedDCE && cameraEnhancer.isOpen()) {
        await this.initializeElements();
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
    }
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
    if (this.firstFrame) {
      this.firstFrame = false;
      return;
    }

    // If only original image is returned in result.items (i.e. no text line or parsed result items), skip processing result
    if (result.items.length <= 1) {
      return;
    }

    this.capturedResultItems = result.items;

    try {
      const { onResultUpdated } = this.resources;

      const originalImage = result.items.filter(
        (item) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE
      ) as OriginalImageResultItem[];

      const imageData = originalImage[0].imageData;
      (imageData as any).toCanvas = () => _toCanvas(imageData);
      (imageData as any).toBlob = async () => await _toBlob(`image/png` as MimeType, imageData);

      this.originalImageData = imageData;
      const parsedResultItems = result?.parsedResult?.parsedResultItems;

      if (parsedResultItems?.length) {
        if (this.isSoundFeedbackOn) {
          Feedback.beep();
        }

        const mrzText = ((parsedResultItems[0] as any)?.referencedItem as TextLineResultItem)?.text || ""; // TODO
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
          data: processedData,

          // Used for MWC
          imageData: true,
          _imageData: this.originalImageData,
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

  // Used to skip the first frame processed by DCV. first frame doens't have scan region or color
  private firstFrame = true;
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

      this.firstFrame = true;
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

      this.toggleScanGuide();

      await this.startCapturing();

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

  async launch(): Promise<MRZResult> {
    try {
      await this.initialize();

      const { cvRouter, cameraEnhancer } = this.resources;

      return new Promise(async (resolve) => {
        this.currentScanResolver = resolve;

        this.showScannerLoadingOverlay("Initializing camera...");

        // Start capturing
        await this.openCamera();

        // Assign element
        if (!this.initializedDCE && cameraEnhancer.isOpen()) {
          await this.initializeElements();
        }

        //Show scan guide
        this.toggleScanGuide();

        await this.startCapturing();

        this.hideScannerLoadingOverlay();
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

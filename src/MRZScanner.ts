import { LicenseManager } from "dynamsoft-license";
import { CoreModule, EngineResourcePaths } from "dynamsoft-core";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import { CodeParserModule } from "dynamsoft-code-parser";
import { LabelRecognizerModule } from "dynamsoft-label-recognizer";
import {
  DEFAULT_TEMPLATE_NAMES,
  EnumMRZDocumentType,
  EnumMRZScanMode,
  EnumMRZScannerViews,
  EnumResultStatus,
  UtilizedTemplateNames,
} from "./views/utils/types";
import { createStyle, getElement, isEmptyObject } from "./views/utils";
import MRZScannerView, { _DEMO_CameraType, MRZScannerViewConfig } from "./views/MRZScannerView";
import { MRZResult } from "./views/utils/MRZParser";
import MRZResultView, { MRZResultViewConfig } from "./views/MRZResultView";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./views/utils/LoadingScreen";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH = "https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@2.0.0/dist/mrz-scanner.ui.html";
const DEFAULT_MRZ_SCANNER_TEMPLATE_PATH =
  "https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@2.0.0/dist/mrz-scanner.template.json";

const DEFAULT_DCV_ENGINE_RESOURCE_PATHS = { rootDirectory: "https://cdn.jsdelivr.net/npm/" };
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
  resultViewConfig?: MRZResultViewConfig;

  mrzFormatType?: Array<EnumMRZDocumentType>;
  showResultView?: boolean;
}

export interface SharedResources {
  cvRouter?: CaptureVisionRouter;
  cameraEnhancer?: CameraEnhancer;
  cameraView?: CameraView;
  result?: MRZResult;
  onResultUpdated?: (result: MRZResult) => void;
}

class MRZScanner {
  private scannerView?: MRZScannerView;
  private resultView?: MRZResultView;

  private resources: Partial<SharedResources> = {};
  private isInitialized = false;
  private isCapturing = false;

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

  private showLoadingOverlay(message?: string) {
    const configContainer =
      getElement(this.config.scannerViewConfig?.container) || getElement(this.config.resultViewConfig?.container);

    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  private hideLoadingOverlay(hideContainer: boolean = false) {
    const configContainer =
      getElement(this.config.scannerViewConfig?.container) || getElement(this.config.resultViewConfig?.container);

    if (this.loadingScreen) {
      this.loadingScreen.hide();
      this.loadingScreen = null;

      if (hideContainer) {
        configContainer.style.display = "none";

        if (this.config?.container) {
          getElement(this.config.container).style.display = "none";
        }
      }
    }
  }

  constructor(private config: MRZScannerConfig) {}

  async initialize(): Promise<{
    resources: SharedResources;
    components: {
      scannerView?: MRZScannerView;
      resultView?: MRZResultView;
    };
  }> {
    if (this.isInitialized) {
      return {
        resources: this.resources as SharedResources,
        components: {
          scannerView: this.scannerView,
          resultView: this.resultView,
        },
      };
    }

    try {
      const mrzScannerConfigSuccess = this.initializeMRZScannerConfig();
      if (!mrzScannerConfigSuccess) {
        // Failed to initialize mrz scanner config
        console.error("Failed to initialize mrz scanner config");
        return { resources: this.resources, components: {} };
      }

      // Create loading screen style
      createStyle("dynamsoft-mrz-loading-screen-style", DEFAULT_LOADING_SCREEN_STYLE);
      this.showLoadingOverlay("Loading...");

      const success = await this.initializeDCVResources();
      if (!success) {
        this.hideLoadingOverlay(true);
        // Failed to initialize DCV resources
        console.error("Failed to initialize DCV resources");
        return { resources: this.resources, components: {} };
      }

      this.resources.onResultUpdated = (result) => {
        this.resources.result = result;
      };

      const components: {
        scannerView?: MRZScannerView;
        resultView?: MRZResultView;
      } = {};

      // Only initialize components that are configured
      if (this.config.scannerViewConfig) {
        this.scannerView = new MRZScannerView(this.resources, this.config.scannerViewConfig);
        components.scannerView = this.scannerView;
        await this.scannerView.initialize();
      }

      if (this.config.resultViewConfig) {
        this.resultView = new MRZResultView(this.resources, this.config.resultViewConfig, this.scannerView);
        components.resultView = this.resultView;
      }

      this.isInitialized = true;

      return { resources: this.resources, components };
    } catch (ex: any) {
      this.isInitialized = false;

      let errMsg = ex?.message || ex;
      const error = `Initialization Failed: ${errMsg}`;

      alert(error);
      console.error(error);
      return { resources: this.resources, components: {} };
    } finally {
      this.hideLoadingOverlay(true);
    }
  }

  private async initializeDCVResources(): Promise<boolean> {
    try {
      LicenseManager.initLicense(this.config?.license || "", true);

      //The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
      CoreModule.engineResourcePaths = isEmptyObject(this.config?.engineResourcePaths)
        ? DEFAULT_DCV_ENGINE_RESOURCE_PATHS
        : this.config.engineResourcePaths;

      // Optional. Used to load wasm resources in advance, reducing latency between video playing and document modules.

      // Can add other specs. Please check https://www.dynamsoft.com/code-parser/docs/core/code-types/mrtd.html
      CoreModule.loadWasm(["DLR", "DCP"]);
      CodeParserModule.loadSpec("MRTD_TD3_PASSPORT");
      CodeParserModule.loadSpec("MRTD_TD1_ID");
      CodeParserModule.loadSpec("MRTD_TD2_ID");
      LabelRecognizerModule.loadRecognitionData("MRZ");

      this.resources.cameraView = await CameraView.createInstance(this.config.scannerViewConfig?.cameraEnhancerUIPath);
      this.resources.cameraEnhancer = await CameraEnhancer.createInstance(this.resources.cameraView);
      this.resources.cvRouter = await CaptureVisionRouter.createInstance();

      return true;
    } catch (ex: any) {
      let errMsg = ex?.message || ex;

      if (errMsg?.toLowerCase().includes("license")) {
        const error = `The MRZ Scanner license is invalid or has expired. Please contact the site administrator to resolve this issue.`;

        alert(error);
        console.error(error);
      } else {
        const error = `Resource Initialization Failed: ${errMsg}`;

        alert(error);
        console.error(error);
      }

      return false;
    }
  }

  private shouldCreateDefaultContainer(): boolean {
    const hasNoMainContainer = !this.config.container;
    const hasNoViewContainers = !(this.config.scannerViewConfig?.container || this.config.resultViewConfig?.container);
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
    // Case 1: Using separate containers (no main container)
    if (!this.config.container) {
      // Case 1.1: Result view requested but no container provided
      if (
        this.config.scannerViewConfig?.container &&
        this.config.showResultView &&
        !this.config.resultViewConfig?.container
      ) {
        const error = `MRZResultView container is required when showResultView is true`;
        alert(error);
        console.error(error);
        return false;
      }

      // Case 1.2: Only result view container provided but no existing result
      if (
        !this.config.scannerViewConfig?.container &&
        this.config.resultViewConfig?.container &&
        !this.resources.result
      ) {
        const error = `Result is needed to create MRZResultView without a scanner view`;
        alert(error);
        console.error(error);
        return false;
      }
    }

    // Case 2: Ensure valid container references where provided
    try {
      // Check that specified containers can be resolved
      if (this.config.container && !getElement(this.config.container)) {
        const error = `Invalid main container reference`;
        alert(error);
        console.error(error);
        return false;
      }

      if (this.config.scannerViewConfig?.container && !getElement(this.config.scannerViewConfig?.container)) {
        const error = `Invalid scanner view container reference`;
        alert(error);
        console.error(error);
        return false;
      }

      if (this.config.resultViewConfig?.container && !getElement(this.config.resultViewConfig?.container)) {
        const error = `Invalid result view container reference`;
        alert(error);
        console.error(error);
        return false;
      }
    } catch (e) {
      const error = `Error accessing container references: ${e.message}`;
      alert(error);
      console.error(error);
      return false;
    }

    return true;
  }

  private showResultView() {
    if (this.config.showResultView === false) return false;

    // If we have a main container, follow existing logic
    if (this.config.container) {
      if (
        this.config.showResultView === undefined &&
        (this.config.resultViewConfig?.container || this.config.container)
      ) {
        return true;
      }
      return !!this.config.showResultView;
    }

    // Without main container, require specific container
    return this.config.showResultView && !!this.config.resultViewConfig?.container;
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
      this.config.container = getElement(this.config.container);
    }
    const viewContainers = this.config.container ? this.createViewContainers(getElement(this.config.container)) : {};

    const baseConfig = {
      license: this.checkForTemporaryLicense(this.config.license),
      utilizedTemplateNames: Object.fromEntries(
        Object.values(EnumMRZScanMode).map((val) => [
          val,
          this.config.utilizedTemplateNames?.[val] || DEFAULT_TEMPLATE_NAMES[val],
        ])
      ) as Record<EnumMRZScanMode, string>,
      templateFilePath: this.config?.templateFilePath || DEFAULT_MRZ_SCANNER_TEMPLATE_PATH,
    };

    // Views Config
    const scannerViewConfig = {
      ...this.config.scannerViewConfig,
      container:
        viewContainers[EnumMRZScannerViews.Scanner] || getElement(this.config.scannerViewConfig?.container) || null,
      cameraEnhancerUIPath: this.config.scannerViewConfig?.cameraEnhancerUIPath || DEFAULT_DCE_UI_PATH,
      templateFilePath: baseConfig.templateFilePath,
      utilizedTemplateNames: baseConfig.utilizedTemplateNames,
      enableMultiFrameCrossFilter: this.config.scannerViewConfig?.enableMultiFrameCrossFilter ?? true,
      mrzFormatType: this.config.mrzFormatType,
    };

    const resultViewConfig = this.showResultView()
      ? {
          ...this.config.resultViewConfig,
          container:
            viewContainers[EnumMRZScannerViews.Result] || getElement(this.config.resultViewConfig?.container) || null,
        }
      : undefined;

    Object.assign(this.config, {
      ...baseConfig,
      scannerViewConfig,
      resultViewConfig,
    });

    return true;
  }

  private createViewContainers(mainContainer: HTMLElement): Record<string, HTMLElement> {
    mainContainer.textContent = "";

    const views: EnumMRZScannerViews[] = [EnumMRZScannerViews.Scanner];

    if (this.showResultView()) views.push(EnumMRZScannerViews.Result);

    return views.reduce((containers, view) => {
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
    }, {} as Record<string, HTMLElement>);
  }

  dispose(): void {
    if (this.resultView) {
      this.resultView.dispose();
      this.resultView = null;
    }

    this.scannerView = null;

    // Dispose resources
    if (this.resources.cameraEnhancer) {
      this.resources.cameraEnhancer.dispose();
      this.resources.cameraEnhancer = null;
    }

    if (this.resources.cameraView) {
      this.resources.cameraView.dispose();
      this.resources.cameraView = null;
    }

    if (this.resources.cvRouter) {
      this.resources.cvRouter.dispose();
      this.resources.cvRouter = null;
    }

    this.resources.result = null;
    this.resources.onResultUpdated = null;

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
    cleanContainer(this.config.resultViewConfig?.container);

    this.isInitialized = false;
  }

  async launch(_demo_cameraType?: _DEMO_CameraType): Promise<MRZResult> {
    try {
      if (this.isCapturing) {
        const error = `Capture session already in progress`;

        alert(error);
        console.error(error);
        return {
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error,
          },
        };
      }

      this.isCapturing = true;
      const { components } = await this.initialize();

      if (isEmptyObject(components)) {
        throw new Error(`MRZ Scanner initialization failed.`);
      }

      if (this.config.container) {
        getElement(this.config.container).style.display = "block";
      }

      // Special case handling for direct views with existing results
      if (!components.scannerView && this.resources.result) {
        if (components.resultView) return await components.resultView.launch();
      }

      // Scanner view is required if no existing result
      if (!components.scannerView && !this.resources.result) {
        throw Error(`Scanner view is required when no previous result exists`);
      }

      // Main Flow
      if (components.scannerView) {
        const scanResult = await components.scannerView.launch(_demo_cameraType);

        if (scanResult?.status.code !== EnumResultStatus.RS_SUCCESS) {
          return {
            status: {
              code: scanResult?.status.code,
              message: scanResult?.status.message || "Failed to capture image",
            },
          };
        }

        // Route based on capture method
        if (components.resultView) {
          return await components.resultView.launch();
        }
      }

      // If no additional views, return current result
      return this.resources.result;
    } catch (error) {
      alert(error?.message || error);
      console.error(error?.message || error);
      return {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: error?.message || error,
        },
      };
    } finally {
      this.isCapturing = false;
      this.dispose();
    }
  }
}

export default MRZScanner;

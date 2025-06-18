import { DSImageData, EngineResourcePaths, CaptureVisionRouter, CameraEnhancer, CameraView } from "dynamsoft-capture-vision-bundle";
import { EnumMRZDocumentType, UtilizedTemplateNames } from "./views/utils/types";
import MRZScannerView, { MRZScannerViewConfig } from "./views/MRZScannerView";
import { MRZResult } from "./views/utils/MRZParser";
import MRZResultView, { MRZResultViewConfig } from "./views/MRZResultView";
export interface MRZScannerConfig {
    license?: string;
    container?: HTMLElement | string;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    engineResourcePaths?: EngineResourcePaths;
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
declare class MRZScanner {
    private config;
    private scannerView?;
    private resultView?;
    private resources;
    private isInitialized;
    private isCapturing;
    private loadingScreen;
    private isDynamsoftResourcesLoaded;
    protected isFileMode: boolean;
    private showLoadingOverlay;
    private hideLoadingOverlay;
    constructor(config: MRZScannerConfig);
    initialize(): Promise<{
        resources: SharedResources;
        components: {
            scannerView?: MRZScannerView;
            resultView?: MRZResultView;
        };
    }>;
    private initializeDynamsoftResources;
    private initializeDCVResources;
    private shouldCreateDefaultContainer;
    private createDefaultMRZScannerContainer;
    private checkForTemporaryLicense;
    private validateViewConfigs;
    private showResultView;
    private initializeMRZScannerConfig;
    private createViewContainers;
    dispose(): void;
    /**
     * Processes an uploaded image file
     * @param imageOrFile The file to process
     * @returns Promise with the document result
     */
    private processUploadedFile;
    launch(imageOrFile: Blob | string | DSImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<MRZResult>;
}
export default MRZScanner;
//# sourceMappingURL=MRZScanner.d.ts.map
import { DSImageData, EngineResourcePaths } from 'dynamsoft-core';
import * as dynamsoftCore from 'dynamsoft-core';
export { dynamsoftCore as Core };
import * as dynamsoftLicense from 'dynamsoft-license';
export { dynamsoftLicense as License };
import { CapturedResult, CaptureVisionRouter } from 'dynamsoft-capture-vision-router';
import * as dynamsoftCaptureVisionRouter from 'dynamsoft-capture-vision-router';
export { dynamsoftCaptureVisionRouter as CVR };
import { CameraEnhancer, CameraView } from 'dynamsoft-camera-enhancer';
import * as dynamsoftCameraEnhancer from 'dynamsoft-camera-enhancer';
export { dynamsoftCameraEnhancer as DCE };
import * as dynamsoftCodeParser from 'dynamsoft-code-parser';
export { dynamsoftCodeParser as DCP };
import * as dynamsoftLabelRecognizer from 'dynamsoft-label-recognizer';
export { dynamsoftLabelRecognizer as DLR };
import * as dynamsoftUtility from 'dynamsoft-utility';
export { dynamsoftUtility as Utility };

declare enum EnumMRZScanMode {
    Passport = "passport",
    TD1 = "td1",
    TD2 = "td2",
    PassportAndTD1 = "passportAndTd1",
    PassportAndTD2 = "passportAndTd2",
    TD1AndTD2 = "td1AndTd2",
    All = "all"
}
declare enum EnumMRZDocumentType {
    Passport = "passport",
    TD1 = "td1",
    TD2 = "td2"
}
declare enum EnumMRZScannerViews {
    Scanner = "scanner",
    Result = "scan-result"
}
declare const DEFAULT_TEMPLATE_NAMES: {
    passport: string;
    td1: string;
    td2: string;
    passportAndTd1: string;
    passportAndTd2: string;
    td1AndTd2: string;
    all: string;
};
type UtilizedTemplateNames = Record<EnumMRZScanMode, string>;
declare enum EnumResultStatus {
    RS_SUCCESS = 0,
    RS_CANCELLED = 1,
    RS_FAILED = 2
}
type ResultStatus = {
    code: EnumResultStatus;
    message?: string;
};
type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">;
interface ToolbarButton {
    id: string;
    icon: string;
    label: string;
    onClick?: () => void | Promise<void>;
    className?: string;
    isDisabled?: boolean;
    isHidden?: boolean;
}

declare enum EnumMRZData {
    InvalidFields = "invalidFields",
    DocumentType = "documentType",
    DocumentNumber = "documentNumber",
    MRZText = "mrzText",
    FirstName = "firstName",
    LastName = "lastName",
    Age = "age",
    Sex = "sex",
    IssuingState = "issuingState",
    Nationality = "nationality",
    DateOfBirth = "dateOfBirth",
    DateOfExpiry = "dateOfExpiry"
}
interface MRZResult {
    status: ResultStatus;
    originalImageResult?: DSImageData;
    data?: MRZData;
    _imageData?: DSImageData;
}
interface MRZData {
    [EnumMRZData.InvalidFields]?: EnumMRZData[];
    [EnumMRZData.DocumentType]: string;
    [EnumMRZData.DocumentNumber]: string;
    [EnumMRZData.MRZText]: string;
    [EnumMRZData.FirstName]: string;
    [EnumMRZData.LastName]: string;
    [EnumMRZData.Age]: number;
    [EnumMRZData.Sex]: string;
    [EnumMRZData.IssuingState]: string;
    [EnumMRZData.Nationality]: string;
    [EnumMRZData.DateOfBirth]: MRZDate;
    [EnumMRZData.DateOfExpiry]: MRZDate;
}
interface MRZDate {
    year: number;
    month: number;
    day: number;
}
declare const MRZDataLabel: Record<EnumMRZData, string>;
declare function displayMRZDate(date: MRZDate): string;

declare enum _DEMO_VIRTUAL_CAMERA_LIST {
    VIRTUAL_PASSPORT = "virtual1",
    VIRTUAL_TD1 = "virtual2",
    VIRTUAL_TD2 = "virtual3",
    PHYSICAL_CAMERA = "camera"
}
type _DEMO_CameraType = _DEMO_VIRTUAL_CAMERA_LIST;
interface MRZScannerViewConfig {
    cameraEnhancerUIPath?: string;
    container?: HTMLElement | string;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    mrzFormatType?: EnumMRZDocumentType | Array<EnumMRZDocumentType>;
    showScanGuide?: boolean;
    showUploadImage?: boolean;
    showFormatSelector?: boolean;
    showSoundToggle?: boolean;
    enableMultiFrameCrossFilter?: boolean;
}
declare class MRZScannerView {
    private resources;
    private config;
    private demoScanningMode;
    private demoScanningResolution;
    private isSoundFeedbackOn;
    private scanModeManager;
    private currentScanMode;
    private resizeTimer;
    private capturedResultItems;
    private originalImageData;
    private initialized;
    private initializedDCE;
    private DCE_ELEMENTS;
    private currentScanResolver?;
    private loadingScreen;
    private showScannerLoadingOverlay;
    private hideScannerLoadingOverlay;
    private handleResize;
    constructor(resources: SharedResources, config: MRZScannerViewConfig);
    initialize(): Promise<void>;
    private initializeElements;
    private setupScanModeSelector;
    private assignDCEClickEvents;
    private handleCloseBtn;
    private attachOptionClickListeners;
    private _demo_AttachFakeEventsToCameras;
    private _demo_CheckForFakeCamera;
    private highlightCameraAndResolutionOption;
    private toggleSelectCameraBox;
    private get _demo_IsFirefoxAndroid();
    private _demo_saveSelectedCamera;
    private _demo_AddFakeCameras;
    private uploadImage;
    private toggleSoundFeedback;
    private calculateScanRegion;
    private toggleScanGuide;
    openCamera(_demo_cameraType?: _DEMO_CameraType): Promise<void>;
    private _demo_playVideoWithRes;
    closeCamera(hideContainer?: boolean): Promise<void>;
    pauseCamera(): void;
    stopCapturing(): void;
    handleMRZResult(result: CapturedResult): Promise<void>;
    private initializeScanModeManager;
    private getScanMode;
    private DCEShowToast;
    private startCapturing;
    private toggleScanDocType;
    launch(_demo_cameraType?: _DEMO_CameraType): Promise<MRZResult>;
}

interface MRZResultViewToolbarButtonsConfig {
    rescan?: ToolbarButtonConfig;
    done?: ToolbarButtonConfig;
}
interface MRZResultViewConfig {
    container?: HTMLElement | string;
    toolbarButtonsConfig?: MRZResultViewToolbarButtonsConfig;
    showOriginalImage?: boolean;
    showMRZText?: boolean;
    allowResultEditing?: boolean;
    onDone?: (result: MRZResult) => Promise<void>;
}
declare class MRZResultView {
    private resources;
    private config;
    private scannerView;
    private currentScanResultViewResolver?;
    private editedFields;
    constructor(resources: SharedResources, config: MRZResultViewConfig, scannerView: MRZScannerView);
    launch(): Promise<MRZResult>;
    private handleRescan;
    private handleDone;
    private createControls;
    private handleFieldEdit;
    private createMRZDataDisplay;
    initialize(): Promise<void>;
    hideView(): void;
    dispose(preserveResolver?: boolean): void;
}

interface MRZScannerConfig {
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
interface SharedResources {
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
    private initializeDCVResources;
    private shouldCreateDefaultContainer;
    private createDefaultMRZScannerContainer;
    private checkForTemporaryLicense;
    private validateViewConfigs;
    private showResultView;
    private initializeMRZScannerConfig;
    private createViewContainers;
    dispose(): void;
    launch(_demo_cameraType?: _DEMO_CameraType): Promise<MRZResult>;
}

declare const DynamsoftMRZScanner: {
    MRZScanner: typeof MRZScanner;
    MRZScannerView: typeof MRZScannerView;
    MRZResultView: typeof MRZResultView;
};

export { DEFAULT_TEMPLATE_NAMES, DynamsoftMRZScanner, EnumMRZData, EnumMRZDocumentType, EnumMRZScanMode, EnumMRZScannerViews, EnumResultStatus, MRZData, MRZDataLabel, MRZDate, MRZResult, MRZResultView, MRZResultViewConfig, MRZResultViewToolbarButtonsConfig, MRZScanner, MRZScannerView, MRZScannerViewConfig, ResultStatus, ToolbarButton, ToolbarButtonConfig, UtilizedTemplateNames, displayMRZDate };

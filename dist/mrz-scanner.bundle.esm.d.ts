import { DSImageData, CapturedResult, EngineResourcePaths, CaptureVisionRouter, CameraEnhancer, CameraView } from 'dynamsoft-capture-vision-bundle';
export * from 'dynamsoft-capture-vision-bundle';

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
    IssuingStateRaw = "issuingStateRaw",
    Nationality = "nationality",
    NationalityRaw = "nationalityRaw",
    DateOfBirth = "dateOfBirth",
    DateOfExpiry = "dateOfExpiry"
}
interface MRZResult {
    status: ResultStatus;
    originalImageResult?: DSImageData;
    data?: MRZData;
    imageData?: boolean;
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
    [EnumMRZData.IssuingStateRaw]: string;
    [EnumMRZData.Nationality]: string;
    [EnumMRZData.NationalityRaw]: string;
    [EnumMRZData.DateOfBirth]: MRZDate;
    [EnumMRZData.DateOfExpiry]: MRZDate;
}
interface MRZDate {
    year: number;
    month: number;
    day: number;
}
declare const MRZDataLabel: Record<EnumMRZData, string> & Record<string, string>;
declare function displayMRZDate(date: MRZDate): string;

interface MRZScannerViewConfig {
    cameraEnhancerUIPath?: string;
    uiPath?: string;
    container?: HTMLElement | string;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    mrzFormatType?: EnumMRZDocumentType | Array<EnumMRZDocumentType>;
    showScanGuide?: boolean;
    showUploadImage?: boolean;
    showFormatSelector?: boolean;
    showSoundToggle?: boolean;
    showPoweredByDynamsoft?: boolean;
    enableMultiFrameCrossFilter?: boolean;
    uploadAcceptedTypes?: string;
    uploadFileConverter?: (file: File) => Promise<Blob>;
}
declare class MRZScannerView {
    private resources;
    private config;
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
    private highlightCameraAndResolutionOption;
    private toggleSelectCameraBox;
    private relaunch;
    private uploadFile;
    private toggleSoundFeedback;
    private calculateScanRegion;
    private toggleScanGuide;
    openCamera(): Promise<void>;
    closeCamera(hideContainer?: boolean): Promise<void>;
    pauseCamera(): void;
    stopCapturing(): void;
    handleMRZResult(result: CapturedResult): Promise<void>;
    private initializeScanModeManager;
    private getScanMode;
    private DCEShowToast;
    private firstFrame;
    private startCapturing;
    private toggleScanDocType;
    launch(): Promise<MRZResult>;
}

interface MRZResultViewToolbarButtonsConfig {
    cancel?: ToolbarButton;
    rescan?: ToolbarButtonConfig;
    done?: ToolbarButtonConfig;
}
interface MRZResultViewConfig {
    container?: HTMLElement | string;
    toolbarButtonsConfig?: MRZResultViewToolbarButtonsConfig;
    showOriginalImage?: boolean;
    showMRZText?: boolean;
    allowResultEditing?: boolean;
    emptyResultMessage?: string;
    onDone?: (result: MRZResult) => Promise<void>;
    onCancel?: (result: MRZResult) => Promise<void>;
    _isFileMode?: boolean;
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
    private handleCancel;
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
    launch(imageOrFile?: Blob | string | DSImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<MRZResult>;
}

declare const DynamsoftMRZScanner: {
    MRZScanner: typeof MRZScanner;
    MRZScannerView: typeof MRZScannerView;
    MRZResultView: typeof MRZResultView;
};

export { DEFAULT_TEMPLATE_NAMES, DynamsoftMRZScanner, EnumMRZData, EnumMRZDocumentType, EnumMRZScanMode, EnumMRZScannerViews, EnumResultStatus, MRZDataLabel, MRZResultView, MRZScanner, MRZScannerView, displayMRZDate };
export type { MRZData, MRZDate, MRZResult, MRZResultViewConfig, MRZResultViewToolbarButtonsConfig, MRZScannerViewConfig, ResultStatus, ToolbarButton, ToolbarButtonConfig, UtilizedTemplateNames };

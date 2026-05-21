import { CameraEnhancer } from 'dynamsoft-capture-vision-bundle';
import { CameraView } from 'dynamsoft-capture-vision-bundle';
import { CapturedResult } from 'dynamsoft-capture-vision-bundle';
import { CaptureVisionRouter } from 'dynamsoft-capture-vision-bundle';
import { DSImageData } from 'dynamsoft-capture-vision-bundle';
import { EngineResourcePaths } from 'dynamsoft-capture-vision-bundle';

export declare const DEFAULT_TEMPLATE_NAMES: {
    td3: string;
    td1: string;
    td2: string;
    mrva: string;
    mrvb: string;
    td1AndTd2: string;
    mrvaAndMrvb: string;
    passportAndTd1: string;
    passportAndTd2: string;
    all: string;
};

export declare function displayMRZDate(date: MRZDate): string;

export declare const DynamsoftMRZScanner: {
    MRZScanner: typeof MRZScanner;
    MRZScannerView: typeof MRZScannerView;
};

export declare enum EnumDocumentSide {
    MRZ = "mrz",// The side of the document that contains the MRZ (primary side)
    Opposite = "opposite"
}

export declare enum EnumMRZData {
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
    DateOfExpiry = "dateOfExpiry",
    OptionalData1 = "optionalData1",
    OptionalData2 = "optionalData2"
}

export declare enum EnumMRZDocumentType {
    Passport = "td3_passport",
    TD1 = "td1_id",
    TD2 = "td2_id",
    MRVA = "mrva_visa",
    MRVB = "mrvb_visa"
}

export declare enum EnumMRZScanMode {
    TD3 = "td3",
    TD1 = "td1",
    TD2 = "td2",
    MRVA = "mrva",
    MRVB = "mrvb",
    TD1AndTD2 = "td1AndTd2",
    MRVAAndMRVB = "mrvaAndMrvb",
    PassportAndTD1 = "passportAndTd1",
    PassportAndTD2 = "passportAndTd2",
    All = "all"
}

export declare enum EnumMRZScannerViews {
    Scanner = "scanner",
    Result = "scan-result"
}

export declare enum EnumResultStatus {
    RS_SUCCESS = 0,
    RS_CANCELLED = 1,
    RS_FAILED = 2
}

/**
 * Configuration for format selector button labels
 */
declare interface FormatSelectorConfig {
    passportLabel?: string;
    idLabel?: string;
    visaLabel?: string;
    allLabel?: string;
}

/**
 * Configuration for UI messages and localization
 */
declare interface MessagesConfig {
    positionMRZ?: string;
    holdSteady?: string;
    scanSuccess?: string;
    flipDocument?: string;
    flipDocumentCountdown?: string;
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

export declare interface MRZData {
    [EnumMRZData.InvalidFields]?: EnumMRZData[];
    [EnumMRZData.DocumentType]: EnumMRZDocumentType;
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
    [EnumMRZData.OptionalData1]?: string;
    [EnumMRZData.OptionalData2]?: string;
}

export declare const MRZDataLabel: Record<EnumMRZData, string> & Record<string, string>;

export declare interface MRZDate {
    year: number;
    month: number;
    day: number;
}

/**
 * A captured image returned from {@link MRZResult.getDocumentImage},
 * {@link MRZResult.getOriginalImage}, and {@link MRZResult.getPortraitImage}.
 *
 * Extends the bare {@link DSImageData} (raw bytes / dimensions / format)
 * with the rendering helpers attached at runtime by {@link attachImageHelpers}.
 */
export declare interface MRZImage extends DSImageData {
    /** Render the image data into an `HTMLCanvasElement`. */
    toCanvas(): HTMLCanvasElement;
    /** Encode the image data as a PNG `Blob`. */
    toBlob(): Promise<Blob>;
}

export declare interface MRZResult {
    status?: EnumResultStatus;
    data?: MRZData;
    getDocumentImage(side: EnumDocumentSide): MRZImage | null;
    getOriginalImage(side: EnumDocumentSide): MRZImage | null;
    getPortraitImage(): MRZImage | null;
}

export declare class MRZScanner {
    private config;
    private scannerView?;
    private resources;
    private isInitialized;
    private isCapturing;
    private loadingScreen;
    private isDynamsoftResourcesLoaded;
    protected isFileMode: boolean;
    private showLoadingOverlay;
    private hideLoadingOverlay;
    constructor(config: MRZScannerConfig);
    /**
     * Normalizes template names to TemplatePair format.
     * Accepts either a string (legacy format) or TemplatePair object.
     * When a string is provided, auto-derives the MRZ-only variant as `${name}-MRZOnly`.
     */
    private static normalizeTemplateName;
    initialize(): Promise<{
        resources: SharedResources;
        components: {
            scannerView?: MRZScannerView;
        };
    }>;
    private initializeDynamsoftResources;
    private initializeDCVResources;
    private shouldCreateDefaultContainer;
    private createDefaultMRZScannerContainer;
    private checkForTemporaryLicense;
    private validateViewConfigs;
    private initializeMRZScannerConfig;
    private createViewContainers;
    dispose(): void;
    /**
     * Processes a static image source (Blob, URL, DSImageData, or HTML element).
     * String inputs are fetched as URLs; all other types are forwarded to capture() as-is.
     */
    private processImageSource;
    launch(imageSource?: Blob | string | DSImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<MRZResult>;
}

export declare interface MRZScannerConfig {
    license?: string;
    container?: HTMLElement | string;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    engineResourcePaths?: EngineResourcePaths;
    scannerViewConfig?: Omit<MRZScannerViewConfig, "templateFilePath" | "utilizedTemplateNames">;
    mrzFormatType?: Array<EnumMRZDocumentType>;
    returnOriginalImage?: boolean;
    returnDocumentImage?: boolean;
    returnPortraitImage?: boolean;
}

export declare class MRZScannerView {
    private resources;
    private config;
    private isSoundFeedbackOn;
    private isFlashOn;
    private static readonly FORMAT_ORDER;
    private currentFormatMode;
    private scanModeManager;
    private currentScanMode;
    private messages;
    private resizeTimer;
    private defaultBackCameraId;
    private originalImageData;
    private initialized;
    private initializedUI;
    private isMRZScanned;
    private isPortraitScanned;
    private areSidesDifferent;
    private isWaitingForFlip;
    private flipTimeoutHandle;
    private flipCountdownHandle;
    private portraitSkipTimerHandle;
    private static readonly PORTRAIT_SKIP_TIMEOUT_MS;
    private isProcessingSameSideFrame;
    private isProcessingPortraitFrame;
    private sameSideMissCount;
    private static readonly SAME_SIDE_MISSES_BEFORE_FLIP;
    private consecutiveStablePortraitFrames;
    private static readonly PORTRAIT_STABLE_FRAMES_REQUIRED;
    private latestLocalizedTextLines;
    private mrzSideData;
    private ui;
    private scanSpinnerEl;
    private currentScanResolver?;
    private loadingScreen;
    private showScannerLoadingOverlay;
    private hideScannerLoadingOverlay;
    private handleResize;
    constructor(resources: SharedResources, config: MRZScannerViewConfig);
    initialize(): Promise<void>;
    private initializeUI;
    /**
     * Returns the set of enabled MRZ types from config, or all types if unspecified.
     */
    private getEnabledTypes;
    /**
     * Returns the format buttons to display based on enabled types.
     * Includes "all" only when multiple categories are active.
     *
     * @returns The visible button identifiers in display order. A result of
     *   length `<= 1` indicates the selector should be hidden entirely.
     */
    private getVisibleFormatButtons;
    private toggleFlash;
    private syncFlashIcon;
    private probeFlashSupport;
    private switchCamera;
    private toggleSoundFeedback;
    private setGuideFrame;
    private setGuideFrameVisible;
    private showGuideSuccessBorder;
    private showFlipAnimation;
    private hideFlipAnimation;
    private showBadge;
    private static readonly FORMAT_DOC_TYPES;
    private static buildScanModeManager;
    private setFormatMode;
    private syncFormatButtons;
    private setupPortraitOnlyMode;
    private updateScanRegion;
    private calculateScanRegion;
    openCamera(): Promise<void>;
    closeCamera(hideContainer?: boolean): Promise<void>;
    pauseCamera(): void;
    stopCapturing(): void;
    private handleCloseBtn;
    private startPortraitSkipTimer;
    private clearPortraitSkipTimer;
    private handleSkipPortrait;
    private loadImageFile;
    private initializeScanModeManager;
    private getScanMode;
    private firstFrame;
    private startCapturing;
    private hasSwitchedToFullTemplate;
    private switchToFullTemplate;
    launch(): Promise<MRZResult | undefined>;
    private isDocumentTypeEnabled;
    handleMRZResult(result: CapturedResult): Promise<void>;
    private handleMRZSideScan;
    private tryPortraitOnSameSide;
    private handlePortraitSideScan;
    private showScanSpinner;
    private hideScanSpinner;
    private resetScanningState;
}

export declare interface MRZScannerViewConfig {
    cameraEnhancerUIPath?: string;
    uiPath?: string;
    container?: HTMLElement | string;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    mrzFormatType?: EnumMRZDocumentType | Array<EnumMRZDocumentType>;
    enableScanRegion?: boolean;
    showLoadImageButton?: boolean;
    showFormatSelector?: boolean;
    showSoundToggle?: boolean;
    enableMultiFrameCrossFilter?: boolean;
    loadImageAcceptedTypes?: string;
    loadImageFileConverter?: (file: File) => Promise<Blob>;
    flipDocumentTimeout?: number;
    toolbarButtonsConfig?: ToolbarButtonsConfig;
    formatSelectorConfig?: FormatSelectorConfig;
    messagesConfig?: MessagesConfig;
    themeConfig?: ThemeConfig;
}

export declare type ResultStatus = {
    code: EnumResultStatus;
    message?: string;
};

declare interface SharedResources {
    cvRouter?: CaptureVisionRouter;
    cameraEnhancer?: CameraEnhancer;
    cameraView?: CameraView;
    result?: MRZResult;
    onResultUpdated?: (result: MRZResult) => void;
    returnOriginalImage?: boolean;
    returnDocumentImage?: boolean;
    returnPortraitImage?: boolean;
}

declare type TemplatePair = {
    full: string;
    mrzOnly: string;
};

declare interface ThemeConfig {
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

export declare interface ToolbarButton {
    id: string;
    icon: string;
    label: string;
    onClick?: () => void | Promise<void>;
    className?: string;
    isDisabled?: boolean;
    isHidden?: boolean;
}

/**
 * Configuration for a single toolbar button
 */
declare interface ToolbarButton_2 {
    id: string;
    icon?: string;
    label?: string;
    isHidden?: boolean;
    className?: string;
}

export declare type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">;

/**
 * Partial configuration for toolbar buttons (id is required internally)
 */
declare type ToolbarButtonConfig_2 = Partial<Omit<ToolbarButton_2, "id">>;

/**
 * Configuration for all toolbar buttons
 */
declare interface ToolbarButtonsConfig {
    close?: ToolbarButtonConfig_2;
    loadImage?: ToolbarButtonConfig_2;
    cameraSwitch?: ToolbarButtonConfig_2;
    flash?: ToolbarButtonConfig_2;
    flashOff?: ToolbarButtonConfig_2;
    sound?: ToolbarButtonConfig_2;
    soundOff?: ToolbarButtonConfig_2;
}

export declare type UtilizedTemplateNames = Record<EnumMRZScanMode, string | TemplatePair>;


export * from "dynamsoft-capture-vision-bundle";

export { }

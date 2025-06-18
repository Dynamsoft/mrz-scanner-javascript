import { ToolbarButton, ToolbarButtonConfig } from "./utils/types";
import { MRZResult } from "./utils/MRZParser";
import MRZScannerView from "./MRZScannerView";
import { SharedResources } from "../MRZScanner";
export interface MRZResultViewToolbarButtonsConfig {
    cancel?: ToolbarButton;
    rescan?: ToolbarButtonConfig;
    done?: ToolbarButtonConfig;
}
export interface MRZResultViewConfig {
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
export default class MRZResultView {
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
//# sourceMappingURL=MRZResultView.d.ts.map
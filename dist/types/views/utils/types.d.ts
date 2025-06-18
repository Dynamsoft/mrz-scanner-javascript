export declare enum EnumMRZScanMode {
    Passport = "passport",
    TD1 = "td1",
    TD2 = "td2",
    PassportAndTD1 = "passportAndTd1",
    PassportAndTD2 = "passportAndTd2",
    TD1AndTD2 = "td1AndTd2",
    All = "all"
}
export declare enum EnumMRZDocumentType {
    Passport = "passport",
    TD1 = "td1",
    TD2 = "td2"
}
export declare enum EnumMRZScannerViews {
    Scanner = "scanner",
    Result = "scan-result"
}
export declare const DEFAULT_TEMPLATE_NAMES: {
    passport: string;
    td1: string;
    td2: string;
    passportAndTd1: string;
    passportAndTd2: string;
    td1AndTd2: string;
    all: string;
};
export type UtilizedTemplateNames = Record<EnumMRZScanMode, string>;
export declare enum EnumResultStatus {
    RS_SUCCESS = 0,
    RS_CANCELLED = 1,
    RS_FAILED = 2
}
export type ResultStatus = {
    code: EnumResultStatus;
    message?: string;
};
export type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">;
export interface ToolbarButton {
    id: string;
    icon: string;
    label: string;
    onClick?: () => void | Promise<void>;
    className?: string;
    isDisabled?: boolean;
    isHidden?: boolean;
}
//# sourceMappingURL=types.d.ts.map
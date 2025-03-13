export enum EnumMRZScanMode {
  Passport = "passport",
  TD1 = "td1",
  TD2 = "td2",
  PassportAndTD1 = "passportAndTd1",
  PassportAndTD2 = "passportAndTd2",
  TD1AndTD2 = "td1AndTd2",
  All = "all",
}

export enum EnumMRZDocumentType {
  Passport = "passport",
  TD1 = "td1",
  TD2 = "td2",
}

export enum EnumMRZScannerViews {
  Scanner = "scanner",
  Result = "scan-result",
}

export const DEFAULT_TEMPLATE_NAMES = {
  [EnumMRZScanMode.Passport]: "ReadPassport",
  [EnumMRZScanMode.TD1]: "ReadId-TD1",
  [EnumMRZScanMode.TD2]: "ReadId-TD2",
  [EnumMRZScanMode.PassportAndTD1]: "ReadPassportAndId-TD1",
  [EnumMRZScanMode.PassportAndTD2]: "ReadPassportAndId-TD2",
  [EnumMRZScanMode.TD1AndTD2]: "ReadId",
  [EnumMRZScanMode.All]: "ReadPassportAndId",
};

// Common types
export type UtilizedTemplateNames = Record<EnumMRZScanMode, string>;

export enum EnumResultStatus {
  RS_SUCCESS = 0,
  RS_CANCELLED = 1,
  RS_FAILED = 2,
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

export enum EnumDocumentSide {
	MRZ = "mrz", // The side of the document that contains the MRZ (primary side)
	Opposite = "opposite", // The side that contains the portrait (secondary side, only applicable when MRZ and portrait are on different sides)
}

export enum EnumMRZDocumentType {
	Passport = "td3_passport",
	TD1 = "td1_id",
	TD2 = "td2_id",
	MRVA = "mrva_visa",
	MRVB = "mrvb_visa",
}

export enum EnumMRZScanMode {
	TD3 = "td3",
	TD1 = "td1",
	TD2 = "td2",
	MRVA = "mrva",
	MRVB = "mrvb",
	TD1AndTD2 = "td1AndTd2",
	MRVAAndMRVB = "mrvaAndMrvb",
	PassportAndTD1 = "passportAndTd1",
	PassportAndTD2 = "passportAndTd2",
	All = "all",
}

export enum EnumMRZScannerViews {
	Scanner = "scanner",
	Result = "scan-result",
}

export const DEFAULT_TEMPLATE_NAMES = {
	[EnumMRZScanMode.TD3]: "ReadPassport",
	[EnumMRZScanMode.TD1]: "ReadId-TD1",
	[EnumMRZScanMode.TD2]: "ReadId-TD2",
	[EnumMRZScanMode.MRVA]: "ReadVisa-MRVA",
	[EnumMRZScanMode.MRVB]: "ReadVisa-MRVB",
	[EnumMRZScanMode.TD1AndTD2]: "ReadId",
	[EnumMRZScanMode.MRVAAndMRVB]: "ReadVisa",
	[EnumMRZScanMode.PassportAndTD1]: "ReadPassportAndId-TD1",
	[EnumMRZScanMode.PassportAndTD2]: "ReadPassportAndId-TD2",
	[EnumMRZScanMode.All]: "ReadAll",
};

export type TemplatePair = {
	full: string;
	mrzOnly: string;
};

export type UtilizedTemplateNames = Record<EnumMRZScanMode, string | TemplatePair>;

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

import MRZScanner from "../MRZScanner";
import MRZScannerView from "../views/MRZScannerView";
import {
	MRZDataLabel,
	EnumMRZData,
	MRZResult,
	MRZData,
	MRZDate,
	displayMRZDate,
} from "../views/utils/MRZParser";
import {
	EnumMRZScanMode,
	EnumMRZScannerViews,
	EnumDocumentSide,
	EnumMRZDocumentType,
	DEFAULT_TEMPLATE_NAMES,
	EnumResultStatus,
	UtilizedTemplateNames,
	ResultStatus,
	ToolbarButtonConfig,
	ToolbarButton,
} from "../views/utils/types";

export const DynamsoftMRZScanner = {
	MRZScanner,
	MRZScannerView,
};

export type { MRZScannerConfig } from "../MRZScanner";
export type { MRZScannerViewConfig } from "../views/MRZScannerView";
export type { MRZImage } from "../views/utils/ImageProcessingHelper";
export type {
	MRZResult,
	MRZData,
	MRZDate,
	UtilizedTemplateNames,
	ResultStatus,
	ToolbarButtonConfig,
	ToolbarButton,
};

export {
	MRZScanner,
	MRZScannerView,
	MRZDataLabel,
	EnumMRZData,
	displayMRZDate,
	EnumMRZScanMode,
	EnumMRZScannerViews,
	EnumDocumentSide,
	EnumMRZDocumentType,
	DEFAULT_TEMPLATE_NAMES,
	EnumResultStatus,
};
export default DynamsoftMRZScanner;

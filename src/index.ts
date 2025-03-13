import MRZScanner from "./MRZScanner";
import MRZResultView from "./views/MRZResultView";
import MRZScannerView from "./views/MRZScannerView";
import { MRZDataLabel, EnumMRZData, MRZResult, MRZData, MRZDate, displayMRZDate } from "./views/utils/MRZParser";
import {
  EnumMRZScanMode,
  EnumMRZDocumentType,
  EnumMRZScannerViews,
  DEFAULT_TEMPLATE_NAMES,
  EnumResultStatus,
  UtilizedTemplateNames,
  ResultStatus,
  ToolbarButtonConfig,
  ToolbarButton,
} from "./views/utils/types";

export const DynamsoftMRZScanner = {
  MRZScanner,
  MRZScannerView,
  MRZResultView,
};

export type { MRZResultViewToolbarButtonsConfig, MRZResultViewConfig } from "./views/MRZResultView";
export type { MRZScannerViewConfig } from "./views/MRZScannerView";
export type { MRZResult, MRZData, MRZDate, UtilizedTemplateNames, ResultStatus, ToolbarButtonConfig, ToolbarButton };

export {
  MRZScanner,
  MRZScannerView,
  MRZResultView,
  MRZDataLabel,
  EnumMRZData,
  displayMRZDate,
  EnumMRZScanMode,
  EnumMRZDocumentType,
  EnumMRZScannerViews,
  DEFAULT_TEMPLATE_NAMES,
  EnumResultStatus,
};
export default DynamsoftMRZScanner;

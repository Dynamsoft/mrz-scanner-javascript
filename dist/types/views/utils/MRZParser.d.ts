import { DSImageData, ParsedResultItem } from "dynamsoft-capture-vision-bundle";
import { ResultStatus } from "./types";
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
    DateOfExpiry = "dateOfExpiry"
}
export interface MRZResult {
    status: ResultStatus;
    originalImageResult?: DSImageData;
    data?: MRZData;
    imageData?: boolean;
    _imageData?: DSImageData;
}
export interface MRZData {
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
export interface MRZDate {
    year: number;
    month: number;
    day: number;
}
export declare const MRZDataLabel: Record<EnumMRZData, string> & Record<string, string>;
export declare function displayMRZDate(date: MRZDate): string;
export declare function processMRZData(mrzText: string, parsedResult: ParsedResultItem): MRZData | null;
//# sourceMappingURL=MRZParser.d.ts.map
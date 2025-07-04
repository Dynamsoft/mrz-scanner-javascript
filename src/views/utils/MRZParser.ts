import { DSImageData, EnumValidationStatus, ParsedResultItem } from "dynamsoft-capture-vision-bundle";
import { EnumMRZDocumentType, ResultStatus } from "./types";
import { capitalize } from ".";

// TODO change to EnumMRZDataFields
export enum EnumMRZData {
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
}

export interface MRZResult {
  status: ResultStatus;
  originalImageResult?: DSImageData;
  data?: MRZData;

  // Used for MWC
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

export const MRZDataLabel: Record<EnumMRZData, string> = {
  // Not showing Invalid Fields
  [EnumMRZData.InvalidFields]: "Invalid Fields",
  [EnumMRZData.DocumentType]: "Document Type",
  [EnumMRZData.DocumentNumber]: "Document Number",
  [EnumMRZData.MRZText]: "MRZ Text",
  [EnumMRZData.FirstName]: "Given Name(s)",
  [EnumMRZData.LastName]: "Surname",
  [EnumMRZData.Age]: "Age",
  [EnumMRZData.Sex]: "Sex",
  [EnumMRZData.IssuingState]: "Issuing State",
  [EnumMRZData.IssuingStateRaw]: "Issuing State (Raw Value)",
  [EnumMRZData.Nationality]: "Nationality",
  [EnumMRZData.NationalityRaw]: "Nationality State (Raw Value)",
  [EnumMRZData.DateOfBirth]: "Date Of Birth (YYYY-MM-DD)",
  [EnumMRZData.DateOfExpiry]: "Date Of Expiry (YYYY-MM-DD)",
};

function calculateAge(birthDate: MRZDate): number {
  const now = new Date();
  const hasBirthdayOccurred =
    now.getMonth() + 1 > birthDate.month || (now.getMonth() + 1 === birthDate.month && now.getDate() >= birthDate.day);

  return now.getFullYear() - birthDate.year - (hasBirthdayOccurred ? 0 : 1);
}

function parseMRZDate(year: string, month: string, day: string, isExpiry: boolean = false): MRZDate {
  const intYear = parseInt(year, 10);
  let fullYear: number;

  if (isExpiry) {
    // For expiry dates - use fixed cutoff at 60
    fullYear = intYear >= 60 ? 1900 + intYear : 2000 + intYear;
  } else {
    // For birth dates - compare with current year's last two digits
    const currentYearLastTwoDigits = new Date().getFullYear() % 100;
    fullYear = intYear > currentYearLastTwoDigits ? 1900 + intYear : 2000 + intYear;
  }

  return {
    year: fullYear,
    month: parseInt(month, 10),
    day: parseInt(day, 10),
  };
}

export function displayMRZDate(date: MRZDate) {
  const twoDigit = (num: number) => (`${num}`?.length === 1 ? `0${num}` : num);
  return `${date?.year}-${twoDigit(date?.month)}${date?.day && `-${twoDigit(date?.day)}`}`;
}

// Reference: https://www.dynamsoft.com/code-parser/docs/core/code-types/mrtd.html?lang=javascript
function mapDocumentType(codeType: string): EnumMRZDocumentType {
  switch (codeType) {
    case "MRTD_TD1_ID":
      return EnumMRZDocumentType.TD1;

    case "MRTD_TD2_ID":
    case "MRTD_TD2_VISA":
    case "MRTD_TD2_FRENCH_ID":
      return EnumMRZDocumentType.TD2;

    case "MRTD_TD3_PASSPORT":
    case "MRTD_TD3_VISA":
      return EnumMRZDocumentType.Passport;

    default:
      throw new Error(`Unknown document type: ${codeType}`);
  }
}
function documentTypeLabel(codeType: string): string {
  switch (codeType) {
    case "MRTD_TD1_ID":
      return "ID (TD1)";

    case "MRTD_TD2_ID":
      return "ID (TD2)";
    case "MRTD_TD2_VISA":
      return "ID (VISA)";
    case "MRTD_TD2_FRENCH_ID":
      return "French ID (TD2)";

    case "MRTD_TD3_PASSPORT":
      return "Passport (TD3)";
    case "MRTD_TD3_VISA":
      return "Visa (TD3)";

    default:
      throw new Error(`Unknown document type: ${codeType}`);
  }
}

function processRawCountryCodes(result: string) {
  // As of DCV 2.6.1000, there's a bug with DCP (Dynamsoft Code Parser) where German nationality and issuing state is noted as `D<<`
  return result === "D<<" ? "D" : result;
}

export function processMRZData(mrzText: string, parsedResult: ParsedResultItem): MRZData | null {
  const invalidFields: EnumMRZData[] = [];

  const isFieldInvalid = (fieldName: string): boolean => {
    const status = parsedResult.getFieldValidationStatus(fieldName);
    const isInvalid = status === EnumValidationStatus.VS_FAILED;

    return isInvalid;
  };

  // Document Type and Name
  const codeType = parsedResult.codeType;
  const documentType = mapDocumentType(codeType);
  const docTypeLabel = documentTypeLabel(codeType);
  // TODO Instead of Passport for TD3, check for visa..

  const documentNumberField =
    documentType === EnumMRZDocumentType.Passport && codeType === "MRTD_TD3_PASSPORT"
      ? "passportNumber"
      : "documentNumber";

  // Date
  const dateOfBirth = parseMRZDate(
    parsedResult.getFieldValue("birthYear"),
    parsedResult.getFieldValue("birthMonth"),
    parsedResult.getFieldValue("birthDay")
  );

  const dateOfExpiry = parseMRZDate(
    parsedResult.getFieldValue("expiryYear"),
    parsedResult.getFieldValue("expiryMonth"),
    parsedResult.getFieldValue("expiryDay"),
    true
  );

  ["birthYear", "birthMonth", "birthDay"].forEach((dateFields) => {
    if (isFieldInvalid(dateFields)) {
      invalidFields.push(EnumMRZData.DateOfBirth);
    }
  });

  ["expiryYear", "expiryMonth", "expiryDay"].forEach((dateFields) => {
    if (isFieldInvalid(dateFields)) {
      invalidFields.push(EnumMRZData.DateOfExpiry);
    }
  });

  const fields = {
    [EnumMRZData.LastName]: parsedResult.getFieldValue("primaryIdentifier"),
    [EnumMRZData.FirstName]: parsedResult.getFieldValue("secondaryIdentifier"),
    [EnumMRZData.Nationality]: parsedResult.getFieldValue("nationality"),
    [EnumMRZData.NationalityRaw]: processRawCountryCodes(parsedResult.getFieldRawValue("nationality")),
    [EnumMRZData.DocumentNumber]:
      parsedResult.getFieldValue(documentNumberField) || parsedResult.getFieldValue("longDocumentNumber"),
    [EnumMRZData.IssuingState]: parsedResult.getFieldValue("issuingState"),
    [EnumMRZData.IssuingStateRaw]: processRawCountryCodes(parsedResult.getFieldRawValue("issuingState")),
    [EnumMRZData.Sex]: capitalize(parsedResult.getFieldValue("sex")),
  };

  Object.keys(fields).forEach((key) => {
    let invalid = false;
    switch (key) {
      case EnumMRZData.FirstName:
        invalid = isFieldInvalid("secondaryIdentifier");
        break;
      case EnumMRZData.LastName:
        invalid = isFieldInvalid("primaryIdentifier");

        break;
      case EnumMRZData.DocumentNumber:
        invalid = isFieldInvalid(documentNumberField) || isFieldInvalid("longDocumentNumber");

        break;
      default:
        invalid = isFieldInvalid(key);
    }
    if (invalid) {
      invalidFields.push(key as EnumMRZData);
    }
  });

  const age = calculateAge(dateOfBirth);
  if (age < 1) invalidFields.push(EnumMRZData.Age);

  const mrzData: MRZData = {
    [EnumMRZData.InvalidFields]: invalidFields,
    [EnumMRZData.FirstName]: fields[EnumMRZData.FirstName],
    [EnumMRZData.LastName]: fields[EnumMRZData.LastName],
    [EnumMRZData.Age]: age,
    [EnumMRZData.DateOfBirth]: dateOfBirth,
    [EnumMRZData.Sex]: fields[EnumMRZData.Sex],
    [EnumMRZData.Nationality]: fields[EnumMRZData.Nationality],
    [EnumMRZData.NationalityRaw]: fields[EnumMRZData.NationalityRaw],
    [EnumMRZData.DocumentNumber]: fields[EnumMRZData.DocumentNumber],
    [EnumMRZData.DateOfExpiry]: dateOfExpiry,
    [EnumMRZData.IssuingState]: fields[EnumMRZData.IssuingState],
    [EnumMRZData.IssuingStateRaw]: fields[EnumMRZData.IssuingStateRaw],
    [EnumMRZData.DocumentType]: capitalize(docTypeLabel),
    [EnumMRZData.MRZText]: mrzText,
  };

  return mrzData;
}

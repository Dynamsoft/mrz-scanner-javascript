/**
 * Creates a pending promise. Used to keep track of library loading progress
 *
 * @returns {Object} An object containing the promise, resolve, and reject functions.
 */
export function createPendingPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Extracts and returns document fields from the parsed MRZ result
 *
 * @param {Object} result - The parsed result object containing document fields.
 * @returns {Object} An object with key-value pairs of the extracted fields.
 */
export function extractDocumentFields(result) {
  if (!result || result.exception) {
    return {};
  }

  const fieldWithStatus = (fieldName) => ({
    text: result.getFieldValue(fieldName),
    status: result.getFieldValidationStatus(fieldName),
  });

  const parseDate = (yearField, monthField, dayField) => {
    const year = result.getFieldValue(yearField);
    const currentYear = new Date().getFullYear() % 100;
    const baseYear =
      yearField === "expiryYear" ? (parseInt(year) >= 60 ? "19" : "20") : parseInt(year) > currentYear ? "19" : "20";

    return {
      text: `${baseYear}${year}-${result.getFieldValue(monthField)}-${result.getFieldValue(dayField)}`,
      status: [yearField, monthField, dayField].every(
        (field) => result.getFieldValidationStatus(field) === Dynamsoft.DCP.EnumValidationStatus.VS_SUCCEEDED
      )
        ? Dynamsoft.DCP.EnumValidationStatus.VS_SUCCEEDED
        : Dynamsoft.DCP.EnumValidationStatus.VS_FAILED,
    };
  };

  const getDocumentNumber = (documentType) => {
    const primaryField = documentType === "P" ? "passportNumber" : "documentNumber";
    const primaryNumber = fieldWithStatus(primaryField);
    const longNumber = fieldWithStatus("longDocumentNumber");

    return primaryNumber?.text ? primaryNumber : longNumber;
  };

  const documentType = result.getFieldValue("documentCode");

  return {
    Surname: fieldWithStatus("primaryIdentifier"),
    "Given Name": fieldWithStatus("secondaryIdentifier"),
    Nationality: fieldWithStatus("nationality"),
    "Document Number": getDocumentNumber(documentType),
    "Issuing State": fieldWithStatus("issuingState"),
    Sex: fieldWithStatus("sex"),
    "Date of Birth (YYYY-MM-DD)": parseDate("birthYear", "birthMonth", "birthDay"),
    "Date of Expiry (YYYY-MM-DD)": parseDate("expiryYear", "expiryMonth", "expiryDay"),
    "Document Type": JSON.parse(result.jsonString).CodeType,
  };
}

/**
 * Create an HTML paragraph element containing the document field name and value.
 *
 * @param {string} field - The document field name.
 * @param {string} value - The document field value.
 * @returns {HTMLElement} The paragraph element containing the formatted document field name and value.
 */
export function resultToHTMLElement(field, value) {
  const p = document.createElement("p");
  p.className = "parsed-filed";
  const spanFieldName = document.createElement("span");
  spanFieldName.className = "field-name";
  const spanValue = document.createElement("span");
  spanValue.className = "field-value";
  const statusIcon = document.createElement("span");
  statusIcon.className = "status-icon";

  // Define success and failed icons
  const icons = {
    success: `<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>`,
    failed: `<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>`,
  };

  // Handle validation status based on EnumValidationStatus
  switch (value?.status) {
    case Dynamsoft.DCP.EnumValidationStatus.VS_SUCCEEDED:
      statusIcon.innerHTML = icons.success;
      statusIcon.className += " status-success";
      statusIcon.title = "Validation passed";
      break;
    case Dynamsoft.DCP.EnumValidationStatus.VS_FAILED:
      statusIcon.innerHTML = icons.failed;
      statusIcon.className += " status-failed";
      statusIcon.title = "Validation failed";
      break;
    case Dynamsoft.DCP.EnumValidationStatus.VS_NONE:
    default:
      // Don't add any icon for VS_NONE
      statusIcon.style.display = "none";
      break;
  }

  spanFieldName.innerText = `${field}`;
  spanFieldName.append(statusIcon);
  spanValue.innerText = `${value?.text || value || "Not detected"}`;

  p.appendChild(spanFieldName);
  p.appendChild(spanValue);

  return p;
}

/**
 * Checks and returns the current screen orientation.
 *
 * @returns {string} The current screen orientation ('portrait' or 'landscape').
 */
export function checkOrientation() {
  if (window.matchMedia("(orientation: portrait)").matches) {
    return "portrait";
  } else if (window.matchMedia("(orientation: landscape)").matches) {
    return "landscape";
  }
}

export function getVisibleRegionOfVideo() {
  if (!cameraView || !cameraView.getVideoElement()) return;
  const video = cameraView.getVideoElement();
  const { videoWidth, videoHeight } = video;
  const objectFit = cameraView.getVideoFit();

  // Adjust dimensions based on orientation
  const isPortrait = checkOrientation() === "portrait";
  const width = isPortrait ? Math.min(videoWidth, videoHeight) : Math.max(videoWidth, videoHeight);
  const height = isPortrait ? Math.max(videoWidth, videoHeight) : Math.min(videoWidth, videoHeight);

  // Get the CSS dimensions of the video element
  const { width: videoCSSWidth, height: videoCSSHeight } = cameraView._innerComponent.getBoundingClientRect();
  if (videoCSSWidth <= 0 || videoCSSHeight <= 0) {
    throw new Error(`Unable to get video dimensions. Video may not be rendered on the page.`);
  }

  const videoCSSWHRatio = videoCSSWidth / videoCSSHeight,
    videoWHRatio = width / height;
  let cssScaleRatio;

  // Set visible region in pixels
  const regionInPixels = {
    x: 0,
    y: 0,
    width: width,
    height: height,
    isMeasuredInPercentage: false,
  };

  if (objectFit === "cover") {
    if (videoCSSWHRatio < videoWHRatio) {
      // a part of length is invisible
      cssScaleRatio = videoCSSHeight / height;
      regionInPixels.x = Math.floor((width - videoCSSWidth / cssScaleRatio) / 2);
      regionInPixels.y = 0;
      regionInPixels.width = Math.ceil(videoCSSWidth / cssScaleRatio);
      regionInPixels.height = height;
    } else {
      // a part of height is invisible
      cssScaleRatio = videoCSSWidth / width;
      regionInPixels.x = 0;
      regionInPixels.y = Math.floor((height - videoCSSHeight / cssScaleRatio) / 2);
      regionInPixels.width = width;
      regionInPixels.height = Math.ceil(videoCSSHeight / cssScaleRatio);
    }
  }
  return regionInPixels;
}

/** Check if current resolution is Full HD or HD
 * @params {Object} currentResolution - an object with `width` and `height` to represent the current resolution of the camera
 * @returns {string} Either "HD" or "Full HD" depending of the resolution of the screen
 */
export const judgeCurResolution = (currentResolution) => {
  const width = currentResolution?.width ?? 0;
  const height = currentResolution?.height ?? 0;
  const minValue = Math.min(width, height);
  const maxValue = Math.max(width, height);
  if (minValue >= 480 && minValue <= 960 && maxValue >= 960 && maxValue <= 1440) {
    return "HD";
  } else if (minValue >= 900 && minValue <= 1440 && maxValue >= 1400 && maxValue <= 2160) {
    return "Full HD";
  }
};

/**
 * Checks if we should show the switch scan mode buttons
 * @returns true if cameraEnhancer is open, false otherwise
 */
export function shouldShowScanModeContainer() {
  const isHomepageClosed = homePage.style.display === "none";
  const isResultClosed = resultContainer.style.display === "none" || resultContainer.style.display === "";
  scanModeContainer.style.display = isHomepageClosed && isResultClosed ? "flex" : "none";
}

/** Show notification banner to users
 * @params {string} message - noficiation message
 * @params {string} className - CSS class name to show notification status
 */
export function showNotification(message, className) {
  notification.className = className;
  notification.innerText = message;
  notification.style.display = "block";
  notification.style.opacity = 1;
  setTimeout(() => {
    notification.style.opacity = 0;
    notification.style.display = "none";
  }, 2000);
}

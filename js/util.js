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
  const parseResultInfo = {};
  if (!result.exception) {
    const type = result.getFieldValue("documentCode");
    const documentType = JSON.parse(result.jsonString).CodeType;
    const birthYear = result.getFieldValue("birthYear");
    const birthYearBase = parseInt(birthYear) > new Date().getFullYear() % 100 ? "19" : "20";
    const fullBirthYear = `${birthYearBase}${birthYear}`;

    const expiryYear = result.getFieldValue("expiryYear");
    const expiryYearBase = parseInt(expiryYear) >= 60 ? "19" : "20";
    const fullExpiryYear = `${expiryYearBase}${expiryYear}`;

    parseResultInfo["Document Type"] = documentType;
    parseResultInfo["Issuing State"] = result.getFieldValue("issuingState");
    parseResultInfo["Surname"] = result.getFieldValue("primaryIdentifier");
    parseResultInfo["Given Name"] = result.getFieldValue("secondaryIdentifier");
    parseResultInfo["Document Number"] =
      type === "P" ? result.getFieldValue("passportNumber") : result.getFieldValue("documentNumber");
    parseResultInfo["Nationality"] = result.getFieldValue("nationality");
    parseResultInfo["Sex"] = result.getFieldValue("sex");
    parseResultInfo["Date of Birth (YYYY-MM-DD)"] =
      fullBirthYear + "-" + result.getFieldValue("birthMonth") + "-" + result.getFieldValue("birthDay");
    parseResultInfo["Date of Expiry (YYYY-MM-DD)"] =
      fullExpiryYear + "-" + result.getFieldValue("expiryMonth") + "-" + result.getFieldValue("expiryDay");
  }
  return parseResultInfo;
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

  spanFieldName.innerText = `${field} : `;
  spanValue.innerText = `${value || "Not detected"}`;

  p.appendChild(spanFieldName);
  p.appendChild(spanValue);

  return p;
}

/**
 * Formats a Machine Readable Zone (MRZ) string by adding line breaks based on its length.
 *
 * @param {string} [mrzString=""] - The MRZ string to format.
 * @returns {string} The formatted MRZ string with appropriate line breaks or the original string
 */
export function formatMRZ(mrzString = "") {
  let formattedMRZ = mrzString;

  // Check if the length matches any known MRZ format
  if (mrzString.length === 88) {
    // Passport (TD3 format)
    formattedMRZ = mrzString.slice(0, 44) + "\n" + mrzString.slice(44);
  } else if (mrzString.length === 90) {
    // ID card (TD1 format)
    formattedMRZ = mrzString.slice(0, 30) + "\n" + mrzString.slice(30, 60) + "\n" + mrzString.slice(60);
  } else if (mrzString.length === 72) {
    // Visa (TD2 format)
    formattedMRZ = mrzString.slice(0, 36) + "\n" + mrzString.slice(36);
  }

  return formattedMRZ;
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

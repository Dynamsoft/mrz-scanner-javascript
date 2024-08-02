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

/* Extracts and returns document fields from the parsed MRZ result
 *
 * @param {Object} result - The parsed result object containing document fields.
 * @returns {Object} An object with key-value pairs of the extracted fields.
 */
export function extractDocumentFields(result) {
  const parseResultInfo = {};
  if (!result.exception) {
    const birthYear = result.getFieldValue("birthYear");
    const birthYearBase = parseInt(birthYear) > new Date().getFullYear() % 100 ? "19" : "20";
    const fullBirthYear = `${birthYearBase}${birthYear}`;
    const age = isNaN(parseInt(fullBirthYear)) ? undefined : new Date().getUTCFullYear() - parseInt(fullBirthYear);

    const expiryYear = result.getFieldValue("expiryYear");
    const expiryYearBase = parseInt(expiryYear) >= 60 ? "19" : "20";
    const fullExpiryYear = `${expiryYearBase}${expiryYear}`;

    parseResultInfo["Name"] = result.getFieldValue("name");
    parseResultInfo["Sex"] = result.getFieldValue("sex");
    parseResultInfo["Age"] = age;
    parseResultInfo["Document Number"] = result.getFieldValue("passportNumber");
    parseResultInfo["Issuing State"] = result.getFieldValue("issuingState");
    parseResultInfo["Nationality"] = result.getFieldValue("nationality");
    parseResultInfo["Date of Birth (YYYY-MM-DD)"] =
      fullBirthYear + "-" + result.getFieldValue("birthMonth") + "-" + result.getFieldValue("birthDay");
    parseResultInfo["Date of Expiry (YYYY-MM-DD)"] =
      fullExpiryYear + "-" + result.getFieldValue("expiryMonth") + "-" + result.getFieldValue("expiryDay");
    parseResultInfo["Personal Number"] = result.getFieldValue("personalNumber");
    parseResultInfo["Primary Identifier(s)"] = result.getFieldValue("primaryIdentifier");
    parseResultInfo["Secondary Identifier(s)"] = result.getFieldValue("secondaryIdentifier");
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

export function createPendingPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export function getNeedShowFields(result) {
  const parseResultInfo = {};
  if (!result.exception) {
    let name = result.getFieldValue("name");
    parseResultInfo['Name'] = name;

    let gender = result.getFieldValue("sex");
    parseResultInfo["Gender"] = gender;

    let birthYear = result.getFieldValue("birthYear");
    let birthMonth = result.getFieldValue("birthMonth");
    let birthDay = result.getFieldValue("birthDay");
    if (parseInt(birthYear) > (new Date().getFullYear() % 100)) {
      birthYear = "19" + birthYear;
    } else {
      birthYear = "20" + birthYear;
    }
    if(isNaN(parseInt(birthYear))) {
      parseResultInfo["Age"] = undefined;
    } else {
      let age = new Date().getUTCFullYear() - parseInt(birthYear);
      parseResultInfo["Age"] = age;
    }
    let documentNumber = result.getFieldValue("passportNumber");
    parseResultInfo['Document Number'] = documentNumber;

    let issuingState = result.getFieldValue("issuingState");
    parseResultInfo['Issuing State'] = issuingState;

    let nationality = result.getFieldValue("nationality");
    parseResultInfo['Nationality'] = nationality;

    parseResultInfo['Date of Birth (YYYY-MM-DD)'] = birthYear + "-" + birthMonth + "-" + birthDay;

    let expiryYear = result.getFieldValue("expiryYear");
    let expiryMonth = result.getFieldValue("expiryMonth");
    let expiryDay = result.getFieldValue("expiryDay");
    if (parseInt(expiryYear) >= 60) {
      expiryYear = "19" + expiryYear;
    } else {
      expiryYear = "20" + expiryYear;
    }
    parseResultInfo["Date of Expiry (YYYY-MM-DD)"] = expiryYear + "-" + expiryMonth + "-" + expiryDay;

    let personalNumber = result.getFieldValue("personalNumber");
    parseResultInfo["Personal Number"] = personalNumber;

    let primaryIdentifier = result.getFieldValue("primaryIdentifier");
    parseResultInfo["Primary Identifier(s)"] = primaryIdentifier;

    let secondaryIdentifier = result.getFieldValue("secondaryIdentifier");
    parseResultInfo["Secondary Identifier(s)"] = secondaryIdentifier;
  }
  return parseResultInfo;
}

export function checkOrientation() {
  if (window.matchMedia("(orientation: portrait)").matches) {
    return 'portrait';
  } else if (window.matchMedia("(orientation: landscape)").matches) {
    return 'landscape';
  }
}

export function getVisibleRegionOfVideo() {
  if(!cameraView || !cameraView.getVideoElement()) return;
  const video = cameraView.getVideoElement();
  let width = video.videoWidth;
  let height = video.videoHeight;
  let objectFit = cameraView.getVideoFit();

  const isPortrait = checkOrientation() === "portrait";
  let _width = width;
  let _height = height;
  if (isPortrait) {
    _width = Math.min(width, height);
    _height = Math.max(width, height);
  } else {
    _width = Math.max(width, height);
    _height = Math.min(width, height);
  }
  width = _width;
  height = _height;

  const { width: videoCSSWidth, height: videoCSSHeight } =
    cameraView._innerComponent.getBoundingClientRect();
  if (videoCSSWidth <= 0 || videoCSSHeight <= 0) {
    throw new Error(
      `Unable to get video dimensions. Video may not be rendered on the page.`
    );
  }

  const videoCSSWHRatio = videoCSSWidth / videoCSSHeight,
    videoWHRatio = width / height;
  let cssScaleRatio;
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
      regionInPixels.x = Math.floor(
        (width - videoCSSWidth / cssScaleRatio) / 2
      );
      regionInPixels.y = 0;
      regionInPixels.width = Math.ceil(videoCSSWidth / cssScaleRatio);
      regionInPixels.height = height;
    } else {
      // a part of height is invisible
      cssScaleRatio = videoCSSWidth / width;
      regionInPixels.x = 0;
      regionInPixels.y = Math.floor(
        (height - videoCSSHeight / cssScaleRatio) / 2
      );
      regionInPixels.width = width;
      regionInPixels.height = Math.ceil(videoCSSHeight / cssScaleRatio);
    }
  }
  return regionInPixels;
}
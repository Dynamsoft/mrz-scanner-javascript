import { createPendingPromise, extractDocumentFields, resultToHTMLElement } from "./util.js";

// Promise variable used to control model loading state
let pDataLoad = createPendingPromise();

/** LICENSE ALERT - README
 * To use the library, you need to first specify a license key using the API "initLicense" as shown below.
 */
Dynamsoft.License.LicenseManager.initLicense("DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9");
/**
 * You can visit https://www.dynamsoft.com/customer/license/trialLicense/?product=cvs&utm_source=docs&package=js to get your own trial license good for 30 days.
 * Note that if you downloaded this sample from Dynamsoft while logged in, the above license key may already be your own 30-day trial license.
 * For more information, see https://www.dynamsoft.com/label-recognition/programming/javascript/user-guide.html?ver=latest#specify-the-license or contact support@dynamsoft.com.
 * LICENSE ALERT - THE END
 */

Dynamsoft.DLR.LabelRecognizerModule.onDataLoadProgressChanged = (modelPath, tag, progress) => {
  if (tag === "completed") {
    pDataLoad.resolve();
  }
};

/**
 * Preloads the resources
 */
Dynamsoft.Core.CoreModule.loadWasm(["DLR", "DCP"]);
Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD3_PASSPORT");
Dynamsoft.DLR.LabelRecognizerModule.loadRecognitionData("MRZ");

/**
 * Creates a CameraEnhancer instance as the image source
 */
async function initDCE() {
  cameraView = await Dynamsoft.DCE.CameraView.createInstance(cameraViewContainer);
  cameraEnhancer = await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView);

  // Get the camera information of the device and render the camera list
  cameraList = await cameraEnhancer.getAllCameras();
  for (let camera of cameraList) {
    const cameraItem = document.createElement("div");
    cameraItem.className = "camera-item";
    cameraItem.innerText = camera.label;
    cameraItem.deviceId = camera.deviceId;

    cameraItem.addEventListener("click", (e) => {
      e.stopPropagation();
      for (let child of cameraListContainer.childNodes) {
        child.className = "camera-item";
      }
      cameraItem.className = "camera-item camera-selected";
      cameraEnhancer.selectCamera(camera);
      cameraSelector.click();
    });
    cameraListContainer.appendChild(cameraItem);
  }
  cameraView.setVideoFit("cover");
  await cameraEnhancer.setResolution({ width: 1920, height: 1080 });
}

/**
 * Initialize CaptureVisionRouter, CameraEnhancer, and CameraView instance
 */
let init = (async function initCVR() {
  await initDCE();
  cvRouter = await Dynamsoft.CVR.CaptureVisionRouter.createInstance();
  await cvRouter.initSettings("./template.json");
  cvRouter.setInput(cameraEnhancer);

  /* Defines the result receiver for the solution.*/
  const resultReceiver = new Dynamsoft.CVR.CapturedResultReceiver();
  resultReceiver.onCapturedResultReceived = (result) => {
    const recognizedResults = result.textLineResultItems;
    const parsedResults = result.parsedResultItems;

    if (recognizedResults?.length) {
      // Play sound feedback if enabled
      isSoundOn ? Dynamsoft.DCE.Feedback.beep() : null;

      parsedResultName.innerText = "";
      parsedResultSexAndAge.innerText = "";
      parsedResultMain.innerText = "";
      // If a parsed result is obtained, use it to render the result page
      if (parsedResults) {
        const parseResultInfo = extractDocumentFields(parsedResults[0]);
        parsedResultName.innerText = parseResultInfo["Name"] || "Name not detected";
        const sex = parseResultInfo["Sex"] || "Sex not detected";
        const age = parseResultInfo["Age"] || "Age not detected";
        parsedResultSexAndAge.innerText = sex + ", Age: " + age;

        for (let field in parseResultInfo) {
          if (["Name", "Sex", "Age"].includes(field)) continue;
          const resultElement = resultToHTMLElement(field, parseResultInfo[field]);
          parsedResultMain.appendChild(resultElement);
        }
      } else {
        alert(`Failed to parse the content.`);
        parsedResultArea.style.justifyContent = "flex-start";
      }
      // Add MRZ Text to Result
      const mrzElement = resultToHTMLElement("MRZ String", recognizedResults[0]?.text);
      mrzElement.classList.add("code");
      parsedResultMain.appendChild(mrzElement);

      resultContainer.style.display = "flex";
      cameraListContainer.style.display = "none";
      cvRouter.stopCapturing();
      cameraView.clearAllInnerDrawingItems();
    }
  };
  await cvRouter.addResultReceiver(resultReceiver);
})();

export { pDataLoad, init };

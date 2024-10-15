import { judgeCurResolution, showNotification } from "./util.js";
import { createPendingPromise, extractDocumentFields, resultToHTMLElement, formatMRZ } from "./util.js";

// Promise variable used to control model loading state
const pDataLoad = createPendingPromise();

/** LICENSE ALERT - README
 * To use the library, you need to first specify a license key using the API "initLicense" as shown below.
 */
Dynamsoft.License.LicenseManager.initLicense("DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9");
/**
 * You can visit https://www.dynamsoft.com/customer/license/trialLicense/?product=mrz&utm_source=docs&package=js to get your own trial license good for 30 days.
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
Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD1_ID");
Dynamsoft.DCP.CodeParserModule.loadSpec("MRTD_TD2_ID");
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
    for (let res of Object.keys(resolutions)) {
      const cameraItem = document.createElement("div");
      cameraItem.className = "camera-item";
      cameraItem.innerText = `${camera.label} (${res})`;
      cameraItem.deviceId = camera.deviceId;
      cameraItem.resolution = res;

      cameraItem.addEventListener("click", async (e) => {
        e.stopPropagation();
        for (let child of cameraListContainer.childNodes) {
          child.className = "camera-item";
        }
        cameraItem.className = "camera-item camera-selected";
        await cameraEnhancer.selectCamera(camera);
        await cameraEnhancer.setResolution({
          width: resolutions[res][0],
          height: resolutions[res][1],
        });

        const currentCamera = await cameraEnhancer.getSelectedCamera();
        const currentResolution = judgeCurResolution(await cameraEnhancer.getResolution());
        if (currentCamera.deviceId === camera.deviceId && currentResolution === res) {
          showNotification("Camera and resolution switched successfully!", "banner-success");
        } else if (judgeCurResolution(currentResolution) !== res) {
          showNotification(`Resolution switch failed! ${res} is not supported.`, "banner-default");

          // Update resolution to the current resolution that is supported
          for (let child of cameraListContainer.childNodes) {
            child.className = "camera-item";
            if (currentCamera.deviceId === child.deviceId && currentResolution === child.resolution) {
              child.className = "camera-item camera-selected";
            }
          }
        } else {
          showNotification(`Camera switch failed!`, "banner-error");
        }

        // Hide options after user clicks an option
        cameraSelector.click();
      });
      cameraListContainer.appendChild(cameraItem);
    }
  }
  cameraView.setVideoFit("cover");
  await cameraEnhancer.setResolution({ width: 1920, height: 1080 });
}

/**
 * Initialize CaptureVisionRouter, CameraEnhancer, and CameraView instance
 */
let init = (async () => {
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

      parsedResultArea.innerText = "";

      // Add MRZ Text to Result
      const mrzElement = resultToHTMLElement("MRZ String", formatMRZ(recognizedResults[0]?.text));
      mrzElement.classList.add("code");
      parsedResultArea.appendChild(mrzElement);

      // If a parsed result is obtained, use it to render the result page
      if (parsedResults) {
        const parseResultInfo = extractDocumentFields(parsedResults[0]);
        Object.entries(parseResultInfo).map(([field, value]) => {
          const resultElement = resultToHTMLElement(field, value);
          parsedResultArea.appendChild(resultElement);
        });
      } else {
        alert(`Failed to parse the content.`);
        parsedResultArea.style.justifyContent = "flex-start";
      }
      resultContainer.style.display = "flex";
      cameraListContainer.style.display = "none";
      informationListContainer.style.display = "none";
      scanModeContainer.style.display = "none";

      cvRouter.stopCapturing();
      cameraView.clearAllInnerDrawingItems();
    }
  };
  await cvRouter.addResultReceiver(resultReceiver);
})();

export { pDataLoad, init };

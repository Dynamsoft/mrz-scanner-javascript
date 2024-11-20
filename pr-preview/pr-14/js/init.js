import { judgeCurResolution, showNotification } from "./util.js";
import { createPendingPromise, extractDocumentFields, resultToHTMLElement } from "./util.js";

// Promise variable used to control model loading state
const pDataLoad = createPendingPromise();

/** LICENSE ALERT - README
 * To use the library, you need to first specify a license key using the API "initLicense" as shown below.
 */
Dynamsoft.License.LicenseManager.initLicense(
  "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAwLTEwMzAwNjk2NyIsIm1haW5TZXJ2ZXJVUkwiOiJodHRwczovL21sdHMuZHluYW1zb2Z0LmNvbS8iLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMCIsInNlc3Npb25QYXNzd29yZCI6IkVUSHZVNlNPV3F3ZiIsInN0YW5kYnlTZXJ2ZXJVUkwiOiJodHRwczovL3NsdHMuZHluYW1zb2Z0LmNvbS8iLCJjaGVja0NvZGUiOjM5OTMzODU2Nn0="
);
/**
 * You can visit https://www.dynamsoft.com/customer/license/trialLicense/?product=mrz&utm_source=samples&package=js to get your own trial license good for 30 days.
 * For more information, see https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/user-guide/mrz-scanner.html#specify-the-license or contact support@dynamsoft.com.
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
  resultReceiver.onCapturedResultReceived = handleCapturedResult;

  await cvRouter.addResultReceiver(resultReceiver);
})();

export const handleCapturedResult = (result, uploadedImage = null) => {
  console.log(result);
  const recognizedResults = result.textLineResultItems;
  const parsedResults = result.parsedResultItems;
  const originalImage = result.items?.[0]?.imageData;

  if (recognizedResults?.length) {
    // Play sound feedback if enabled
    isSoundOn ? Dynamsoft.DCE.Feedback.beep() : null;

    parsedResultArea.innerText = "";

    // Add MRZ Text to Result
    const mrzElement = resultToHTMLElement("MRZ String", recognizedResults[0]?.text);
    mrzElement.classList.add("code");
    parsedResultArea.appendChild(mrzElement);

    const parseSuccess = displayResults(recognizedResults[0]?.text, parsedResults?.[0]);

    if (!parseSuccess) {
      alert(`Failed to parse the content.`);
      parsedResultArea.style.justifyContent = "flex-start";
    }
    displayImage(uploadedImage || originalImage);

    dispose();
  } else if (uploadedImage) {
    parsedResultArea.innerText = "No results found";
    displayImage(uploadedImage);
    dispose();
  }
};

const displayResults = (recognizedText, parsedResult) => {
  parsedResultArea.innerText = "";

  // Display MRZ text
  const mrzElement = resultToHTMLElement("MRZ String", recognizedText);
  mrzElement.classList.add("code");
  parsedResultArea.appendChild(mrzElement);

  // Display parsed fields
  if (parsedResult) {
    const fields = extractDocumentFields(parsedResult);
    Object.entries(fields).forEach(([field, value]) => {
      parsedResultArea.appendChild(resultToHTMLElement(field, value));
    });
    return true;
  }

  return false;
};

function displayImage(image) {
  scannedImage.textContent = "";

  if (image.type?.startsWith("image/")) {
    const img = document.createElement("img");
    const imageUrl = URL.createObjectURL(image);

    img.src = imageUrl;
    img.className = "uploaded-image";

    img.onload = () => {
      URL.revokeObjectURL(imageUrl);

      scannedImage.append(img);
    };
  } else if (image.toCanvas) {
    scannedImage.append(image.toCanvas());
  }
}

function dispose() {
  resultContainer.style.display = "flex"; // Show result container
  cameraListContainer.style.display = "none"; // hide header menu windows
  informationListContainer.style.display = "none";
  scanModeContainer.style.display = "none"; // hide scan mode buttons

  cameraEnhancer.close();
  cvRouter.stopCapturing();
  cameraView.clearAllInnerDrawingItems();
}

export { pDataLoad, init };

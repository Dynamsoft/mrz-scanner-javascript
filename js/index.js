import { init, pDataLoad } from "./init.js";
import { judgeCurResolution, shouldShowScanModeContainer, showNotification } from "./util.js";
import { checkOrientation, getVisibleRegionOfVideo } from "./util.js";

async function startCapturing(mode) {
  try {
    homePage.style.display = "none";
    scannerContainer.style.display = "block";

    // Open the camera after the model and .wasm files have loaded
    pInit = pInit || (await init);
    await pDataLoad.promise;

    // Starts streaming the video
    if (cameraEnhancer.isOpen()) {
      await cvRouter.stopCapturing();
      await cameraView.clearAllInnerDrawingItems();
    } else {
      await cameraEnhancer.open();
    }

    // Highlight the selected camera in the camera list container
    const currentCamera = cameraEnhancer.getSelectedCamera();
    const currentResolution = judgeCurResolution(cameraEnhancer.getResolution());
    cameraListContainer.childNodes.forEach((child) => {
      if (currentCamera.deviceId === child.deviceId && currentResolution === child.resolution) {
        child.className = "camera-item camera-selected";
      }
    });
    cameraEnhancer.setScanRegion(region());
    cameraView.setScanRegionMaskVisible(false);

    await cvRouter.startCapturing(SCAN_TEMPLATES[mode]);

    // Show MRZ guide frame
    mrzGuideFrame.style.display = "inline-block";

    // Update button styles to show selected scan mode
    document.querySelectorAll(".scan-option-btn").forEach((button) => {
      button.classList.remove("selected");
    });
    document.querySelector(`#scan-${mode}-btn`).classList.add("selected");
    showNotification(`Scan mode switched successfully`, "banner-success");

    currentMode = mode;
    scanModeContainer.style.display = "flex";
  } catch (ex) {
    let errMsg = ex.message || ex;
    console.error(`An error occurred: ${errMsg}`);
    alert(`An error occurred: ${errMsg}`);
  }
}

SCAN_MODES.forEach((mode) =>
  document.querySelector(`#scan-${mode}-btn`).addEventListener("click", () => startCapturing(mode))
);

// -----------Logic for calculating scan region ↓------------
const regionLeft = () => {
  if (!cameraEnhancer || !cameraEnhancer.isOpen()) return 0;
  const visibleRegionInPixels = getVisibleRegionOfVideo();
  const currentResolution = cameraEnhancer.getResolution();

  const vw =
    checkOrientation() === "portrait"
      ? Math.min(currentResolution.width, currentResolution.height)
      : Math.max(currentResolution.width, currentResolution.height);
  const visibleRegionWidth = visibleRegionInPixels.width;

  let regionCssW;
  if (document.body.clientWidth > document.body.clientHeight * MRZ_GUIDEBOX_ASPECT_RATIO) {
    let regionCssH = document.body.clientHeight * 0.75;
    regionCssW = regionCssH * MRZ_GUIDEBOX_ASPECT_RATIO;
  } else {
    regionCssW = document.body.clientWidth * 0.9;
  }
  regionCssW = Math.min(regionCssW, 600);

  const regionWidthInPixel = (visibleRegionWidth / document.body.clientWidth) * regionCssW;
  const left = ((vw - regionWidthInPixel) / 2 / vw) * 100;

  return Math.round(left);
};

const regionTop = () => {
  if (!cameraEnhancer || !cameraEnhancer.isOpen()) return 0;

  const currentResolution = cameraEnhancer.getResolution();

  const vw =
    checkOrientation() === "portrait"
      ? Math.min(currentResolution.width, currentResolution.height)
      : Math.max(currentResolution.width, currentResolution.height);
  const vh =
    checkOrientation() === "portrait"
      ? Math.max(currentResolution.width, currentResolution.height)
      : Math.min(currentResolution.width, currentResolution.height);

  const regionWidthInPixel = vw - (regionLeft() * 2 * vw) / 100;
  const regionHeightInPixel = regionWidthInPixel / 4;
  const top = ((vh - regionHeightInPixel) / 2 / vh) * 100;
  return Math.round(top);
};

const region = () => {
  let region = {
    left: regionLeft(),
    right: 100 - regionLeft(),
    top: regionTop(),
    bottom: 100 - regionTop(),
    isMeasuredInPercentage: true,
  };
  return region;
};
// -----------Logic for calculating scan region ↑------------

window.addEventListener("click", () => {
  cameraListContainer.style.display = "none";
  up.style.display = "none";
  down.style.display = "inline-block";
  informationListContainer.style.display = "none";
});

// Recalculate the scan region when the window size changes
window.addEventListener("resize", () => {
  mrzGuideFrame.style.display = "none";
  timer && clearTimeout(timer);
  timer = setTimeout(() => {
    shouldShowScanModeContainer();
    mrzGuideFrame.style.display = "inline-block";
    cameraEnhancer?.setScanRegion(region());
    cameraView?.setScanRegionMaskVisible(false);
  }, 500);
});

// Add click events to buttons
startScaningBtn.addEventListener("click", () => scanBothBtn.click());
const restartVideo = async () => {
  resultContainer.style.display = "none";
  document.querySelector(`#scan-${currentMode}-btn`).click();
};
restartVideoBtn.addEventListener("click", restartVideo);

cameraSelector.addEventListener("click", (e) => {
  e.stopPropagation();
  const isShow = cameraListContainer.style.display === "block";
  cameraListContainer.style.display = isShow ? "none" : "block";
  up.style.display = !isShow ? "inline-block" : "none";
  down.style.display = isShow ? "inline-block" : "none";
});

playSoundBtn.addEventListener("click", () => {
  playSoundBtn.style.display = "none";
  closeSoundBtn.style.display = "block";
  showNotification("Sound feedback off", "banner-default");
  isSoundOn = false;
});

closeSoundBtn.addEventListener("click", () => {
  playSoundBtn.style.display = "block";
  closeSoundBtn.style.display = "none";
  showNotification("Sound feedback on", "banner-default");
  isSoundOn = true;
});

informationBtn.forEach((infoBtn) =>
  infoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isShow = informationListContainer.style.display === "block";
    informationListContainer.style.display = isShow ? "none" : "block";
  })
);

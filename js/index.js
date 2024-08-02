import { pDataLoad, init } from "./init.js";
import { checkOrientation, getVisibleRegionOfVideo } from "./util.js";

async function startCapturing() {
  try {
    await (pInit =
      pInit ||
      (async () => {
        homePage.style.display = "none";
        scannerContainer.style.display = "block";

        // Open the camera after the model and .wasm files have loaded
        await init;
        await pDataLoad.promise;

        // Starts streaming the video
        await cameraEnhancer.open();
        const currentCamera = cameraEnhancer.getSelectedCamera();
        for (let child of cameraListContainer.childNodes) {
          if (currentCamera.deviceId === child.deviceId) {
            child.className = "camera-item camera-selected";
          }
        }
        cameraEnhancer.setScanRegion(region());
        cameraView.setScanRegionMaskVisible(false);

        // Show Passport guide frame
        passportFrame.style.display = "inline-block";

        await cvRouter.startCapturing(CVR_TEMPLATE);
      })());
  } catch (ex) {
    let errMsg = ex.message || ex;
    console.error(errMsg);
    alert(errMsg);
  }
}

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
  if (document.body.clientWidth > document.body.clientHeight * PASSPORT_GUIDEBOX_ASPECT_RATIO) {
    let regionCssH = document.body.clientHeight * 0.75;
    regionCssW = regionCssH * PASSPORT_GUIDEBOX_ASPECT_RATIO;
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

const restartVideo = async () => {
  resultContainer.style.display = "none";
  await cvRouter.startCapturing(CVR_TEMPLATE);
};

window.addEventListener("click", () => {
  cameraListContainer.style.display = "none";
  up.style.display = "none";
  down.style.display = "inline-block";
});

// Recalculate the scan region when the window size changes
window.addEventListener("resize", () => {
  passportFrame.style.display = "none";
  timer && clearTimeout(timer);
  timer = setTimeout(() => {
    passportFrame.style.display = "inline-block";
    cameraEnhancer.setScanRegion(region());
    cameraView.setScanRegionMaskVisible(false);
  }, 500);
});

// Add click events to buttons
startScaningBtn.addEventListener("click", startCapturing);
restartVideoBtn.addEventListener("click", restartVideo);
resultRestartBtn.addEventListener("click", restartVideo);

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
  isSoundOn = false;
});

closeSoundBtn.addEventListener("click", () => {
  playSoundBtn.style.display = "block";
  closeSoundBtn.style.display = "none";
  isSoundOn = true;
});

import { pDataLoad, cvrReady } from "./init.js";
import { checkOrientation, getVisibleRegionOfVideo } from "./util.js"

async function startCapturing() {
  try {
    await (promiseCVRReady = promiseCVRReady || (async () => {
      homePage.style.display = "none";
      scannerContainer.style.display = "block";

      // After the model and wasm are loaded, turn on the camera
      await cvrReady;
      await pDataLoad.promise;

      // Starts streaming the video
      await cameraEnhancer.open();
      const currentCamera = cameraEnhancer.getSelectedCamera();
      for (let child of cameraListDiv.childNodes) {
        if (currentCamera.deviceId === child.deviceId) {
          child.className = "camera-item camera-selected";
        }
      }
      passportFrame.style.display = "inline-block";
      cameraEnhancer.setScanRegion(region());
      // cameraView.setScanRegionMaskStyle({
      //   lineWidth: 2,
      //   strokeStyle: "rgb(254,142,20)",
      //   fillStyle: "rgba(0,0,0,0.5)",
      // });
      cameraView.setScanRegionMaskVisible(false);
      await cvRouter.startCapturing("ReadPassport");
    })());
  } catch (ex) {
    let errMsg = ex.message || ex;
    console.error(errMsg);
    alert(errMsg);
  }
}

// -----------Logic code for calculating scan region ↓------------
const regionEdgeLength = () => {
  if (!cameraEnhancer || !cameraEnhancer.isOpen()) return 0;
  const visibleRegionInPixels = getVisibleRegionOfVideo();
  const visibleRegionWidth = visibleRegionInPixels.width;
  const visibleRegionHeight = visibleRegionInPixels.height;
  const regionEdgeLength = 0.4 * Math.min(visibleRegionWidth, visibleRegionHeight);
  return Math.round(regionEdgeLength);
};

const regionLeft = () => {
  if (!cameraEnhancer || !cameraEnhancer.isOpen()) return 0;
  const visibleRegionInPixels = getVisibleRegionOfVideo();
  const currentResolution = cameraEnhancer.getResolution();
  let vw = currentResolution.width;
  if (checkOrientation() === "portrait") {
    vw = Math.min(currentResolution.width, currentResolution.height);
  } else {
    vw = Math.max(currentResolution.width, currentResolution.height);
  }
  const visibleRegionWidth = visibleRegionInPixels.width;
  let left = 0.5 - regionEdgeLength() / vw / 2;
  let regionCssW;
  if (document.body.clientWidth > document.body.clientHeight * 6.73) {
    let regionCssH = document.body.clientHeight * 0.75;
    regionCssW = regionCssH * 6.73;
  } else {
    regionCssW = document.body.clientWidth * 0.9;
  }
  regionCssW = Math.min(regionCssW, 600);
  const regionWidthInPixel = (visibleRegionWidth / document.body.clientWidth) * regionCssW;
  left = ((vw - regionWidthInPixel) / 2 / vw) * 100;
  left = Math.round(left);
  return left;
};

const regionTop = () => {
  if (!cameraEnhancer || !cameraEnhancer.isOpen()) return 0;
  const currentResolution = cameraEnhancer.getResolution();
  let vw = currentResolution.width;
  let vh = currentResolution.height;
  if (checkOrientation() === "portrait") {
    vw = Math.min(currentResolution.width, currentResolution.height);
    vh = Math.max(currentResolution.width, currentResolution.height);
  } else {
    vw = Math.max(currentResolution.width, currentResolution.height);
    vh = Math.min(currentResolution.width, currentResolution.height);
  }
  let top = 0.5 - regionEdgeLength() / vh / 2;
  const regionWidthInPixel = vw - (regionLeft() * 2 * vw) / 100;
  const regionHeightInPixel = regionWidthInPixel / 4;
  top = ((vh - regionHeightInPixel) / 2 / vh) * 100;
  top = Math.round(top);
  return top;
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
}
// -----------Logic code for calculating scan region ↑------------

const restartVideo = async () => {
  resultContainer.style.display = "none";
  await cvRouter.startCapturing("ReadPassport");
}

window.addEventListener("click", () => {
  cameraListDiv.style.display = "none";
  up.style.display = "none";
  down.style.display = "inline-block";
})

// Recalculate the scan region when the window size changes
window.addEventListener("resize", () => {
  passportFrame.style.display = "none";
  timer && clearTimeout(timer);
  timer = setTimeout(() => {
    passportFrame.style.display = "inline-block";
    cameraEnhancer.setScanRegion(region());
    cameraView.setScanRegionMaskVisible(false);
  }, 500);
})

// Add click events to some buttons
startScaningBtn.addEventListener("click", startCapturing);
restartVideoBtn.addEventListener("click", restartVideo);
resultRestartBtn.addEventListener("click", restartVideo);

cameraSelector.addEventListener("click", (e) => {
  e.stopPropagation();
  const isShow = cameraListDiv.style.display === "block";
  cameraListDiv.style.display = isShow ? "none" : "block";
  up.style.display = !isShow ? "inline-block" : "none";
  down.style.display = isShow ? "inline-block" : "none";
})

playSoundBtn.addEventListener("click", () => {
  playSoundBtn.style.display = "none";
  closeSoundBtn.style.display = "block";
  isPlaySound = false;
})

closeSoundBtn.addEventListener("click", () => {
  playSoundBtn.style.display = "block";
  closeSoundBtn.style.display = "none";
  isPlaySound = true;
})
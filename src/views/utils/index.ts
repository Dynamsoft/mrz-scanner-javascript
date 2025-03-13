import { ToolbarButton } from "./types";

export function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === "string") {
    const el = document.querySelector(element) as HTMLElement;
    if (!el) throw new Error("Element not found");
    return el;
  }
  return element instanceof HTMLElement ? element : null;
}

const DEFAULT_CONTROLS_STYLE = `
  .dynamsoft-mrz-controls {
    display: flex;
    height: 6rem;
    background-color: #323234;
    align-items: center;
    font-size: 12px;
    font-family: Verdana;
    color: white;
    width: 100%;
  }

  .dynamsoft-mrz-control-btn {
    background-color: #323234;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 0.5rem;
    text-align: center;
    user-select: none;
  }

  .dynamsoft-mrz-control-btn.hide {
    display: none;
  }

  .dynamsoft-mrz-control-btn.disabled {
    opacity: 0.4;
    pointer-events: none;
    cursor: default;
  }

  .dynamsoft-mrz-control-icon-wrapper {
    flex: 0.75;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    min-height: 40px;
  }

  .dynamsoft-mrz-control-icon img,
  .dynamsoft-mrz-control-icon svg {
    width: 32px;
    height: 32px;
    fill: #fe8e14;
  }

  .dynamsoft-mrz-control-text {
    flex: 0.5;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-bottom: 0.5rem;
  }

  
    @media screen and (orientation: landscape) and (max-width: 1024px) and (max-height: 600px) {
    .dynamsoft-mrz-controls {
      flex-direction: column;
      height: 100%;
      width: 5rem;
    }

    .dynamsoft-mrz-control-text {
      padding: 0 0.5rem 0.5rem;
    }
  }
`;

export function createControls(buttons: ToolbarButton[], containerStyle?: Partial<CSSStyleDeclaration>): HTMLElement {
  createStyle("dynamsoft-mrz-controls-style", DEFAULT_CONTROLS_STYLE);

  // Create container
  const container = document.createElement("div");
  container.className = "dynamsoft-mrz-controls";

  // Apply custom container styles if provided
  if (containerStyle) {
    Object.assign(container.style, containerStyle);
  }

  // Create buttons
  buttons.forEach((button) => {
    const buttonEl = document.createElement("div");
    buttonEl.className = `dynamsoft-mrz-control-btn ${button?.className}`;

    // Create icon container
    const iconContainer = document.createElement("div");
    iconContainer.className = "dynamsoft-mrz-control-icon-wrapper";

    if (isSVGString(button.icon)) {
      iconContainer.innerHTML = button.icon;
    } else {
      const iconImg = document.createElement("img");
      iconImg.src = button.icon;
      iconImg.alt = button.label;
      iconImg.width = 24;
      iconImg.height = 24;
      iconContainer.appendChild(iconImg);
    }

    // Create text container
    const textContainer = document.createElement("div");
    textContainer.className = "dynamsoft-mrz-control-text";
    textContainer.textContent = button.label;

    // Add disabled state if specified
    if (button.isDisabled) {
      buttonEl.classList.add("disabled");
    }

    if (button.isHidden) {
      buttonEl.classList.add("hide");
    }

    // Append containers to button
    buttonEl.appendChild(iconContainer);
    buttonEl.appendChild(textContainer);

    if (button.onClick && !button.isDisabled) {
      buttonEl.addEventListener("click", button.onClick);
    }

    container.appendChild(buttonEl);
  });

  return container;
}

export function createStyle(id: string, style: string) {
  // Initialize styles if not already done
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.textContent = style;
    document.head.appendChild(styleSheet);
  }
}

export function isSVGString(str: string): boolean {
  return str.trim().startsWith("<svg") && str.trim().endsWith("</svg>");
}

export const isEmptyObject = (obj: object | null | undefined): boolean => {
  return !obj || Object.keys(obj).length === 0;
};

export function checkOrientation() {
  return window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
}

export function capitalize(string: String) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const STANDARD_RESOLUTIONS = {
  "4k": { width: 3840, height: 2160 },
  "2k": { width: 2560, height: 1440 },
  "1080p": { width: 1920, height: 1080 },
  "720p": { width: 1280, height: 720 },
  "480p": { width: 640, height: 480 },
} as const;

type ResolutionLevel = keyof typeof STANDARD_RESOLUTIONS;

export function findClosestResolutionLevel(selectedResolution: { width: number; height: number }): ResolutionLevel {
  // Calculate the total pixels for the input resolution
  const inputPixels = selectedResolution.width * selectedResolution.height;

  // Calculate the aspect ratio of the input resolution
  const inputAspectRatio = selectedResolution.width / selectedResolution.height;

  // Find the closest resolution by comparing total pixels and aspect ratio
  let closestLevel: ResolutionLevel = "480p";
  let smallestDifference = Number.MAX_VALUE;

  for (const [level, resolution] of Object.entries(STANDARD_RESOLUTIONS)) {
    const standardPixels = resolution.width * resolution.height;
    const standardAspectRatio = resolution.width / resolution.height;

    // Calculate differences in pixels and aspect ratio
    const pixelDifference = Math.abs(standardPixels - inputPixels);
    const aspectRatioDifference = Math.abs(standardAspectRatio - inputAspectRatio);

    // Use a weighted scoring system - pixels are more important than aspect ratio
    const totalDifference = pixelDifference * 0.7 + aspectRatioDifference * standardPixels * 0.3;

    if (totalDifference < smallestDifference) {
      smallestDifference = totalDifference;
      closestLevel = level as ResolutionLevel;
    }
  }

  return closestLevel;
}

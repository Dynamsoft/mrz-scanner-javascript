import { EnumResultStatus, ToolbarButton, ToolbarButtonConfig } from "./utils/types";
import { displayMRZDate, EnumMRZData, MRZData, MRZDataLabel, MRZDate, MRZResult } from "./utils/MRZParser";
import { MRZScanner_ICONS } from "./utils/icons";
import { createControls, createStyle, getElement, isEmptyObject } from "./utils";
import MRZScannerView from "./MRZScannerView";
import { SharedResources } from "../MRZScanner";

export interface MRZResultViewToolbarButtonsConfig {
  rescan?: ToolbarButtonConfig;
  done?: ToolbarButtonConfig;
}

export interface MRZResultViewConfig {
  container?: HTMLElement | string;
  toolbarButtonsConfig?: MRZResultViewToolbarButtonsConfig;
  showOriginalImage?: boolean; // True by default
  showMRZText?: boolean; // True by default
  allowResultEditing?: boolean; // New option to control if result fields can be edited
  onDone?: (result: MRZResult) => Promise<void>;
}

export default class MRZResultView {
  private currentScanResultViewResolver?: (result: MRZResult) => void;
  private editedFields: Partial<MRZData> = {};

  constructor(
    private resources: SharedResources,
    private config: MRZResultViewConfig,
    private scannerView: MRZScannerView
  ) {}

  async launch(): Promise<MRZResult> {
    try {
      getElement(this.config.container).textContent = "";
      await this.initialize();
      getElement(this.config.container).style.display = "flex";

      // Return promise that resolves when user clicks done
      return new Promise((resolve) => {
        this.currentScanResultViewResolver = resolve;
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      throw errMsg;
    }
  }

  private async handleRescan() {
    try {
      if (!this.scannerView) {
        console.error("Scanner View not initialized");
        return;
      }

      this.hideView();
      const result = await this.scannerView.launch();

      if (result?.status?.code === EnumResultStatus.RS_FAILED) {
        if (this.currentScanResultViewResolver) {
          this.currentScanResultViewResolver(result);
        }
        return;
      }

      // Handle success case
      if (this.resources.onResultUpdated) {
        if (result?.status.code === EnumResultStatus.RS_CANCELLED) {
          this.resources.onResultUpdated(this.resources.result);
        } else if (result?.status.code === EnumResultStatus.RS_SUCCESS) {
          this.resources.onResultUpdated(result);
        }
      }

      this.dispose(true);
      await this.initialize();
      getElement(this.config.container).style.display = "flex";
    } catch (error) {
      console.error("Error in rescan handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private async handleDone() {
    try {
      // Apply edited fields to the result
      if (this.resources.result?.data && !isEmptyObject(this.editedFields)) {
        this.resources.result.data = {
          ...this.resources.result.data,
          ...this.editedFields,
        };

        if (this.resources.onResultUpdated) {
          this.resources.onResultUpdated(this.resources.result);
        }
      }

      if (this.config?.onDone) {
        await this.config.onDone(this.resources.result);
      }

      // Resolve with current result
      if (this.currentScanResultViewResolver && this.resources.result) {
        this.currentScanResultViewResolver(this.resources.result);
      }

      // Clean up
      this.hideView();
      this.dispose();
    } catch (error) {
      console.error("Error in done handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private createControls(): HTMLElement {
    const { toolbarButtonsConfig } = this.config;

    const buttons: ToolbarButton[] = [
      {
        id: `dynamsoft-mrz-scanResult-rescan`,
        icon: toolbarButtonsConfig?.rescan?.icon || MRZScanner_ICONS.rescan,
        label: toolbarButtonsConfig?.rescan?.label || "Re-scan",
        onClick: () => this.handleRescan(),
        className: `${toolbarButtonsConfig?.rescan?.className || ""}`,
        isHidden: toolbarButtonsConfig?.rescan?.isHidden || false,
        isDisabled: !this.scannerView,
      },
      {
        id: `dynamsoft-mrz-scanResult-done`,
        icon: toolbarButtonsConfig?.done?.icon || MRZScanner_ICONS.complete,
        label: toolbarButtonsConfig?.done?.label || "Done",
        className: `${toolbarButtonsConfig?.done?.className || ""}`,
        isHidden: toolbarButtonsConfig?.done?.isHidden || false,
        onClick: () => this.handleDone(),
      },
    ];

    return createControls(buttons);
  }

  private handleFieldEdit(key: string, value: any) {
    // For date fields, we need special handling
    if (key === EnumMRZData.DateOfBirth || key === EnumMRZData.DateOfExpiry) {
      try {
        const [year, month, day] = value.split(/[\/\-\.]/);
        if (day && month && year) {
          this.editedFields[key] = {
            day: parseInt(day, 10),
            month: parseInt(month, 10),
            year: parseInt(year, 10),
          } as MRZDate;
        }
      } catch (e) {
        console.error("Error parsing date", e);
      }
    } else {
      (this.editedFields as any)[key] = value;
    }
  }

  private createMRZDataDisplay() {
    const mrzData = this.resources.result?.data || ({} as MRZData);
    const isEditingAllowed = !!this.config.allowResultEditing;
    const invalidFields = mrzData.invalidFields || [];

    const resultContainer = document.createElement("div");
    resultContainer.className = "dynamsoft-mrz-data-container";

    if (!isEmptyObject(mrzData)) {
      // If there are invalid fields and editing is allowed, add a notification
      if (invalidFields.length > 0) {
        const errorNotification = document.createElement("div");
        errorNotification.className = "dynamsoft-mrz-error-notification";
        errorNotification.innerHTML = `
          <div class="dynamsoft-mrz-error-icon">${MRZScanner_ICONS.failed}</div>
          <div class="dynamsoft-mrz-error-message">
            ${
              isEditingAllowed
                ? "Some fields require correction. Please review highlighted fields."
                : "Some fields contain invalid information. Please rescan the document."
            }
          </div>
        `;
        resultContainer.appendChild(errorNotification);
      } else if (invalidFields.length === 0 && isEditingAllowed) {
        const infoNotification = document.createElement("div");
        infoNotification.className = "dynamsoft-mrz-info-notification";
        infoNotification.innerHTML = `
          <div class="dynamsoft-mrz-info-icon">${MRZScanner_ICONS.info}</div>
          <div class="dynamsoft-mrz-info-message">
            Please review all fields to ensure the information is correct.
          </div>
        `;
        resultContainer.appendChild(infoNotification);
      }

      Object.entries(mrzData).forEach(([key, value]) => {
        if (key === EnumMRZData.InvalidFields || !value) {
          // Don't display invalidFields array
          return;
        }

        if (key === EnumMRZData.MRZText && this.config?.showMRZText === false) {
          // Don't display MRZ Text if config is set to false
          return;
        }

        const result = document.createElement("div");
        result.className = "dynamsoft-mrz-data-row";

        // Add special class for invalid fields that need attention
        const isInvalid = invalidFields.includes(key as EnumMRZData);
        if (isInvalid) {
          result.classList.add("invalid-field");
        }

        const nonEditableFields = [EnumMRZData.MRZText, EnumMRZData.DocumentType];

        const resultLabel = document.createElement("span");
        resultLabel.className = "dynamsoft-mrz-data-label";
        resultLabel.innerText = MRZDataLabel[key as EnumMRZData] || key;

        // Add validation marker for invalid fields
        if (isInvalid) {
          const invalidIcon = document.createElement("span");
          invalidIcon.className = "dynamsoft-mrz-error-icon";
          invalidIcon.innerHTML = MRZScanner_ICONS.failed;
          resultLabel.appendChild(invalidIcon);

          if (isEditingAllowed) {
            const errorHint = document.createElement("span");
            errorHint.className = "dynamsoft-mrz-error-hint";
            errorHint.textContent = "Please correct this field";
            resultLabel.appendChild(errorHint);
          }
        }

        const resultValue = document.createElement("div");
        resultValue.className = "dynamsoft-mrz-data-value";

        // Make editable only if editing is allowed and it's not mrzText
        if (isEditingAllowed && !nonEditableFields.includes(key as EnumMRZData)) {
          const inputField = document.createElement("input");
          inputField.className = "dynamsoft-mrz-data-input";

          // Add special class for invalid fields
          if (isInvalid) {
            inputField.classList.add("invalid");
          }

          if (key === EnumMRZData.DateOfBirth || key === EnumMRZData.DateOfExpiry) {
            inputField.value = displayMRZDate(value as MRZDate);
            inputField.setAttribute("placeholder", "YYYY-MM-DD");
          } else {
            inputField.value = value as string;
          }

          inputField.addEventListener("input", (e) => {
            this.handleFieldEdit(key, (e.target as HTMLInputElement).value);

            // Remove invalid styling when user starts editing
            if (isInvalid) {
              inputField.classList.remove("invalid");
              result.classList.remove("invalid-field");

              // Also remove the field from the invalidFields array in editedFields
              if (!this.editedFields.invalidFields) {
                // Copy the original invalidFields array
                this.editedFields.invalidFields = [...invalidFields];
              }

              // Remove this field from the invalidFields array
              const index = this.editedFields.invalidFields.indexOf(key as EnumMRZData);
              if (index > -1) {
                this.editedFields.invalidFields.splice(index, 1);
              }
            }
          });

          resultValue.appendChild(inputField);
        } else {
          // For read-only or MRZ text, display as text
          if (key === EnumMRZData.MRZText) {
            resultValue.classList.add("code");
            resultValue.innerText = value as string;
          } else if (key === EnumMRZData.DateOfBirth || key === EnumMRZData.DateOfExpiry) {
            resultValue.innerText = displayMRZDate(value as MRZDate);
          } else {
            resultValue.innerText = value as string;
          }

          // Add special class for invalid fields
          if (isInvalid) {
            resultValue.classList.add("invalid-value");
          }
        }

        result.appendChild(resultLabel);
        result.appendChild(resultValue);
        resultContainer.appendChild(result);
      });

      return resultContainer;
    } else {
      const empty = document.createElement("div");
      empty.className = "dynamsoft-mrz-data-row empty";
      empty.innerText = "No MRZ detected. Please try again.";

      resultContainer.appendChild(empty);
      return resultContainer;
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.resources.result) {
        throw Error("Captured image is missing. Please capture an image first!");
      }

      if (!this.config.container) {
        throw new Error("Please create a Scan Result View Container element");
      }

      createStyle("dynamsoft-mrz-result-view-style", DEFAULT_RESULT_VIEW_STYLE);

      // Create a wrapper div that preserves container dimensions
      const resultViewWrapper = document.createElement("div");
      resultViewWrapper.className = "dynamsoft-mrz-result-view-container";

      if (this.config.showOriginalImage !== false) {
        const imageResult = this.resources.result.originalImageResult;
        // Create and add scan result view image container
        const scanResultViewImageContainer = document.createElement("div");
        scanResultViewImageContainer.className = "dynamsoft-mrz-result-view-image-container";

        // Add scan result image
        let scanResultImg: any;
        if ((imageResult as any)?.toCanvas) {
          scanResultImg = (imageResult as any)?.toCanvas();
        }
        Object.assign(scanResultImg.style, {
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        });

        scanResultViewImageContainer.appendChild(scanResultImg);
        resultViewWrapper.appendChild(scanResultViewImageContainer);
      }

      const resultContainer = this.createMRZDataDisplay();
      resultViewWrapper.appendChild(resultContainer);

      // Set up controls
      const controlContainer = this.createControls();
      resultViewWrapper.appendChild(controlContainer);

      getElement(this.config.container).appendChild(resultViewWrapper);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
    }
  }

  hideView(): void {
    getElement(this.config.container).style.display = "none";
  }

  dispose(preserveResolver: boolean = false): void {
    // Clean up the container
    getElement(this.config.container).textContent = "";

    // Clear resolver only if not preserving
    if (!preserveResolver) {
      this.currentScanResultViewResolver = undefined;
    }
  }
}

const DEFAULT_RESULT_VIEW_STYLE = `
 .dynamsoft-mrz-result-view-container {
    display: flex;
    width: 100%;
    height: 100%;
    background-color:#575757;
    font-size: 12px;
    flex-direction: column;
    align-items: center;
  }

  .dynamsoft-mrz-result-view-image-container {
      width: 100%;
          height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
          background-color: #323234;
          }

    
.dynamsoft-mrz-data-container {
  font-size: 16px;
  font-family: Verdana;
  color: white;
  overflow: auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 1rem 0;
}

.dynamsoft-mrz-data-row {
  padding: 0.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.dynamsoft-mrz-data-row.invalid-field {
  background-color: rgba(231, 76, 60, 0.1);
  border-left: 3px solid #e74c3c;
  padding-left: calc(2rem - 3px);
}

.dynamsoft-mrz-data-label {
  color: #aaa;
  display: flex;
  gap: 0.5rem;
  align-items: end;
  flex-wrap: wrap;
}

.dynamsoft-mrz-error-notification,
.dynamsoft-mrz-info-notification {
  color: white;
  padding: 1rem;
  margin: 0.5rem 2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: start;
}

.dynamsoft-mrz-error-notification {
  background-color: rgba(231, 76, 60, 0.2);
}

.dynamsoft-mrz-info-notification {
  background-color: rgba(196, 231, 60, 0.2);
}

.dynamsoft-mrz-edit-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
}

.dynamsoft-mrz-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
}

.dynamsoft-mrz-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.dynamsoft-mrz-info-message,
.dynamsoft-mrz-error-message {
  flex: 1;
}

.dynamsoft-mrz-error-hint {
  font-size: 0.8rem;
  color: #e74c3c;
}

.dynamsoft-mrz-data-value {
  word-wrap: break-word;
  text-align: start;
}

.dynamsoft-mrz-data-value.code {
  font-family: monospace;
}

.dynamsoft-mrz-data-value.invalid-value {
  color: #e74c3c;
  text-decoration: wavy underline #e74c3c;
  text-decoration-skip-ink: none;
}

.dynamsoft-mrz-data-input {
  width: 100%;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.dynamsoft-mrz-data-input.invalid {
  background-color: rgba(231, 76, 60, 0.1);
  border-color: #e74c3c;
}

.dynamsoft-mrz-data-input:focus {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: #fe8e14;
  outline: none;
}

@media screen and (orientation: landscape) and (max-width: 1024px) and (max-height: 600px) {
    .dynamsoft-mrz-result-view-container {
      flex-direction: row;
    }

    .dynamsoft-mrz-result-view-image-container{
      flex: 1;
      height: 100%;
    }

    .dynamsoft-mrz-data-container{
      flex: 1;
    }

    .dynamsoft-mrz-data-row:first-of-type    {
    padding-top: 2rem;
    }

    .dynamsoft-mrz-data-row:last-of-type {
      padding-bottom: 2rem;
    }

    .dynamsoft-mrz-data-row.empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding-top: 0;
      padding-bottom: 0;
    }
}
`;

// Demo entry point — wire DOM events to the helpers exported from each
// module. The supporting modules (view, scanner, results, chrome) attach
// their own internal listeners at import time.

import { $ } from "./dom.js";
import { showLanding } from "./view.js";
import { rescan, startCameraScan, startFileUpload } from "./scanner.js";

$<HTMLButtonElement>("desktop-proceed").addEventListener("click", startCameraScan);
$<HTMLButtonElement>("startCameraScan").addEventListener("click", startCameraScan);
$<HTMLButtonElement>("uploadFile").addEventListener("click", startFileUpload);

document.querySelector<HTMLButtonElement>(".btn-rescan")!.addEventListener("click", rescan);
document.querySelector<HTMLButtonElement>(".btn-home")!.addEventListener("click", showLanding);

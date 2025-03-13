# User Guide for the MRZ Scanner for Web

This user guide will walk you through the [Hello World](https://github.com/Dynamsoft/mrz-scanner-javascript/blob/main/README.md) sample app. When creating your own application, we recommend using this sample as a reference.

To learn about what an MRZ is, along with the makeup and system requirements of this solution, please visit the [MRZ Introduction](https://www.dynamsoft.com/mrz-scanner/docs/web/introduction/index.html) page on the Dynamsoft website.

## License

### Trial License

When you are getting started with the MRZ Scanner solution, we recommend getting your own 30-day trial license through the [customer portal](https://www.dynamsoft.com/customer/license/trialLicense/?product=mrz&utm_source=guide&package=js). The trial license can be renewed via the same customer portal twice, each time for another 15 days, giving you a total of 60 days to develop your own application using the solution. If more time is needed for a full evaluation, please contact the [Dynamsoft Support Team](https://www.dynamsoft.com/company/contact/).

> Note:
>
> Please note that the **MRZ Scanner** license contains a license for the **Dynamsoft Label Recognizer**, **Dynamsoft Code Parser**, and the **Dynamsoft Camera Enhancer** as those are the three functional products that are central to the operation of the MRZ Scanner.

### Full License

If you are fully satisfied with the solution and would like to move forward with a full license, please contact the [Dynamsoft Sales Team](https://www.dynamsoft.com/company/contact/).

## Quick Start - Including the SDK and creating Hello World

As mentioned previously, the purpose of this guide is to help you implement a Hello World application using the MRZ Scanner solution. To showcase this, we will be using vanilla JS. You can find the full code in the [Github repository](https://github.com/Dynamsoft/mrz-scanner-javascript/blob/main/README.md).

The first step before you venture into writing the code is to include the SDK in your application. The simplest way to include the SDK would be to use the precompiled script - but you can also build it from source yourself.

### Building the Library from Source

In this guide, we will show the developer how to build the scanner themselves from the source files. The advantage of doing this is that it allows the developer to do some deep customization of the scanner if they are familiar with using the foundational products **Dynamsoft Label Recognizer**, **Dynamsoft Code Parser**, and the **Dynamsoft Camera Enhancer**.

Please note that we also offer a pre-compiled script reference to make the inclusion of the library even easier. To learn how to use that, please visit the full User Guide for the MRZ Scanner.

This method requires retrieving the **MRZ Scanner for Web** source files from its [Github repository](https://github.com/Dynamsoft/mrz-scanner-javascript), compiles them into a distributable package, and then runs a *ready-made* Hello World sample page that is already included in the repo.

Please follow these steps in order to build from the source:

1. Download the **MRZ Scanner for Web** source files from [Github](https://github.com/Dynamsoft/mrz-scanner-javascript) as a compressed folder ("Download ZIP" option).

2. Extract the contents of the compressed folder.

3. Open the *Hello World* sample included with the source files located at `samples/hello-world.html`

4. Search for 'YOUR_LICENSE_KEY_HERE' and replace that with your own license key, whether it is trial or full.

5. Install project dependencies - in the terminal, navigate to the project root directory and run the following:
    ```bash
    npm install
    ```

6. Build the project - once the dependencies are installed, build the project by running:
    ```bash
    npm run build
    ```

7. Serve the project via localhost:
    ```bash
    npm run serve
    ```
Once the server is running, open the application in a browser using the address provided in the terminal output after running `npm run serve`.

## Breaking down Hello World

Let's now go through the code of the Hello World sample and understand the purpose of each section and how they all work together to bring the app to life.

### Step 1: Setting up the HTML and Including the MRZ Scanner

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dynamsoft MRZ Scanner - Hello World</title>
    <script src="https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@2.0.0/dist/mrz-scanner.bundle.js"></script>
  </head>

  <body>
    <h1 style="font-size: large">Dynamsoft MRZ Scanner</h1>
  </body>

</html>
```

The first step in setting up the HTML in a Hello World implementation is to include the SDK. The ways to include the SDK has already been addressed in the [Quick Start](#quick-start---including-the-sdk-and-creating-hello-world) section, so please refer to that if you have not already. In this example, we are including the MRZ Scanner via the precompiled script as that is the easiest way to get started.

Since this is a Hello World implementation, the HTML body will be kept quite simple. Since the MRZ Scanner comes with a **Ready-to-Use UI**, it is not necessary to place any `<div>` placeholder elements or anything like. Once the scanner is launched, the **Ready-to-Use UI** will come up and occupy the page. 

<!-- The main DOM element that is required in the `<body>` is a `<div>` element where the MRZ result (or lack thereof) and the original image of the MRZ document will be displayed once the user clicks *Done* in the result view. Feel free to customize the styling of the `<div>` element to your liking. -->

Now let's move to the main script that will define the operation of the 

### Step 2: Initialize the MRZ Scanner

```js
// Initialize the Dynamsoft MRZ Scanner
const mrzscanner = new Dynamsoft.MRZScanner({
  license: "YOUR_LICENSE_KEY_HERE",
});
```

Above you will see the **simplest** way that you can initialize the MRZ Scanner. The one that is **absolutely required** in this setup is the **license**. Without a valid license, the MRZ Scanner view will not launch and you will be met with an error message explaining that the license key is invalid or has expired. To learn how to get your own license, please refer to the [License](#license) section of the guide.

### Step 3: Launching the MRZ Scanner

```js
(async () => {
  // Launch the scanner and wait for the result
  const result = await mrzscanner.launch({});
  console.log(result); 
})();
```

Now that the MRZ Scanner has been initialized and configured, it is ready to be launched! Once the MRZ Scanner is launched, the user will see the main **MRZScannerView**. Once a MRZ is scanned (via video or static image), the MRZ Scanner then switches to the **MRZResultView** to display a cropped image of the MRZ document as well as the parsed fields of the MRZ text. Let's break down these two views:

#### MRZScannerView

Here is a quick breakdown of the UI elements that make up the main view of the MRZ Scanner

1. **Camera View**: The majority of the space of the MRZScannerView is occupied by the camera view to give the user a complete picture of what is being seen by the camera.

2. **Scan Guide Frame**: By default, at the centre of the camera view you will find a frame that helps guide the user on where to place the MRZ document to get a fast and accurate result. Please note that if scan guide frame is shown, then anything outside of the frame will not be captured. This frame can be hidden via the **MRZScannerViewConfig** interface.

3. **Format Selector**: Below the scan guide frame, you will also notice a selector box that allows the user to choose which formats the MRZ Scanner should recognize. The formats that show up in the format selector are configurable via the **MRZScannerConfig** interface, while the visibility of the format selector itself is configurable via the **MRZScannerViewConfig** interface. To learn about MRZ formats, please refer to the [Introduction](https://www.dynamsoft.com/mrz-scanner/docs/web/introduction/index.html#supported-mrz-formats) page.

4. **Resolution/Camera Select Dropdown**: This dropdown allows the user to switch cameras (should they have more than one available on the device), or select a different resolution for the camera that is currently selected.

5. **Load Image Button**: When this button is clicked, the user can select a MRZ document image from the device's local storage to be recognized.

6. **Sound Button**: By toggling this on, the MRZ Scanner will play a *beep* sound to signal that the MRZ has been successfully recognized.

7. **Flash Button**: This button is responsible for toggling the flash of the camera should it have one. If the device doesn't have the flash feature or if the browser being used doesn't support flash, this flash icon will not show up.

8. **Close Scanner Button**: Clicking this button will close the MRZ Scanner and take the user back to the landing page.

#### MRZResultView

Here is a quick breakdown of the UI elements that make up the result view

1. **Original Image**: A cropped image of the MRZ document that was just scanned will be displayed at the top by default.

2. **Parsed Results**: The parsed results, along with their corresponding field names, are displayed in a form view underneath the original image. In addition to displaying these parsed results, the MRZ Scanner allows the user to edit any of the fields if they find that any of the parsed info is incorrect after cross referencing it with the info on the MRZ document.

3. **Re-take Button**: Clicking this button allows the user to go back to the **MRZScannerView** to scan another MRZ document.

4. **Done Button**: Clicking this button basically closes the scanner and destroys the **MRZScanner** instance. At that point, the application will go back to the landing page, but the developer can dictate the action to take once this button is clicked. These actions can include allowing the user to perform some extra actions with the MRZ result, or navigating to another page, or really anything that the developer would like to do once the scanning operation is done.

  >Note:
  >
  > In the Hello World sample, no action is taken once the Done button is clicked. The scanner closes and the user is met with an empty page. In order to open the scanner again, the user must refresh the page. However, this action can be changed according to the developer's wishes as indicated above.

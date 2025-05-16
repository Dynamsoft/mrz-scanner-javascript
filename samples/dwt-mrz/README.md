# Using the MRZ Scanner (JavaScript Edition) with Dynamic Web TWAIN

This sample provides a way to use the MRZ Scanner solution with Dynamic Web TWAIN to allow the user to scan MRZ images via a physical scanner or via one of the different image input methods that Web TWAIN allows.

To learn more about Dynamic Web TWAIN, feel free to explore the SDK on this [page](https://www.dynamsoft.com/web-twain/overview/).

## Prerequisites

To get started with this sample, there is not much that you need except for a license key for both Dynamic Web TWAIN and the MRZ Scanner.

To get a 30-day trial license for the MRZ Scanner, please visit this [page](https://www.dynamsoft.com/customer/license/trialLicense/thank-you/?product=mrz&deploymenttype=web). The license that is currently used for the MRZ Scanner is a temporary 24-hour public trial license (which is set in the `index.html` file). Please replace this public trial license (`YOUR_LICENSE_KEY_HERE`) with your working trial license.
 
To get a 30-day trial license for Dynamic Web TWAIN, please visit this [page](https://www.dynamsoft.com/customer/license/trialLicense/thank-you/?product=dwt&deploymenttype=web). There is no license that is currently set in the `Resources/dynamsoft.webtwain.config.js` file. Please replace `YOUR_DWT_LICENSE_KEY` with your working trial license.

If you would like to take a deep dive into the implementation of these two products together, please read this [article](https://www.dynamsoft.com/web-twain/docs/indepth/development/mrz.html).

## Conclusion

It is best to host this sample on your own server with an HTTPS connection. If you are using VS Code, a quick and easy way to serve the project is using the Live Server (Five Server) VSCode extension. Simply install the extension, open the hello-world.html file in the editor, and click “Go Live” in the bottom right corner of the editor. This will serve the application at http://127.0.0.1:5500/hello-world.html. Alternatively, you can also use IIS or Github Pages to quickly serve your application.

If you have any questions, do not hesitate to get in touch with the [Dynamsoft Support](https://www.dynamsoft.com/contact/) team.
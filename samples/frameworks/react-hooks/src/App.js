import { useEffect, useState } from "react";
import { MRZScanner, MRZDataLabel } from "dynamsoft-mrz-scanner";
import reactLogo from "./logo.svg";
import "./App.css";

function App() {
  const [result, setResult] = useState({
    image: "",
    data: "",
  });
  useEffect(() => {
    // Configuration object for initializing the MRZ Scanner instance
    const config = {
      license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
    };

    // Create an instance of the mrzScanner with the provided configuration
    const mrzscanner = new MRZScanner(config);

    // Launch the scanner; once a mrz is detected and save the result
    mrzscanner.launch().then((_result) => {
      const { originalImageResult, data } = _result;

      // Get captured MRZ image
      const canvas = originalImageResult?.toCanvas();
      const dataUrl = canvas.toDataURL("image/png");

      // Format data as a string

      const formattedMRZ = Object.entries(data)
        .map(([key, value]) => {
          return `${MRZDataLabel[key]}:\n${key === "mrzText" ? value : JSON.stringify(value)}`;
        })
        .join("\n\n");

      setResult({ image: dataUrl, data: formattedMRZ });
    });
  }, []);
  return (
    <div className="mrz-scanner-hello-world-page">
      <div className="mrz-scanner-title">
        <h2 className="mrz-scanner-title-text">Hello World for React</h2>
        <img className="mrz-scanner-title-logo" src={reactLogo} alt="logo"></img>
      </div>
      <div className="mrz-scanner-result-container">
        {result?.image && <img className="result-img" src={result.image} alt="mrz-result" />}
        {result?.data && <div className="result-data">{result.data}</div>}
      </div>
    </div>
  );
}

export default App;

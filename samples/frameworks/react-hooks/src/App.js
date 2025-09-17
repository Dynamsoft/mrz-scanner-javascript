import { useEffect, useState, useRef } from "react";
import { MRZScanner, MRZDataLabel } from "dynamsoft-mrz-scanner";
import reactLogo from "./logo.svg";
import "./App.css";

function App() {
  const [result, setResult] = useState({
    image: "",
    data: "",
  });
  const scannerRef = useRef(null);

  useEffect(() => {
    // Prevent double initialization
    if (scannerRef.current) {
      return;
    }

    let resolveInit;
    const pInit = new Promise((r) => {
      resolveInit = r;
    });

    (async () => {
      try {
        // Configuration object for initializing the MRZ Scanner instance
        const config = {
          license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
        };

        const mrzScanner = new MRZScanner(config);
        scannerRef.current = mrzScanner;

        // Launch the scanner and wait for the result
        const _result = await mrzScanner.launch();

        // Process result
        const { originalImageResult, data } = _result;

        // Format data as a string
        const formattedMRZ = Object.entries(data)
          .map(([key, value]) => {
            return `${MRZDataLabel[key]}:\n${key === "mrzText" ? value : JSON.stringify(value)}`;
          })
          .join("\n\n");

        const canvas = originalImageResult?.toCanvas();
        const dataUrl = canvas ? canvas.toDataURL("image/png") : "";

        setResult({ image: dataUrl, data: formattedMRZ });
        scannerRef.current = null;
      } catch (error) {
        console.error(error?.message || error);
        alert(error?.message || error);
      }
      resolveInit();
    })();

    return () => {
      // Wait for initialization to complete before disposing
      pInit
        .then(() => {
          if (scannerRef.current) {
            scannerRef.current.dispose();
            scannerRef.current = null;
          }
        })
        .catch(() => {});
    };
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

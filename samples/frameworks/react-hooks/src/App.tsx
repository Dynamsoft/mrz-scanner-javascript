import { useEffect, useState, useRef } from "react";
import {
	MRZScanner,
	MRZDataLabel,
	EnumDocumentSide,
	EnumMRZData,
	MRZImage,
} from "dynamsoft-mrz-scanner";
import "./App.css";

const toDataUrl = (image: MRZImage) => image.toCanvas().toDataURL("image/png");

function App() {
	const [result, setResult] = useState({
		portraitSide: "",
		mrzSide: "",
		portrait: "",
		data: "",
	});
	const scannerRef = useRef<MRZScanner | null>(null);

	useEffect(() => {
		// Prevent double initialization
		if (scannerRef.current) {
			return;
		}

		async function init() {
			try {
				const mrzScanner = new MRZScanner({
					license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
				});
				scannerRef.current = mrzScanner;

				const scanResult = await mrzScanner.launch();
				const { data } = scanResult;

				const formattedMRZ = Object.entries(data ?? {})
					.map(
						([key, value]) =>
							`${MRZDataLabel[key]}:\n${key === EnumMRZData.MRZText ? value : JSON.stringify(value)}`,
					)
					.join("\n\n");

				const portraitSide = scanResult.getDocumentImage(EnumDocumentSide.Opposite);
				const mrzSide = scanResult.getDocumentImage(EnumDocumentSide.MRZ);
				const portrait = scanResult.getPortraitImage();

				setResult({
					portraitSide: portraitSide ? toDataUrl(portraitSide) : "",
					mrzSide: mrzSide ? toDataUrl(mrzSide) : "",
					portrait: portrait ? toDataUrl(portrait) : "",
					data: formattedMRZ,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(message);
				alert(message);
			}
		}

		const pInit = init();

		return () => {
			pInit
				.then(() => {
					scannerRef.current?.dispose();
					scannerRef.current = null;
				})
				.catch(() => {});
		};
	}, []);

	return (
		<div className="mrz-scanner-hello-world-page">
			<div className="mrz-scanner-title">
				<h2 className="mrz-scanner-title-text">Hello World for React</h2>
			</div>
			<div className="mrz-scanner-result-container">
				{result.portraitSide && (
					<img className="result-img" src={result.portraitSide} alt="portrait-side" />
				)}
				{result.mrzSide && <img className="result-img" src={result.mrzSide} alt="mrz-side" />}
				{result.portrait && <img className="result-img" src={result.portrait} alt="portrait" />}
				{result.data && <div className="result-data">{result.data}</div>}
			</div>
		</div>
	);
}

export default App;

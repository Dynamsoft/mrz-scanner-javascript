import { Component, OnInit, OnDestroy, signal } from "@angular/core";
import {
	MRZScanner,
	MRZDataLabel,
	EnumDocumentSide,
	EnumMRZData,
	MRZImage,
} from "dynamsoft-mrz-scanner";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit, OnDestroy {
	result = signal({ portraitSide: "", mrzSide: "", portrait: "", data: "" });
	private mrzScanner: MRZScanner | null = null;

	async ngOnInit() {
		try {
			this.mrzScanner = new MRZScanner({
				license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
			});

			const scanResult = await this.mrzScanner.launch();
			const { data } = scanResult;

			const formattedMRZ = Object.entries(data ?? {})
				.map(
					([key, value]) =>
						`${MRZDataLabel[key]}:\n${key === EnumMRZData.MRZText ? value : JSON.stringify(value)}`,
				)
				.join("\n\n");

			const toDataUrl = (image: MRZImage) => image.toCanvas().toDataURL("image/png");

			const portraitSide = scanResult.getDocumentImage(EnumDocumentSide.Opposite);
			const mrzSide = scanResult.getDocumentImage(EnumDocumentSide.MRZ);
			const portrait = scanResult.getPortraitImage();

			this.result.set({
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

	ngOnDestroy() {
		this.mrzScanner?.dispose();
		this.mrzScanner = null;
	}
}

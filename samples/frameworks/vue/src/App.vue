<template>
	<div class="mrz-scanner-hello-world-page">
		<div class="mrz-scanner-title">
			<h2 class="mrz-scanner-title-text">MRZ Scanner Hello World for Vue</h2>
		</div>
		<div class="mrz-scanner-result-container">
			<img
				v-if="result.portraitSide"
				class="result-img"
				:src="result.portraitSide"
				alt="portrait-side"
			/>
			<img v-if="result.mrzSide" class="result-img" :src="result.mrzSide" alt="mrz-side" />
			<img v-if="result.portrait" class="result-img" :src="result.portrait" alt="portrait" />
			<div v-if="result.data" class="result-data">{{ result.data }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
	MRZScanner,
	MRZDataLabel,
	EnumDocumentSide,
	EnumMRZData,
	MRZImage,
} from "dynamsoft-mrz-scanner";

const result = ref({ portraitSide: "", mrzSide: "", portrait: "", data: "" });
let mrzScanner: MRZScanner | null = null;

const toDataUrl = (image: MRZImage) => image.toCanvas().toDataURL("image/png");

onMounted(async () => {
	try {
		mrzScanner = new MRZScanner({
			license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
		});

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

		result.value = {
			portraitSide: portraitSide ? toDataUrl(portraitSide) : "",
			mrzSide: mrzSide ? toDataUrl(mrzSide) : "",
			portrait: portrait ? toDataUrl(portrait) : "",
			data: formattedMRZ,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		alert(message);
	}
});

onBeforeUnmount(() => {
	mrzScanner?.dispose();
	mrzScanner = null;
});
</script>

<style>
body {
	margin: 0;
	font-family: system-ui, sans-serif;
}

.mrz-scanner-hello-world-page {
	width: 100%;
	height: 100%;
	text-align: center;
}

.mrz-scanner-title {
	height: 90px;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20px 0;
}

.mrz-scanner-result-container {
	overflow-y: auto;
	height: calc(100dvh - 90px - 40px);
	width: 100%;
}

.mrz-scanner-result-container .result-img {
	width: 100%;
}

.mrz-scanner-result-container .result-data {
	white-space: pre-line;
	padding-bottom: 20px;
}
</style>

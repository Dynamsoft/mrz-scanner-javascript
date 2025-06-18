<template>
  <div class="mrz-scanner-hello-world-page">
    <div class="mrz-scanner-title">
      <h2 class="mrz-scanner-title-text">Hello World for Vue</h2>
      <img class="mrz-scanner-title-logo" src="./assets/logo.png" alt="logo" />
    </div>
    <div class="mrz-scanner-result-container">
      <img
        v-if="result.image"
        class="result-img"
        :src="result.image"
        alt="mrz-result"
      />
      <div v-if="result.data" class="result-data">{{ result.data }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { MRZScanner, MRZDataLabel } from "dynamsoft-mrz-scanner";

const result = ref({
  image: "",
  data: "",
});

onMounted(async () => {
  // Configuration object for initializing the MRZ Scanner instance
  const config = {
    license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
  };
  const mrzscanner = new MRZScanner(config);

  try {
    const _result = await mrzscanner.launch();
    const { originalImageResult, data } = _result;

    const canvas = originalImageResult?.toCanvas();
    const dataUrl = canvas.toDataURL("image/png");

    const formattedMRZ = Object.entries(data)
      .map(([key, value]) => {
        return `${MRZDataLabel[key]}:\n${
          key === "mrzText" ? value : JSON.stringify(value)
        }`;
      })
      .join("\n\n");

    result.value = { image: dataUrl, data: formattedMRZ };
  } catch (error) {
    console.error("Error scanning MRZ:", error);
  }
});
</script>

<style>
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

.mrz-scanner-title .mrz-scanner-title-logo {
  margin-left: 4px;
  width: 24px;
  height: 24px;
}

.mrz-scanner-result-container {
  overflow-y: auto;
  height: 100%;
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

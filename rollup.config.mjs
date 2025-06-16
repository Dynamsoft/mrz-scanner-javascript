import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
// import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { dts } from "rollup-plugin-dts";

const pkg = JSON.parse(await fs.promises.readFile("./package.json"));
const version = pkg.version;

fs.rmSync("dist", { recursive: true, force: true });

const strProduct = "Dynamsoft MRZ Scanner JS Edition Bundle";

const terser_format = {
  // this func is run by eval in worker, so can't use variable outside
  comments: function (node, comment) {
    const text = comment.value;
    const type = comment.type;
    if (type == "comment2") {
      // multiline comment
      const strProduct = "Dynamsoft Document Scanner JS Edition Bundle";
      const regDyComment = new RegExp(String.raw`@product\s${strProduct}`, "i");
      return regDyComment.test(text);
    }
  },
};

const banner = `/*!
* Dynamsoft MRZ Scanner JavaScript Library
* @product ${strProduct}
* @website http://www.dynamsoft.com
* @copyright Copyright ${new Date().getUTCFullYear()}, Dynamsoft Corporation
* @author Dynamsoft
* @version ${version}
* @fileoverview Dynamsoft MRZ Scanner JavaScript Edition is a ready-to-use SDK for web applications that accurately recognizes and parses Machine-Readable Zones on Machine-Readable Travel Documents.
* More info on Dynamsoft MRZ SCanner JS: https://www.dynamsoft.com/use-cases/mrz-scanner/
*/`;

const plugin_terser_es6 = terser({ ecma: 6, format: terser_format });
const plugin_terser_es5 = terser({ ecma: 5, format: terser_format });

const DCV_CONFIG_PATH = `src/dcv-config`;
const BUNDLE_BUILD_PATH = `src/build`;
const TYPES_PATH = "dist/types/build";

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync(`${DCV_CONFIG_PATH}/mrz-scanner.ui.html`, "dist/mrz-scanner.ui.html");
    fs.copyFileSync(`${DCV_CONFIG_PATH}/mrz-scanner.template.json`, "dist/mrz-scanner.template.json");
  },
});

const external = ["dynamsoft-capture-vision-bundle"];

const globals = {
  "dynamsoft-capture-vision-bundle": "Dynamsoft",
};

export default [
  // 1. Full bundle
  {
    input: `${BUNDLE_BUILD_PATH}/mrz-scanner.bundle.ts`,
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: false,
      }),
      plugin_terser_es5,
      copyFiles(),
      {
        writeBundle(options, bundle) {
          let txt = fs
            .readFileSync("dist/mrz-scanner.bundle.js", { encoding: "utf8" })
            .replace(/Dynamsoft=\{\}/, "Dynamsoft=t.Dynamsoft||{}");
          fs.writeFileSync("dist/mrz-scanner.bundle.js", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/mrz-scanner.bundle.js",
        format: "umd",
        name: "Dynamsoft",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 2. Standard UMD bundle
  {
    input: `${BUNDLE_BUILD_PATH}/mrz-scanner.ts`,
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: false,
      }),
      plugin_terser_es5,
    ],
    output: [
      {
        file: "dist/mrz-scanner.js",
        format: "umd",
        name: "Dynamsoft",
        globals,
        banner: banner,
        exports: "named",
        sourcemap: false,
        extend: true,
      },
    ],
  },
  // 3. ESM bundle
  {
    input: `${BUNDLE_BUILD_PATH}/mrz-scanner.bundle.esm.ts`,
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: false,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/mrz-scanner.bundle.mjs",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 4. ESM with externals
  {
    input: `${BUNDLE_BUILD_PATH}/mrz-scanner.ts`,
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: false,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/mrz-scanner.mjs",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 5. No-content ESM
  {
    input: `${BUNDLE_BUILD_PATH}/mrz-scanner.no-content-bundle.esm.ts`,
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: false,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/mrz-scanner.no-content-bundle.esm.js",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 6. Type declarations for CommonJS/UMD
  {
    input: `${BUNDLE_BUILD_PATH}/mrz-scanner.ts`,
    external,
    plugins: [
      dts(),
      {
        writeBundle(options, bundle) {
          let txt = fs.readFileSync("dist/mrz-scanner.d.ts", { encoding: "utf8" }).replace(/([{,]) type /g, "$1 ");
          fs.writeFileSync("dist/mrz-scanner.d.ts", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/mrz-scanner.d.ts",
        format: "es",
      },
    ],
  },
  // 7. Type declarations for ESM
  {
    input: `${TYPES_PATH}/mrz-scanner.bundle.esm.d.ts`,
    plugins: [
      dts(),
      {
        // https://rollupjs.org/guide/en/#writebundle
        writeBundle(options, bundle) {
          fs.rmSync(TYPES_PATH, { recursive: true, force: true });
          // change `export { type A }` to `export { A }`,
          // so project use old typescript still works.
          let txt = fs
            .readFileSync("dist/mrz-scanner.bundle.esm.d.ts", { encoding: "utf8" })
            .replace(/([{,]) type /g, "$1 ");
          fs.writeFileSync("dist/mrz-scanner.bundle.esm.d.ts", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/mrz-scanner.bundle.esm.d.ts",
        format: "es",
      },
    ],
  },
];

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

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync("src/mrz-scanner.ui.html", "dist/mrz-scanner.ui.html");
    fs.copyFileSync("src/mrz-scanner.template.json", "dist/mrz-scanner.template.json");
  },
});

const external = [
  "dynamsoft-core",
  "dynamsoft-license",
  "dynamsoft-capture-vision-router",
  "dynamsoft-camera-enhancer",
  "dynamsoft-code-parser",
  "dynamsoft-label-recognizer",
  "dynamsoft-utility",
];

const globals = {
  "dynamsoft-core": "Dynamsoft.Core",
  "dynamsoft-license": "Dynamsoft.License",
  "dynamsoft-capture-vision-router": "Dynamsoft.CVR",
  "dynamsoft-camera-enhancer": "Dynamsoft.DCE",
  "dynamsoft-code-parser": "Dynamsoft.DCP",
  "dynamsoft-label-recognizer": "Dynamsoft.DLR",
  "dynamsoft-utility": "Dynamsoft.Utility",
};

export default [
  // 1. Full bundle
  {
    input: "src/mrz-scanner.bundle.ts",
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
    input: "src/mrz-scanner.ts",
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
    input: "src/mrz-scanner.bundle.esm.ts",
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
    input: "src/mrz-scanner.ts",
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
    input: "src/mrz-scanner.no-content-bundle.esm.ts",
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
    input: "src/mrz-scanner.ts",
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
    input: "dist/types/mrz-scanner.bundle.esm.d.ts",
    plugins: [
      dts(),
      {
        // https://rollupjs.org/guide/en/#writebundle
        writeBundle(options, bundle) {
          fs.rmSync("dist/types", { recursive: true, force: true });
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

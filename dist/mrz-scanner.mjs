/*!
* Dynamsoft MRZ Scanner JavaScript Library
* @product Dynamsoft MRZ Scanner JS Edition Bundle
* @website http://www.dynamsoft.com
* @copyright Copyright 2026, Dynamsoft Corporation
* @author Dynamsoft
* @version 4.0.0-beta-202605210002
* @fileoverview Dynamsoft MRZ Scanner JavaScript Edition is a ready-to-use SDK for web applications that accurately recognizes and parses Machine-Readable Zones on Machine-Readable Travel Documents.
* More info on Dynamsoft MRZ SCanner JS: https://www.dynamsoft.com/use-cases/mrz-scanner/
*/
import { CameraEnhancer as e, CaptureVisionRouter as t, CapturedResultReceiver as n, CodeParserModule as r, CoreModule as i, EnumCapturedResultItemType as a, EnumCodeType as o, EnumValidationStatus as s, Feedback as c, IdentityProcessor as l, ImageProcessor as u, IntermediateResultReceiver as d, LicenseManager as f, MultiFrameResultCrossFilter as p, _toBlob as m, _toCanvas as h } from "dynamsoft-capture-vision-bundle";
export * from "dynamsoft-capture-vision-bundle";
//#region src/views/utils/types.ts
var g = /* @__PURE__ */ function(e) {
	return e.MRZ = "mrz", e.Opposite = "opposite", e;
}({}), _ = /* @__PURE__ */ function(e) {
	return e.Passport = "td3_passport", e.TD1 = "td1_id", e.TD2 = "td2_id", e.MRVA = "mrva_visa", e.MRVB = "mrvb_visa", e;
}({}), v = /* @__PURE__ */ function(e) {
	return e.TD3 = "td3", e.TD1 = "td1", e.TD2 = "td2", e.MRVA = "mrva", e.MRVB = "mrvb", e.TD1AndTD2 = "td1AndTd2", e.MRVAAndMRVB = "mrvaAndMrvb", e.PassportAndTD1 = "passportAndTd1", e.PassportAndTD2 = "passportAndTd2", e.All = "all", e;
}({}), y = /* @__PURE__ */ function(e) {
	return e.Scanner = "scanner", e.Result = "scan-result", e;
}({}), b = {
	td3: "ReadPassport",
	td1: "ReadId-TD1",
	td2: "ReadId-TD2",
	mrva: "ReadVisa-MRVA",
	mrvb: "ReadVisa-MRVB",
	td1AndTd2: "ReadId",
	mrvaAndMrvb: "ReadVisa",
	passportAndTd1: "ReadPassportAndId-TD1",
	passportAndTd2: "ReadPassportAndId-TD2",
	all: "ReadAll"
}, x = /* @__PURE__ */ function(e) {
	return e[e.RS_SUCCESS = 0] = "RS_SUCCESS", e[e.RS_CANCELLED = 1] = "RS_CANCELLED", e[e.RS_FAILED = 2] = "RS_FAILED", e;
}({});
//#endregion
//#region src/views/utils/index.ts
function S(e) {
	if (e == null) return null;
	if (typeof e == "string") {
		let t = document.querySelector(e);
		if (!t) throw Error("Element not found");
		return t;
	}
	return e instanceof HTMLElement ? e : null;
}
function C(e, t) {
	let n = document.getElementById(e);
	if (n) {
		n.textContent = t;
		return;
	}
	let r = document.createElement("style");
	r.id = e, r.textContent = t, document.head.appendChild(r);
}
var w = (e) => !e || Object.keys(e).length === 0;
function ee(e, t) {
	return t ? {
		...e,
		...t
	} : e;
}
function T(e) {
	return e ? e.charAt(0).toUpperCase() + e.slice(1) : "";
}
var E = {
	"4k": {
		width: 3840,
		height: 2160
	},
	"2k": {
		width: 2560,
		height: 1440
	},
	"1080p": {
		width: 1920,
		height: 1080
	},
	"720p": {
		width: 1280,
		height: 720
	},
	"480p": {
		width: 640,
		height: 480
	}
};
//#endregion
//#region src/views/utils/LoadingScreen.ts
function D(e, t = {}) {
	let { message: n, spinnerSize: r = 32 } = t, i = document.createElement("div");
	i.className = "dynamsoft-mrz-loading-screen";
	let a = document.createElement("div");
	a.className = "dynamsoft-mrz-loading";
	let o = document.createElement("div");
	if (o.className = "dynamsoft-mrz-loading-content", o.innerHTML = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="white" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      width="${r}" 
      height="${r}" 
      stroke-width="0.75"
    > 
      <path d="M12 3a9 9 0 1 0 9 9"></path> 
    </svg>
  `, n) {
		let e = document.createElement("div");
		e.className = "dynamsoft-mrz-loading-message", e.textContent = n, o.appendChild(e);
	}
	return a.appendChild(o), i.appendChild(a), e.appendChild(i), {
		element: i,
		updateMessage: (e) => {
			let t = a.querySelector(".dynamsoft-mrz-loading-message");
			if (e === null) {
				t?.remove();
				return;
			}
			t ? t.textContent = e : (t = document.createElement("div"), t.className = "dynamsoft-mrz-loading-message", t.textContent = e, o.appendChild(t));
		},
		hide: () => {
			i && i.parentNode && (i.classList.add("fade-out"), setTimeout(() => {
				i.parentNode?.removeChild(i);
			}, 200));
		}
	};
}
var O = "\n  .dynamsoft-mrz-loading-screen {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background-color: #323234;\n    z-index: 998;\n    opacity: 1;\n    transition: opacity 0.2s ease-out;\n  }\n\n  .dynamsoft-mrz-loading-screen.fade-out {\n    opacity: 0;\n  }\n\n  .dynamsoft-mrz-loading {\n    position: absolute;\n    left: 50%;\n    top: 50%;\n    color: white;\n    z-index: 999;\n    transform: translate(-50%, -50%);\n  }\n\n  .dynamsoft-mrz-loading-content {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 16px;\n  }\n\n  .dynamsoft-mrz-loading svg {\n    animation: spin 1s linear infinite;\n  }\n\n  .dynamsoft-mrz-loading-message {\n    color: white;\n    font-family: \"Verdana\";\n    font-size: 14px;\n    text-align: center;\n    max-width: 200px;\n    line-height: 1.4;\n    opacity: 0.9;\n  }\n\n  @keyframes spin {\n    from {\n      transform: rotate(0deg);\n    }\n    to {\n      transform: rotate(360deg);\n    }\n  }\n", k = /* @__PURE__ */ function(e) {
	return e.InvalidFields = "invalidFields", e.DocumentType = "documentType", e.DocumentNumber = "documentNumber", e.MRZText = "mrzText", e.FirstName = "firstName", e.LastName = "lastName", e.Age = "age", e.Sex = "sex", e.IssuingState = "issuingState", e.IssuingStateRaw = "issuingStateRaw", e.Nationality = "nationality", e.NationalityRaw = "nationalityRaw", e.DateOfBirth = "dateOfBirth", e.DateOfExpiry = "dateOfExpiry", e.OptionalData1 = "optionalData1", e.OptionalData2 = "optionalData2", e;
}({}), A = {
	invalidFields: "Invalid Fields",
	documentType: "Document Type",
	documentNumber: "Document Number",
	mrzText: "MRZ Text",
	firstName: "Given Name(s)",
	lastName: "Surname",
	age: "Age",
	sex: "Sex",
	issuingState: "Issuing State",
	issuingStateRaw: "Issuing State (Raw Value)",
	nationality: "Nationality",
	nationalityRaw: "Nationality State (Raw Value)",
	dateOfBirth: "Date Of Birth (YYYY-MM-DD)",
	dateOfExpiry: "Date Of Expiry (YYYY-MM-DD)",
	optionalData1: "Optional Data 1",
	optionalData2: "Optional Data 2"
};
function j(e) {
	let t = /* @__PURE__ */ new Date(), n = t.getMonth() + 1 > e.month || t.getMonth() + 1 === e.month && t.getDate() >= e.day;
	return t.getFullYear() - e.year - +!n;
}
function M(e, t, n, r = !1) {
	let i = parseInt(e, 10), a;
	return a = r ? i >= 60 ? 1900 + i : 2e3 + i : i > (/* @__PURE__ */ new Date()).getFullYear() % 100 ? 1900 + i : 2e3 + i, {
		year: a,
		month: parseInt(t, 10),
		day: parseInt(n, 10)
	};
}
function N(e) {
	let t = (e) => `${e}`.length === 1 ? `0${e}` : e;
	return `${e?.year}-${t(e?.month)}${e?.day && `-${t(e?.day)}`}`;
}
var P = {
	[o.CT_MRTD_TD1_ID]: _.TD1,
	[o.CT_MRTD_TD2_ID]: _.TD2,
	[o.CT_MRTD_TD2_FRENCH_ID]: _.TD2,
	[o.CT_MRTD_TD3_PASSPORT]: _.Passport,
	[o.CT_MRTD_TD2_VISA]: _.MRVB,
	[o.CT_MRTD_TD3_VISA]: _.MRVA
};
function F(e) {
	let t = P[e];
	if (!t) throw Error(`Unknown document type: ${e}`);
	return t;
}
function I(e) {
	return e === "D<<" ? "D" : e;
}
function L(e, t) {
	let n = [], r = (e) => t.getFieldValidationStatus(e) === s.VS_FAILED, i = F(t.codeType), a = i === _.Passport ? "passportNumber" : "documentNumber", o = M(t.getFieldValue("birthYear"), t.getFieldValue("birthMonth"), t.getFieldValue("birthDay")), c = M(t.getFieldValue("expiryYear"), t.getFieldValue("expiryMonth"), t.getFieldValue("expiryDay"), !0);
	[
		"birthYear",
		"birthMonth",
		"birthDay"
	].forEach((e) => {
		r(e) && n.push("dateOfBirth");
	}), [
		"expiryYear",
		"expiryMonth",
		"expiryDay"
	].forEach((e) => {
		r(e) && n.push("dateOfExpiry");
	});
	let l = {
		lastName: t.getFieldValue("primaryIdentifier"),
		firstName: t.getFieldValue("secondaryIdentifier"),
		nationality: t.getFieldValue("nationality"),
		nationalityRaw: I(t.getFieldRawValue("nationality")),
		documentNumber: t.getFieldValue(a) || t.getFieldValue("longDocumentNumber"),
		issuingState: t.getFieldValue("issuingState"),
		issuingStateRaw: I(t.getFieldRawValue("issuingState")),
		sex: T(t.getFieldValue("sex"))
	};
	Object.keys(l).forEach((e) => {
		let t = !1;
		switch (e) {
			case "firstName":
				t = r("secondaryIdentifier");
				break;
			case "lastName":
				t = r("primaryIdentifier");
				break;
			case "documentNumber":
				t = r(a) || r("longDocumentNumber");
				break;
			default: t = r(e);
		}
		t && n.push(e);
	});
	let u = j(o);
	return u < 1 && n.push("age"), {
		invalidFields: n,
		firstName: l.firstName,
		lastName: l.lastName,
		age: u,
		dateOfBirth: o,
		sex: l.sex,
		nationality: l.nationality,
		nationalityRaw: l.nationalityRaw,
		documentNumber: l.documentNumber,
		dateOfExpiry: c,
		issuingState: l.issuingState,
		issuingStateRaw: l.issuingStateRaw,
		documentType: i,
		mrzText: e
	};
}
var R = class {
	constructor(e) {
		this._primaryOriginalImage = null, this._secondaryOriginalImage = null, this._primaryDocumentImage = null, this._secondaryDocumentImage = null, this._portraitImage = null, this.status = e.status, this.data = e.data, this._primaryOriginalImage = e.primaryOriginalImage ?? null, this._secondaryOriginalImage = e.secondaryOriginalImage ?? null, this._primaryDocumentImage = e.primaryDocumentImage ?? null, this._secondaryDocumentImage = e.secondaryDocumentImage ?? null, this._portraitImage = e.portraitImage ?? null;
	}
	getDocumentImage(e) {
		return e === g.MRZ ? this._primaryDocumentImage : this._secondaryDocumentImage;
	}
	getOriginalImage(e) {
		return e === g.MRZ ? this._primaryOriginalImage : this._secondaryOriginalImage;
	}
	getPortraitImage() {
		return this._portraitImage;
	}
}, z = 14, B = {
	top: 30,
	bottom: 15,
	left: 5,
	right: 10
}, V = .05, H = 3, U = .75, W = 70;
function G(e) {
	let t = e;
	return t.toCanvas = () => h(e), t.toBlob = async () => await m("image/png", e), t;
}
function K(e) {
	return !(!e || e.errorCode || !e.points || e.points.length !== 4 || !e.area || e.area <= 0);
}
function q(e, t) {
	let n = t.points, r = !1;
	for (let t = 0, i = n.length - 1; t < n.length; i = t++) {
		let a = n[t].x, o = n[t].y, s = n[i].x, c = n[i].y;
		o > e.y != c > e.y && e.x < (s - a) * (e.y - o) / (c - o) + a && (r = !r);
	}
	return r;
}
function J(e, t) {
	return !e.points.every((e) => q(e, t)) || !t.area || !e.area || e.area === 0 ? !1 : t.area / e.area >= H;
}
function Y(e) {
	let t = e.processedDocumentResult?.detectedQuadResultItems?.[0];
	if (!t) return null;
	let n = t.location;
	return !n || !n.points || n.points.length !== 4 || !n.area || n.area <= 0 ? null : n;
}
function X(e) {
	let t = e?.auxiliaryRegionElements;
	return t ? t.some((e) => e.name === "PortraitZone" && e.confidence > W) : !0;
}
function Z(e, t, n) {
	let r = typeof t == "number" ? {
		top: t,
		bottom: t,
		left: t,
		right: t
	} : {
		top: t.top ?? 0,
		bottom: t.bottom ?? 0,
		left: t.left ?? 0,
		right: t.right ?? 0
	}, i = e.points, a = (i[0].x + i[1].x + i[2].x + i[3].x) / 4, o = (i[0].y + i[1].y + i[2].y + i[3].y) / 4, s = n ? n.width - 1 : Infinity, c = n ? n.height - 1 : Infinity;
	return { points: i.map((e) => {
		let t = e.x > a, n = e.y > o, i = t ? r.right : -r.left, l = n ? r.bottom : -r.top;
		return {
			x: Math.max(0, Math.min(s, e.x + i)),
			y: Math.max(0, Math.min(c, e.y + l))
		};
	}) };
}
async function te(e, t = {}) {
	let { returnDocumentImage: n = !1, returnPortraitImage: r = !1, validatePortraitLocation: i = !1, overrideDocumentResult: o = null } = t, s = e.items.filter((e) => e.type === a.CRIT_ORIGINAL_IMAGE);
	if (s.length === 0) throw Error("No image data found in captured result");
	let c = G(s[0].imageData), d = e?.parsedResult?.parsedResultItems, f = {};
	if (d?.length) {
		let e = d[0]?.referenceItem?.text || "", t = d[0];
		f = L(e, t);
	}
	let p = null;
	if (r) try {
		p = await l.findPortraitZone();
	} catch {}
	let m = null, h = null;
	if (n) try {
		let t = o ?? e.processedDocumentResult, n = t?.detectedQuadResultItems?.[0];
		if (n) {
			let e = n.location, r = c.width * c.height, i = e?.area ?? 0, a = i / r;
			if (e && i > 0 && a >= V) if (h = e, a > U) m = c;
			else {
				let e = t?.deskewedImageResultItems?.[0];
				if (e?.imageData) m = G(e.imageData);
				else {
					let e = Z(h, z, c);
					m = G(await u.cropAndDeskewImage(c, e));
				}
			}
		}
		m ||= c;
	} catch {
		m = c;
	}
	let g = null;
	if (r && p) try {
		if (!K(p)) return {
			imageData: c,
			processedData: f,
			primaryDocumentImage: m,
			portraitImage: null
		};
		if (!(i && h) || J(p, h)) {
			let e = Z(p, B, c);
			g = G(await u.cropAndDeskewImage(c, e));
		}
	} catch {}
	return {
		imageData: c,
		processedData: f,
		primaryDocumentImage: m,
		portraitImage: g
	};
}
//#endregion
//#region src/views/MRZScannerViewUI.ts
var ne = "<svg width=\"354\" height=\"221\" viewBox=\"0 0 354 221\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"1\" y=\"1\" width=\"352\" height=\"219\" rx=\"15\" stroke=\"currentColor\" stroke-width=\"2\"/>\n<rect width=\"338\" height=\"42.4805\" transform=\"translate(8 170.52)\" fill=\"black\" fill-opacity=\"0.1\"/>\n<path d=\"M332.647 202.684L338.8 206.703V208.754L330.159 202.984V202.369L338.8 196.709V198.787L332.647 202.684Z\" fill=\"white\"/>\n<path d=\"M320.534 202.684L326.687 206.703V208.754L318.046 202.984V202.369L326.687 196.709V198.787L320.534 202.684Z\" fill=\"white\"/>\n<path d=\"M308.421 202.684L314.573 206.703V208.754L305.933 202.984V202.369L314.573 196.709V198.787L308.421 202.684Z\" fill=\"white\"/>\n<path d=\"M296.308 202.684L302.46 206.703V208.754L293.819 202.984V202.369L302.46 196.709V198.787L296.308 202.684Z\" fill=\"white\"/>\n<path d=\"M284.194 202.684L290.347 206.703V208.754L281.706 202.984V202.369L290.347 196.709V198.787L284.194 202.684Z\" fill=\"white\"/>\n<path d=\"M272.081 202.684L278.233 206.703V208.754L269.593 202.984V202.369L278.233 196.709V198.787L272.081 202.684Z\" fill=\"white\"/>\n<path d=\"M259.968 202.684L266.12 206.703V208.754L257.479 202.984V202.369L266.12 196.709V198.787L259.968 202.684Z\" fill=\"white\"/>\n<path d=\"M247.854 202.684L254.007 206.703V208.754L245.366 202.984V202.369L254.007 196.709V198.787L247.854 202.684Z\" fill=\"white\"/>\n<path d=\"M235.741 202.684L241.894 206.703V208.754L233.253 202.984V202.369L241.894 196.709V198.787L235.741 202.684Z\" fill=\"white\"/>\n<path d=\"M223.628 202.684L229.78 206.703V208.754L221.14 202.984V202.369L229.78 196.709V198.787L223.628 202.684Z\" fill=\"white\"/>\n<path d=\"M211.515 202.684L217.667 206.703V208.754L209.026 202.984V202.369L217.667 196.709V198.787L211.515 202.684Z\" fill=\"white\"/>\n<path d=\"M199.401 202.684L205.554 206.703V208.754L196.913 202.984V202.369L205.554 196.709V198.787L199.401 202.684Z\" fill=\"white\"/>\n<path d=\"M187.288 202.684L193.44 206.703V208.754L184.8 202.984V202.369L193.44 196.709V198.787L187.288 202.684Z\" fill=\"white\"/>\n<path d=\"M175.175 202.684L181.327 206.703V208.754L172.687 202.984V202.369L181.327 196.709V198.787L175.175 202.684Z\" fill=\"white\"/>\n<path d=\"M163.062 202.684L169.214 206.703V208.754L160.573 202.984V202.369L169.214 196.709V198.787L163.062 202.684Z\" fill=\"white\"/>\n<path d=\"M150.948 202.684L157.101 206.703V208.754L148.46 202.984V202.369L157.101 196.709V198.787L150.948 202.684Z\" fill=\"white\"/>\n<path d=\"M138.835 202.684L144.987 206.703V208.754L136.347 202.984V202.369L144.987 196.709V198.787L138.835 202.684Z\" fill=\"white\"/>\n<path d=\"M126.722 202.684L132.874 206.703V208.754L124.233 202.984V202.369L132.874 196.709V198.787L126.722 202.684Z\" fill=\"white\"/>\n<path d=\"M114.608 202.684L120.761 206.703V208.754L112.12 202.984V202.369L120.761 196.709V198.787L114.608 202.684Z\" fill=\"white\"/>\n<path d=\"M102.495 202.684L108.647 206.703V208.754L100.007 202.984V202.369L108.647 196.709V198.787L102.495 202.684Z\" fill=\"white\"/>\n<path d=\"M90.3818 202.684L96.5342 206.703V208.754L87.8936 202.984V202.369L96.5342 196.709V198.787L90.3818 202.684Z\" fill=\"white\"/>\n<path d=\"M80.415 200.729L81.1396 200.865C81.8096 201.016 82.3428 201.303 82.7529 201.727C83.6143 202.561 84.0518 203.559 84.0518 204.707V204.748C84.0518 205.91 83.71 206.826 83.04 207.496C82.1787 208.357 81.0986 208.85 79.7861 208.973C79.5811 208.986 79.3896 209 79.1846 209C78.0771 209 76.9561 208.727 75.8486 208.166V206.361L76.9561 206.936C77.5713 207.195 78.2275 207.318 78.9385 207.318C79.1299 207.318 79.335 207.305 79.54 207.291C80.4424 207.195 81.1533 206.881 81.6865 206.361C82.1787 205.896 82.4248 205.391 82.4248 204.844V204.762C82.4248 204.051 82.2061 203.477 81.7686 203.025C81.29 202.506 80.6338 202.246 79.7861 202.246H77.9951V200.893L81.5498 197.297H75.8486V195.656H83.6006V197.502L80.415 200.729Z\" fill=\"white\"/>\n<path d=\"M63.8994 208.891C63.8994 206.908 64.0498 205.664 64.3506 205.131C64.8154 204.133 65.8135 203.148 67.3447 202.164C68.5615 201.385 69.3818 200.674 69.8193 200.031C69.9834 199.799 70.0654 199.512 70.0654 199.17C70.0654 198.951 70.0381 198.719 69.9697 198.459C69.874 198.09 69.5732 197.762 69.0811 197.475C68.7529 197.27 68.3701 197.16 67.9189 197.16C66.8662 197.16 65.8955 197.42 65.0068 197.939C64.4053 198.295 64.1045 198.473 64.1045 198.486C64.0908 198.062 64.0908 197.68 64.0908 197.352C64.0908 197.01 64.0908 196.736 64.1045 196.504C65.4033 195.861 66.6748 195.533 67.9189 195.52C69.04 195.52 69.9697 195.848 70.708 196.49C71.46 197.133 71.8291 198.008 71.8291 199.143C71.8291 200.1 71.5146 200.906 70.8857 201.549C70.1885 202.273 69.4229 202.889 68.5889 203.395C67.249 204.215 66.4561 204.926 66.1963 205.514C65.9639 206.074 65.8408 206.648 65.8271 207.25H71.624V208.891H63.8994Z\" fill=\"white\"/>\n<path d=\"M56.7354 208.877V197.939L53.5908 200.646V198.268L56.708 195.725H58.6221V208.877H56.7354Z\" fill=\"white\"/>\n<path d=\"M45.7021 185.088H47.3701C47.3701 185.908 47.0967 186.578 46.5498 187.111C46.0029 187.631 45.2783 187.918 44.376 187.973H44.1709C43.4736 187.973 42.8447 187.768 42.2842 187.357C41.6416 186.879 41.1768 186.209 40.8623 185.348C40.4932 184.309 40.3154 183.119 40.3154 181.766C40.3154 180.412 40.4932 179.223 40.8486 178.197C41.1357 177.391 41.6006 176.748 42.2432 176.27C42.8721 175.805 43.583 175.572 44.376 175.572C45.251 175.572 45.8799 175.764 46.2627 176.146C46.9873 176.871 47.3428 177.596 47.3428 178.334H45.7842L45.7568 178.047C45.7158 177.883 45.5928 177.691 45.4014 177.473C45.2236 177.254 44.8408 177.145 44.2803 177.145C43.6104 177.145 43.0635 177.473 42.6533 178.129C42.2432 178.826 42.0381 179.934 42.0381 181.479V181.766C42.0791 183.475 42.3252 184.678 42.7764 185.389C43.2002 186.059 43.6924 186.4 44.2803 186.4C44.7725 186.4 45.1553 186.25 45.4287 185.949C45.5518 185.812 45.6338 185.607 45.6748 185.334L45.7021 185.088Z\" fill=\"white\"/>\n<path d=\"M45.7021 206.088H47.3701C47.3701 206.908 47.0967 207.578 46.5498 208.111C46.0029 208.631 45.2783 208.918 44.376 208.973H44.1709C43.4736 208.973 42.8447 208.768 42.2842 208.357C41.6416 207.879 41.1768 207.209 40.8623 206.348C40.4932 205.309 40.3154 204.119 40.3154 202.766C40.3154 201.412 40.4932 200.223 40.8486 199.197C41.1357 198.391 41.6006 197.748 42.2432 197.27C42.8721 196.805 43.583 196.572 44.376 196.572C45.251 196.572 45.8799 196.764 46.2627 197.146C46.9873 197.871 47.3428 198.596 47.3428 199.334H45.7842L45.7568 199.047C45.7158 198.883 45.5928 198.691 45.4014 198.473C45.2236 198.254 44.8408 198.145 44.2803 198.145C43.6104 198.145 43.0635 198.473 42.6533 199.129C42.2432 199.826 42.0381 200.934 42.0381 202.479V202.766C42.0791 204.475 42.3252 205.678 42.7764 206.389C43.2002 207.059 43.6924 207.4 44.2803 207.4C44.7725 207.4 45.1553 207.25 45.4287 206.949C45.5518 206.812 45.6338 206.607 45.6748 206.334L45.7021 206.088Z\" fill=\"white\"/>\n<path d=\"M29.1318 180.795H31.8115C32.4404 180.795 33.001 180.658 33.4795 180.371C33.9033 180.111 34.1084 179.701 34.1084 179.141V179.072C34.1084 178.594 33.8486 178.211 33.3428 177.896C32.9053 177.623 32.3994 177.486 31.8115 177.486H29.1318V180.795ZM29.1318 186.291H31.8115C32.4814 186.291 33.042 186.154 33.4795 185.881C34.0127 185.566 34.2725 185.102 34.2725 184.486C34.2725 183.871 34.04 183.365 33.5889 182.982C33.1514 182.586 32.5635 182.381 31.8115 182.381H29.1318V186.291ZM27.4365 187.877V175.9H31.8115C33.1514 175.9 34.1768 176.215 34.9014 176.857C35.5166 177.404 35.8311 178.102 35.8311 178.963C35.8311 179.797 35.667 180.412 35.3389 180.795C35.1475 181.027 34.915 181.246 34.6553 181.438L34.3271 181.643L34.6279 181.779C34.9697 181.984 35.2568 182.23 35.4756 182.518C35.8447 182.941 36.0225 183.557 36.0225 184.377C36.0088 185.457 35.6807 186.25 35.0518 186.77C34.1631 187.508 33.083 187.877 31.8115 187.877H27.4365Z\" fill=\"white\"/>\n<path d=\"M29.1318 201.795H31.8115C32.4404 201.795 33.001 201.658 33.4795 201.371C33.9033 201.111 34.1084 200.701 34.1084 200.141V200.072C34.1084 199.594 33.8486 199.211 33.3428 198.896C32.9053 198.623 32.3994 198.486 31.8115 198.486H29.1318V201.795ZM29.1318 207.291H31.8115C32.4814 207.291 33.042 207.154 33.4795 206.881C34.0127 206.566 34.2725 206.102 34.2725 205.486C34.2725 204.871 34.04 204.365 33.5889 203.982C33.1514 203.586 32.5635 203.381 31.8115 203.381H29.1318V207.291ZM27.4365 208.877V196.9H31.8115C33.1514 196.9 34.1768 197.215 34.9014 197.857C35.5166 198.404 35.8311 199.102 35.8311 199.963C35.8311 200.797 35.667 201.412 35.3389 201.795C35.1475 202.027 34.915 202.246 34.6553 202.438L34.3271 202.643L34.6279 202.779C34.9697 202.984 35.2568 203.23 35.4756 203.518C35.8447 203.941 36.0225 204.557 36.0225 205.377C36.0088 206.457 35.6807 207.25 35.0518 207.77C34.1631 208.508 33.083 208.877 31.8115 208.877H27.4365Z\" fill=\"white\"/>\n<path d=\"M18.167 182.777H21.1475L19.6709 177.322L18.167 182.777ZM15.2002 187.877L18.6045 175.559H20.9014L24.0322 187.877H22.3096L21.4072 184.432H17.7568L16.7725 187.877H15.2002Z\" fill=\"white\"/>\n<path d=\"M18.167 203.777H21.1475L19.6709 198.322L18.167 203.777ZM15.2002 208.877L18.6045 196.559H20.9014L24.0322 208.877H22.3096L21.4072 205.432H17.7568L16.7725 208.877H15.2002Z\" fill=\"white\"/>\n<path d=\"M56.7354 187.877V176.939L53.5908 179.646V177.268L56.708 174.725H58.6221V187.877H56.7354Z\" fill=\"white\"/>\n<path d=\"M63.8994 187.891C63.8994 185.908 64.0498 184.664 64.3506 184.131C64.8154 183.133 65.8135 182.148 67.3447 181.164C68.5615 180.385 69.3818 179.674 69.8193 179.031C69.9834 178.799 70.0654 178.512 70.0654 178.17C70.0654 177.951 70.0381 177.719 69.9697 177.459C69.874 177.09 69.5732 176.762 69.0811 176.475C68.7529 176.27 68.3701 176.16 67.9189 176.16C66.8662 176.16 65.8955 176.42 65.0068 176.939C64.4053 177.295 64.1045 177.473 64.1045 177.486C64.0908 177.062 64.0908 176.68 64.0908 176.352C64.0908 176.01 64.0908 175.736 64.1045 175.504C65.4033 174.861 66.6748 174.533 67.9189 174.52C69.04 174.52 69.9697 174.848 70.708 175.49C71.46 176.133 71.8291 177.008 71.8291 178.143C71.8291 179.1 71.5146 179.906 70.8857 180.549C70.1885 181.273 69.4229 181.889 68.5889 182.395C67.249 183.215 66.4561 183.926 66.1963 184.514C65.9639 185.074 65.8408 185.648 65.8271 186.25H71.624V187.891H63.8994Z\" fill=\"white\"/>\n<path d=\"M80.415 179.729L81.1396 179.865C81.8096 180.016 82.3428 180.303 82.7529 180.727C83.6143 181.561 84.0518 182.559 84.0518 183.707V183.748C84.0518 184.91 83.71 185.826 83.04 186.496C82.1787 187.357 81.0986 187.85 79.7861 187.973C79.5811 187.986 79.3896 188 79.1846 188C78.0771 188 76.9561 187.727 75.8486 187.166V185.361L76.9561 185.936C77.5713 186.195 78.2275 186.318 78.9385 186.318C79.1299 186.318 79.335 186.305 79.54 186.291C80.4424 186.195 81.1533 185.881 81.6865 185.361C82.1787 184.896 82.4248 184.391 82.4248 183.844V183.762C82.4248 183.051 82.2061 182.477 81.7686 182.025C81.29 181.506 80.6338 181.246 79.7861 181.246H77.9951V179.893L81.5498 176.297H75.8486V174.656H83.6006V176.502L80.415 179.729Z\" fill=\"white\"/>\n<path d=\"M332.647 181.684L338.8 185.703V187.754L330.159 181.984V181.369L338.8 175.709V177.787L332.647 181.684Z\" fill=\"white\"/>\n<path d=\"M320.534 181.684L326.687 185.703V187.754L318.046 181.984V181.369L326.687 175.709V177.787L320.534 181.684Z\" fill=\"white\"/>\n<path d=\"M308.421 181.684L314.573 185.703V187.754L305.933 181.984V181.369L314.573 175.709V177.787L308.421 181.684Z\" fill=\"white\"/>\n<path d=\"M296.308 181.684L302.46 185.703V187.754L293.819 181.984V181.369L302.46 175.709V177.787L296.308 181.684Z\" fill=\"white\"/>\n<path d=\"M284.194 181.684L290.347 185.703V187.754L281.706 181.984V181.369L290.347 175.709V177.787L284.194 181.684Z\" fill=\"white\"/>\n<path d=\"M272.081 181.684L278.233 185.703V187.754L269.593 181.984V181.369L278.233 175.709V177.787L272.081 181.684Z\" fill=\"white\"/>\n<path d=\"M259.968 181.684L266.12 185.703V187.754L257.479 181.984V181.369L266.12 175.709V177.787L259.968 181.684Z\" fill=\"white\"/>\n<path d=\"M247.854 181.684L254.007 185.703V187.754L245.366 181.984V181.369L254.007 175.709V177.787L247.854 181.684Z\" fill=\"white\"/>\n<path d=\"M235.741 181.684L241.894 185.703V187.754L233.253 181.984V181.369L241.894 175.709V177.787L235.741 181.684Z\" fill=\"white\"/>\n<path d=\"M223.628 181.684L229.78 185.703V187.754L221.14 181.984V181.369L229.78 175.709V177.787L223.628 181.684Z\" fill=\"white\"/>\n<path d=\"M211.515 181.684L217.667 185.703V187.754L209.026 181.984V181.369L217.667 175.709V177.787L211.515 181.684Z\" fill=\"white\"/>\n<path d=\"M199.401 181.684L205.554 185.703V187.754L196.913 181.984V181.369L205.554 175.709V177.787L199.401 181.684Z\" fill=\"white\"/>\n<path d=\"M187.288 181.684L193.44 185.703V187.754L184.8 181.984V181.369L193.44 175.709V177.787L187.288 181.684Z\" fill=\"white\"/>\n<path d=\"M175.175 181.684L181.327 185.703V187.754L172.687 181.984V181.369L181.327 175.709V177.787L175.175 181.684Z\" fill=\"white\"/>\n<path d=\"M163.062 181.684L169.214 185.703V187.754L160.573 181.984V181.369L169.214 175.709V177.787L163.062 181.684Z\" fill=\"white\"/>\n<path d=\"M150.948 181.684L157.101 185.703V187.754L148.46 181.984V181.369L157.101 175.709V177.787L150.948 181.684Z\" fill=\"white\"/>\n<path d=\"M138.835 181.684L144.987 185.703V187.754L136.347 181.984V181.369L144.987 175.709V177.787L138.835 181.684Z\" fill=\"white\"/>\n<path d=\"M126.722 181.684L132.874 185.703V187.754L124.233 181.984V181.369L132.874 175.709V177.787L126.722 181.684Z\" fill=\"white\"/>\n<path d=\"M114.608 181.684L120.761 185.703V187.754L112.12 181.984V181.369L120.761 175.709V177.787L114.608 181.684Z\" fill=\"white\"/>\n<path d=\"M102.495 181.684L108.647 185.703V187.754L100.007 181.984V181.369L108.647 175.709V177.787L102.495 181.684Z\" fill=\"white\"/>\n<path d=\"M90.3818 181.684L96.5342 185.703V187.754L87.8936 181.984V181.369L96.5342 175.709V177.787L90.3818 181.684Z\" fill=\"white\"/>\n</svg>", re = "<svg width=\"354\" height=\"221\" viewBox=\"0 0 354 221\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"1\" y=\"1\" width=\"352\" height=\"219\" rx=\"15\" stroke=\"currentColor\" stroke-width=\"2\"/>\n</svg>", ie = "<svg width=\"160\" height=\"100\" viewBox=\"0 0 160 100\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path opacity=\"0.9\" d=\"M148 0C154.627 0 160 5.37258 160 12V88C160 94.6274 154.627 100 148 100H12C5.37258 100 0 94.6274 0 88V12C2.57711e-07 5.37258 5.37258 2.57703e-07 12 0H148ZM11 86C9.34315 86 8 87.3431 8 89C8 90.6569 9.34315 92 11 92H149C150.657 92 152 90.6569 152 89C152 87.3431 150.657 86 149 86H11ZM11 76C9.34315 76 8 77.3431 8 79C8 80.6569 9.34315 82 11 82H149C150.657 82 152 80.6569 152 79C152 77.3431 150.657 76 149 76H11Z\" fill=\"white\"/>\n</svg>", ae = "<svg width=\"160\" height=\"100\" viewBox=\"0 0 160 100\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path opacity=\"0.9\" d=\"M12 0C5.37257 0 0 5.37258 0 12V88C0 94.6274 5.37259 100 12 100H148C154.627 100 160 94.6274 160 88V12C160 5.37258 154.627 0 148 0H12ZM35.999 16C39.6377 16 43.1761 17.1901 46.0703 19.3877C48.9644 21.5853 51.0552 24.6691 52.0205 28.165C52.9857 31.661 52.7727 35.3766 51.4141 38.7402C50.0553 42.1039 47.6257 44.9304 44.499 46.7852C50.8201 48.8434 56.2371 53.1852 59.752 59.2402C59.9143 59.5197 59.9996 59.8372 60 60.1602C60.0004 60.483 59.9155 60.8003 59.7539 61.0801C59.5918 61.3598 59.3588 61.5924 59.0781 61.7539C58.7974 61.9154 58.4785 62.0001 58.1543 62H13.8447C13.5208 61.9997 13.2023 61.9145 12.9219 61.7529C12.6415 61.5913 12.4089 61.3587 12.2471 61.0791C12.0853 60.7996 12 60.4828 12 60.1602C12.0001 59.8374 12.0851 59.5198 12.2471 59.2402C15.7619 53.1852 21.1789 48.8434 27.5 46.7852C24.3733 44.9304 21.9437 42.1039 20.585 38.7402C19.2263 35.3766 19.0133 31.661 19.9785 28.165C20.9438 24.6692 23.0337 21.5853 25.9277 19.3877C28.8219 17.19 32.3604 16.0001 35.999 16Z\" fill=\"white\"/>\n</svg>", oe = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><line x1=\"2\" y1=\"2\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"2\" x2=\"2\" y2=\"18\"/></svg>", se = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M20.25 3.75H6.75C6.35218 3.75 5.97064 3.90804 5.68934 4.18934C5.40804 4.47064 5.25 4.85218 5.25 5.25V6.75H3.75C3.35218 6.75 2.97064 6.90804 2.68934 7.18934C2.40804 7.47064 2.25 7.85218 2.25 8.25V18.75C2.25 19.1478 2.40804 19.5294 2.68934 19.8107C2.97064 20.092 3.35218 20.25 3.75 20.25H17.25C17.6478 20.25 18.0294 20.092 18.3107 19.8107C18.592 19.5294 18.75 19.1478 18.75 18.75V17.25H20.25C20.6478 17.25 21.0294 17.092 21.3107 16.8107C21.592 16.5294 21.75 16.1478 21.75 15.75V5.25C21.75 4.85218 21.592 4.47064 21.3107 4.18934C21.0294 3.90804 20.6478 3.75 20.25 3.75ZM16.125 6.75C16.3475 6.75 16.565 6.81598 16.75 6.9396C16.935 7.06321 17.0792 7.23891 17.1644 7.44448C17.2495 7.65005 17.2718 7.87625 17.2284 8.09448C17.185 8.31271 17.0778 8.51316 16.9205 8.6705C16.7632 8.82783 16.5627 8.93498 16.3445 8.97838C16.1262 9.02179 15.9 8.99951 15.6945 8.91436C15.4889 8.82922 15.3132 8.68502 15.1896 8.50002C15.066 8.31501 15 8.0975 15 7.875C15 7.57663 15.1185 7.29048 15.3295 7.0795C15.5405 6.86853 15.8266 6.75 16.125 6.75ZM17.25 18.75H3.75V8.25H5.25V15.75C5.25 16.1478 5.40804 16.5294 5.68934 16.8107C5.97064 17.092 6.35218 17.25 6.75 17.25H17.25V18.75ZM20.25 15.75H6.75V11.3147L9.59437 8.46937C9.66403 8.39964 9.74675 8.34432 9.83779 8.30658C9.92884 8.26884 10.0264 8.24941 10.125 8.24941C10.2236 8.24941 10.3212 8.26884 10.4122 8.30658C10.5033 8.34432 10.586 8.39964 10.6556 8.46937L15.3103 13.125L17.7188 10.7194C17.8594 10.5788 18.0501 10.4999 18.2489 10.4999C18.4477 10.4999 18.6384 10.5788 18.7791 10.7194L20.25 12.1941V15.75Z\" fill=\"white\"/></svg>", ce = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.5 5.25H16.9012L15.6234 3.33375C15.555 3.23114 15.4623 3.147 15.3535 3.08879C15.2448 3.03057 15.1233 3.00007 15 3H9C8.87665 3.00007 8.75522 3.03057 8.64648 3.08879C8.53773 3.147 8.44502 3.23114 8.37656 3.33375L7.09781 5.25H4.5C3.90326 5.25 3.33097 5.48705 2.90901 5.90901C2.48705 6.33097 2.25 6.90326 2.25 7.5V18C2.25 18.5967 2.48705 19.169 2.90901 19.591C3.33097 20.0129 3.90326 20.25 4.5 20.25H19.5C20.0967 20.25 20.669 20.0129 21.091 19.591C21.5129 19.169 21.75 18.5967 21.75 18V7.5C21.75 6.90326 21.5129 6.33097 21.091 5.90901C20.669 5.48705 20.0967 5.25 19.5 5.25ZM14.7009 15.6C13.8672 16.2207 12.8451 16.5351 11.8066 16.4901C10.7682 16.4452 9.77701 16.0438 9 15.3534V15.75C9 15.9489 8.92098 16.1397 8.78033 16.2803C8.63968 16.421 8.44891 16.5 8.25 16.5C8.05109 16.5 7.86032 16.421 7.71967 16.2803C7.57902 16.1397 7.5 15.9489 7.5 15.75V13.5C7.5 13.3011 7.57902 13.1103 7.71967 12.9697C7.86032 12.829 8.05109 12.75 8.25 12.75H10.5C10.6989 12.75 10.8897 12.829 11.0303 12.9697C11.171 13.1103 11.25 13.3011 11.25 13.5C11.25 13.6989 11.171 13.8897 11.0303 14.0303C10.8897 14.171 10.6989 14.25 10.5 14.25H10.0172C10.5352 14.7039 11.1932 14.9664 11.8814 14.9939C12.5697 15.0214 13.2465 14.8121 13.7991 14.4009C13.9581 14.2813 14.1581 14.2298 14.3551 14.2577C14.5521 14.2855 14.7299 14.3905 14.8495 14.5495C14.9691 14.7085 15.0207 14.9085 14.9928 15.1055C14.9649 15.3025 14.8599 15.4804 14.7009 15.6ZM16.5 11.25C16.5 11.4489 16.421 11.6397 16.2803 11.7803C16.1397 11.921 15.9489 12 15.75 12H13.5C13.3011 12 13.1103 11.921 12.9697 11.7803C12.829 11.6397 12.75 11.4489 12.75 11.25C12.75 11.0511 12.829 10.8603 12.9697 10.7197C13.1103 10.579 13.3011 10.5 13.5 10.5H13.9828C13.4648 10.0461 12.8068 9.78356 12.1186 9.7561C11.4303 9.72863 10.7535 9.93792 10.2009 10.3491C10.0419 10.4687 9.84193 10.5202 9.64493 10.4923C9.44793 10.4645 9.27007 10.3595 9.15047 10.2005C9.03087 10.0415 8.97934 9.84146 9.00721 9.64446C9.03507 9.44746 9.14006 9.2696 9.29906 9.15C10.1328 8.52931 11.1549 8.21494 12.1934 8.25985C13.2318 8.30476 14.223 8.70621 15 9.39656V9C15 8.80109 15.079 8.61032 15.2197 8.46967C15.3603 8.32902 15.5511 8.25 15.75 8.25C15.9489 8.25 16.1397 8.32902 16.2803 8.46967C16.421 8.61032 16.5 8.80109 16.5 9V11.25Z\" fill=\"white\"/></svg>", le = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M17.25 6.5H6.75C6.35218 6.5 5.97064 6.65804 5.68934 6.93934C5.40804 7.22064 5.25 7.60218 5.25 8V10.2497C5.2508 10.5741 5.35599 10.8897 5.55 11.1497L7.5 13.7503V21C7.5 21.3978 7.65804 21.7794 7.93934 22.0607C8.22064 22.342 8.60218 22.5 9 22.5H15C15.3978 22.5 15.7794 22.342 16.0607 22.0607C16.342 21.7794 16.5 21.3978 16.5 21V13.7503L18.45 11.1497C18.644 10.8897 18.7492 10.5741 18.75 10.2497V8C18.75 7.60218 18.592 7.22064 18.3107 6.93934C18.0294 6.65804 17.6478 6.5 17.25 6.5ZM12.75 17.25C12.75 17.4489 12.671 17.6397 12.5303 17.7803C12.3897 17.921 12.1989 18 12 18C11.8011 18 11.6103 17.921 11.4697 17.7803C11.329 17.6397 11.25 17.4489 11.25 17.25V14.25C11.25 14.0511 11.329 13.8603 11.4697 13.7197C11.6103 13.579 11.8011 13.5 12 13.5C12.1989 13.5 12.3897 13.579 12.5303 13.7197C12.671 13.8603 12.75 14.0511 12.75 14.25V17.25Z\" fill=\"white\"/><path d=\"M11.125 3.7V1.3C11.125 1.08783 11.2172 0.884344 11.3813 0.734315C11.5454 0.584285 11.7679 0.5 12 0.5C12.2321 0.5 12.4546 0.584285 12.6187 0.734315C12.7828 0.884344 12.875 1.08783 12.875 1.3V3.7C12.875 3.91217 12.7828 4.11566 12.6187 4.26569C12.4546 4.41571 12.2321 4.5 12 4.5C11.7679 4.5 11.5454 4.41571 11.3813 4.26569C11.2172 4.11566 11.125 3.91217 11.125 3.7Z\" fill=\"white\"/><path d=\"M6.09231 4.97685L4.89231 2.89839C4.78622 2.71464 4.76432 2.49232 4.83141 2.28035C4.89851 2.06837 5.04911 1.8841 5.25008 1.76807C5.45106 1.65203 5.68594 1.61375 5.90307 1.66163C6.12019 1.70951 6.30177 1.83964 6.40785 2.02339L7.60785 4.10185C7.71394 4.2856 7.73585 4.50791 7.66875 4.71989C7.60166 4.93186 7.45106 5.11614 7.25008 5.23217C7.04911 5.3482 6.81422 5.38649 6.5971 5.3386C6.37997 5.29072 6.1984 5.1606 6.09231 4.97685Z\" fill=\"white\"/><path d=\"M16.3922 4.10185L17.5922 2.02339C17.6983 1.83964 17.8799 1.70951 18.097 1.66163C18.3141 1.61375 18.549 1.65203 18.75 1.76807C18.9509 1.8841 19.1015 2.06837 19.1686 2.28035C19.2357 2.49232 19.2138 2.71464 19.1077 2.89839L17.9077 4.97685C17.8016 5.1606 17.6201 5.29072 17.4029 5.33861C17.1858 5.38649 16.9509 5.3482 16.75 5.23217C16.549 5.11614 16.3984 4.93186 16.3313 4.71989C16.2642 4.50791 16.2861 4.2856 16.3922 4.10185Z\" fill=\"white\"/></svg>", ue = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M17.25 1.5H6.75C6.35218 1.5 5.97064 1.65804 5.68934 1.93934C5.40804 2.22064 5.25 2.60218 5.25 3V7.24969C5.2508 7.57411 5.35599 7.88967 5.55 8.14969L7.5 10.7503V21C7.5 21.3978 7.65804 21.7794 7.93934 22.0607C8.22064 22.342 8.60218 22.5 9 22.5H15C15.3978 22.5 15.7794 22.342 16.0607 22.0607C16.342 21.7794 16.5 21.3978 16.5 21V10.7503L18.45 8.14969C18.644 7.88967 18.7492 7.57411 18.75 7.24969V3C18.75 2.60218 18.592 2.22064 18.3107 1.93934C18.0294 1.65804 17.6478 1.5 17.25 1.5ZM12.75 14.25C12.75 14.4489 12.671 14.6397 12.5303 14.7803C12.3897 14.921 12.1989 15 12 15C11.8011 15 11.6103 14.921 11.4697 14.7803C11.329 14.6397 11.25 14.4489 11.25 14.25V11.25C11.25 11.0511 11.329 10.8603 11.4697 10.7197C11.6103 10.579 11.8011 10.5 12 10.5C12.1989 10.5 12.3897 10.579 12.5303 10.7197C12.671 10.8603 12.75 11.0511 12.75 11.25V14.25ZM6.75 5.25V3H17.25V5.25H6.75Z\" fill=\"white\"/></svg>", de = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g opacity=\"0.98\"><path d=\"M19.7156 5.28185L12.2156 3.03185C12.1037 2.99824 11.9854 2.99127 11.8702 3.0115C11.7551 3.03173 11.6462 3.0786 11.5524 3.14837C11.4586 3.21813 11.3824 3.30887 11.3299 3.41332C11.2774 3.51778 11.25 3.63306 11.25 3.74997V13.8993C10.4819 13.2123 9.5013 12.8098 8.47206 12.7589C7.44282 12.7081 6.4273 13.012 5.59523 13.62C4.76317 14.2279 4.16496 15.103 3.9006 16.099C3.63624 17.095 3.72173 18.1516 4.14279 19.0922C4.56386 20.0327 5.29498 20.8002 6.21396 21.2665C7.13295 21.7327 8.18412 21.8695 9.1918 21.6538C10.1995 21.4381 11.1026 20.8831 11.7502 20.0816C12.3979 19.28 12.7508 18.2805 12.75 17.25V9.25779L19.2844 11.2181C19.3964 11.2517 19.5146 11.2587 19.6298 11.2384C19.7449 11.2182 19.8538 11.1713 19.9476 11.1016C20.0414 11.0318 20.1176 10.9411 20.1701 10.8366C20.2226 10.7322 20.25 10.6169 20.25 10.5V5.99997C20.25 5.83873 20.198 5.6818 20.1017 5.55245C20.0054 5.42309 19.8701 5.3282 19.7156 5.28185Z\" fill=\"white\"/></g></svg>", fe = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g opacity=\"0.98\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M4.52987 3.47025C4.76321 3.23691 5.11092 3.19215 5.3912 3.3306C5.42654 3.40214 5.47033 3.47125 5.52987 3.5308L21.4703 19.4703C21.5294 19.5292 21.5976 19.5728 21.6685 19.6079C21.8078 19.8885 21.7635 20.2366 21.5299 20.4703C21.237 20.7626 20.7621 20.7627 20.4693 20.4703L12.7496 12.7505V17.2505C12.7503 18.2809 12.3972 19.2801 11.7496 20.0816C11.1021 20.8829 10.1994 21.4381 9.19198 21.6538C8.1844 21.8694 7.13236 21.7333 6.21347 21.2671C5.29459 20.8009 4.56321 20.0328 4.14218 19.0923C3.72122 18.1519 3.6357 17.095 3.89999 16.0992C4.16433 15.1032 4.76337 14.2286 5.5953 13.6206C6.42729 13.0128 7.44312 12.7085 8.47226 12.7593C9.50127 12.8103 10.4816 13.2131 11.2496 13.8999V11.2505L4.52987 4.5308C4.23726 4.23807 4.23753 3.76315 4.52987 3.47025ZM11.8697 3.01127C11.9848 2.99106 12.1035 2.99824 12.2154 3.03178L19.7154 5.28178C19.8697 5.32808 20.0049 5.42317 20.1012 5.55228C20.1974 5.68164 20.2496 5.83929 20.2496 6.00053V10.5005C20.2495 10.6172 20.2219 10.7322 20.1695 10.8365C20.117 10.9408 20.0406 11.0324 19.9469 11.1021C19.8532 11.1716 19.7444 11.2186 19.6295 11.2388C19.5145 11.259 19.3956 11.2519 19.2838 11.2183L13.65 9.52787L11.2496 7.12748V3.75053C11.2496 3.63371 11.2772 3.518 11.3297 3.41361C11.3821 3.30928 11.4587 3.2187 11.5523 3.14896C11.646 3.07929 11.7547 3.03155 11.8697 3.01127Z\" fill=\"white\"/></g></svg>", pe = "<svg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <style>\n    @keyframes rotate60Delayed {\n      0% { transform: rotate(0deg); }\n      35% { transform: rotate(0deg); }\n      50% { transform: rotate(60deg); }\n      85% { transform: rotate(60deg); }\n      100% { transform: rotate(0deg); }\n    }\n\n    .rotating-paths {\n      transform-box: fill-box;\n      transform-origin: center;\n      animation: rotate60Delayed 2.4s ease-in-out infinite;\n    }\n  </style>\n\n  <g clip-path=\"url(#clip0_882_656)\">\n    <rect width=\"80\" height=\"80\" rx=\"8\" fill=\"black\" fill-opacity=\"0.2\"/>\n    <g class=\"rotating-paths\">\n      <path d=\"M26.3125 21.7058L17.3125 37.2943C16.7158 38.3279 16.5541 39.5562 16.8629 40.709C17.1718 41.8618 17.926 42.8447 18.9596 43.4414L47.5385 59.9414C48.572 60.5381 49.8003 60.6999 50.9531 60.391C52.1059 60.0821 53.0888 59.3279 53.6856 58.2943L62.6856 42.7058C63.2823 41.6723 63.444 40.444 63.1351 39.2911C62.8262 38.1383 62.072 37.1555 61.0385 36.5587L32.4596 20.0587C31.426 19.462 30.1977 19.3003 29.0449 19.6092C27.8921 19.9181 26.9092 20.6723 26.3125 21.7058ZM30.9058 34.7501C30.6833 35.1355 30.3515 35.4462 29.9524 35.643C29.5532 35.8398 29.1047 35.9139 28.6635 35.8558C28.2223 35.7977 27.8083 35.6101 27.4737 35.3167C27.1391 35.0233 26.8991 34.6373 26.7839 34.2074C26.6687 33.7776 26.6836 33.3232 26.8266 32.9018C26.9697 32.4804 27.2344 32.1109 27.5875 31.84C27.9405 31.5691 28.366 31.409 28.8101 31.3799C29.2541 31.3508 29.6968 31.454 30.0822 31.6765C30.599 31.9749 30.9761 32.4663 31.1305 33.0427C31.285 33.6191 31.2041 34.2333 30.9058 34.7501Z\" fill=\"white\"/>\n      <path d=\"M13.3929 28.6449L15.04 34.792C15.0916 34.9843 15.0646 35.1891 14.9651 35.3615C14.8656 35.5338 14.7017 35.6596 14.5094 35.7111C14.3172 35.7626 14.1124 35.7356 13.94 35.6361C13.7676 35.5366 13.6419 35.3727 13.5904 35.1805L12.4125 30.7819L8.81761 37.0084C7.72612 38.9038 7.43106 41.1549 7.99717 43.2676C8.56328 45.3804 9.94432 47.1823 11.8373 48.2781C12.0096 48.3775 12.1353 48.5413 12.1868 48.7335C12.2382 48.9256 12.2113 49.1303 12.1118 49.3026C12.0124 49.4749 11.8486 49.6006 11.6564 49.652C11.4643 49.7035 11.2596 49.6766 11.0873 49.5771C8.84999 48.2822 7.21771 46.1527 6.54866 43.6557C5.87961 41.1588 6.22842 38.4984 7.51857 36.2584L11.1134 30.0319L6.7152 31.2111C6.62001 31.2366 6.52073 31.2431 6.42302 31.2302C6.32532 31.2174 6.23111 31.1854 6.14576 31.1361C6.06042 31.0869 5.98562 31.0213 5.92563 30.9431C5.86564 30.8649 5.82163 30.7757 5.79613 30.6805C5.74462 30.4882 5.77158 30.2834 5.87109 30.111C5.92037 30.0257 5.98597 29.9509 6.06415 29.8909C6.14233 29.8309 6.23156 29.7869 6.32675 29.7614L12.4739 28.1143C12.5691 28.0887 12.6683 28.0822 12.7661 28.095C12.8638 28.1079 12.958 28.1398 13.0434 28.1891C13.1287 28.2384 13.2035 28.304 13.2635 28.3822C13.3235 28.4604 13.3675 28.5497 13.3929 28.6449Z\" fill=\"white\"/>\n      <path d=\"M73.6728 50.2386L67.5257 51.8857C67.4305 51.9112 67.3312 51.9178 67.2335 51.905C67.1357 51.8921 67.0415 51.8601 66.9561 51.8109C66.8708 51.7616 66.796 51.696 66.736 51.6177C66.676 51.5395 66.6321 51.4503 66.6066 51.3551L64.9595 45.2079C64.908 45.0157 64.9349 44.8109 65.0344 44.6385C65.134 44.4661 65.2979 44.3404 65.4901 44.2889C65.6823 44.2374 65.8872 44.2643 66.0595 44.3638C66.2319 44.4633 66.3577 44.6272 66.4092 44.8195L67.5871 49.2181L71.1819 42.9916C72.2734 41.0961 72.5685 38.8451 72.0024 36.7323C71.4363 34.6196 70.0552 32.8177 68.1622 31.7219C67.99 31.6224 67.8643 31.4586 67.8128 31.2665C67.7613 31.0744 67.7882 30.8696 67.8877 30.6974C67.9872 30.5251 68.151 30.3994 68.3431 30.3479C68.5352 30.2964 68.74 30.3234 68.9122 30.4229C71.1495 31.7177 72.7818 33.8473 73.4509 36.3442C74.1199 38.8412 73.7711 41.5015 72.481 43.7416L68.8861 49.9681L73.2843 48.7889C73.4766 48.7374 73.6814 48.7643 73.8538 48.8638C74.0261 48.9633 74.1519 49.1273 74.2034 49.3195C74.2549 49.5117 74.228 49.7166 74.1284 49.8889C74.0289 50.0613 73.865 50.1871 73.6728 50.2386Z\" fill=\"white\"/>\n    </g>\n  </g>\n  <defs>\n    <clipPath id=\"clip0_882_656\">\n      <rect width=\"80\" height=\"80\" rx=\"8\" fill=\"white\"/>\n    </clipPath>\n  </defs>\n</svg>", me = {
	close: {
		icon: oe,
		label: "Close scanner",
		isHidden: !1
	},
	loadImage: {
		icon: se,
		label: "Load image",
		isHidden: !1
	},
	cameraSwitch: {
		icon: ce,
		label: "Switch camera",
		isHidden: !1
	},
	flash: {
		icon: le,
		label: "Toggle flash",
		isHidden: !1
	},
	flashOff: { icon: ue },
	sound: {
		icon: de,
		label: "Toggle sound",
		isHidden: !1
	},
	soundOff: { icon: fe }
}, he = {
	passportLabel: "Passport",
	idLabel: "ID",
	visaLabel: "Visa",
	allLabel: "All"
}, ge = {
	positionMRZ: "Position MRZ within the frame",
	holdSteady: "Hold steady...",
	scanSuccess: "MRZ scanned ✓",
	flipDocument: "Now scan the portrait side",
	flipDocumentCountdown: "Flip and scan the other side ({seconds}s)",
	positionPortrait: "Position portrait within the frame",
	scanMRZFirst: "Scan the MRZ side first",
	scanningPortrait: "Scanning portrait...",
	portraitScanned: "Portrait scanned ✓",
	bothSidesScanned: "Both sides scanned ✓",
	skipPortraitLabel: "Skip portrait scan",
	loadImageFailed: "Failed to load image",
	cameraAccessDenied: "Camera access denied",
	rotateDevice: "Please rotate your device to portrait mode"
}, _e = {
	colors: {
		primary: "--mrz-primary",
		accent: "--mrz-accent",
		backgroundDark: "--mrz-background-dark",
		backgroundBadge: "--mrz-background-badge",
		backgroundOverlay: "--mrz-background-overlay",
		backgroundSkipLabel: "--mrz-background-skip-label",
		text: "--mrz-text",
		textSecondary: "--mrz-text-secondary",
		divider: "--mrz-divider",
		guideFrame: "--mrz-guide-frame",
		spinnerColor: "--mrz-spinner-color",
		spinnerBackground: "--mrz-spinner-background"
	},
	typography: {
		fontFamily: "--mrz-font-family",
		badgeFontSize: "--mrz-badge-font-size",
		badgeFontSizeDesktop: "--mrz-badge-font-size-desktop",
		formatBtnFontSize: "--mrz-format-btn-font-size",
		formatBtnFontSizeSmall: "--mrz-format-btn-font-size-small"
	},
	spacing: {
		topBarHeight: "--mrz-top-bar-height",
		topBarHeightDesktop: "--mrz-top-bar-height-desktop",
		guideFrameWidth: "--mrz-guide-frame-width",
		guideFrameWidthDesktop: "--mrz-guide-frame-width-desktop",
		badgeMargin: "--mrz-badge-margin",
		badgeBorderRadius: "--mrz-badge-border-radius"
	}
};
function ve(e) {
	if (!e) return "";
	let t = [];
	for (let [n, r] of Object.entries(_e)) {
		let i = e[n];
		if (i) for (let [e, n] of Object.entries(r)) {
			let r = i[e];
			r && t.push(`${n}: ${r};`);
		}
	}
	return t.length > 0 ? `.mrz-scanner-overlay {\n  ${t.join("\n  ")}\n}` : "";
}
var ye = "\n  .dce-scanguide-passport,\n  .dce-scanguide-td1,\n  .dce-scanguide-td2 {\n    display: none !important;\n  }\n", be = "\n  .mrz-scanner-overlay {\n    position: absolute;\n    top: 0; left: 0; right: 0; bottom: 0;\n    pointer-events: none;\n    z-index: 100;\n    font-family: var(--mrz-font-family, -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", Arial, sans-serif);\n    box-sizing: border-box;\n  }\n\n  /* ── Top bar ── */\n  .mrz-top-bar {\n    position: absolute;\n    top: 0; left: 0; right: 0;\n    height: calc(var(--mrz-top-bar-height, 56px) + env(safe-area-inset-top, 0px));\n    background: var(--mrz-background-dark, #000);\n    display: flex;\n    flex-direction: column;\n    pointer-events: auto;\n  }\n\n  /* Absorbs the notch / Dynamic Island zone — no buttons ever live here */\n  .mrz-top-safe-spacer {\n    height: env(safe-area-inset-top, 0px);\n    flex-shrink: 0;\n  }\n\n  /* Fixed-height row that always holds the buttons — centred unconditionally */\n  .mrz-top-bar-inner {\n    flex: 0 0 var(--mrz-top-bar-height, 56px);\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    padding: 0 12px 0 8px;\n  }\n\n  .mrz-top-controls {\n    display: flex;\n    align-items: center;\n    gap: 2px;\n  }\n\n  .mrz-icon-btn {\n    background: none;\n    border: none;\n    outline: none;\n    box-shadow: none;\n    cursor: pointer;\n    color: var(--mrz-text, #fff);\n    padding: 0 10px;\n    align-self: center;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    -webkit-tap-highlight-color: transparent;\n    touch-action: manipulation;\n    user-select: none;\n    -webkit-user-select: none;\n  }\n\n  .mrz-icon-btn:active {\n    opacity: 0.6;\n  }\n\n  /* Close button — tight 20×20 viewBox (~90% coverage), keep visually small */\n  .mrz-close-btn svg {\n    width: 22px;\n    height: 22px;\n    display: block;\n  }\n\n  /*\n   * Top-controls action icons — 24×24 viewBox rendered at 24 px.\n   */\n  .mrz-top-controls .mrz-icon-btn svg {\n    width: 24px;\n    height: 24px;\n    display: block;\n  }\n\n  /*\n   * Flash / sound buttons wrap their SVGs in <span> elements for dual-state\n   * toggling. Spans are inline by default which adds a descender gap below\n   * the SVG and shifts it off-centre. Make them flex containers to match the\n   * layout of buttons whose SVG is a direct child.\n   */\n  .mrz-icon-btn span {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n  }\n\n  .mrz-icon-btn.mrz-hidden {\n    display: none;\n  }\n\n  /* Hide a divider whose preceding button is hidden (prevents orphan / double dividers) */\n  .mrz-icon-btn.mrz-hidden + .mrz-top-divider {\n    display: none;\n  }\n\n  .mrz-top-divider {\n    width: 1px;\n    height: 24px;\n    background: var(--mrz-divider, rgba(255, 255, 255, 0.3));\n    margin: 0 4px;\n    flex-shrink: 0;\n    align-self: center;\n  }\n\n  /* ── Guide wrapper (positions frame + badge together) ── */\n  .mrz-guide-wrapper {\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -46%);\n    width: var(--mrz-guide-frame-width, min(88vw, 520px));\n    pointer-events: none;\n  }\n\n  /* ── Above-guide wrapper — positions badge + progress indicator above the guide frame ── */\n  .mrz-above-guide {\n    position: absolute;\n    bottom: 100%;\n    left: 50%;\n    transform: translateX(-50%);\n    margin-bottom: var(--mrz-badge-margin, 8px);\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 6px;\n    pointer-events: none;\n  }\n\n  .mrz-badge {\n    background: var(--mrz-background-badge, rgba(0, 0, 0, 0.72));\n    border-radius: var(--mrz-badge-border-radius, 20px);\n    padding: 10px 20px;\n    text-align: center;\n    white-space: nowrap;\n    pointer-events: none;\n    display: none;\n    flex-direction: column;\n    gap: 3px;\n  }\n\n  .mrz-badge.mrz-badge-visible {\n    display: flex;\n  }\n\n  .mrz-badge-line {\n    font-size: var(--mrz-badge-font-size, 14px);\n    font-weight: 500;\n    color: var(--mrz-text, #fff);\n    line-height: 1.4;\n    letter-spacing: 0.1px;\n  }\n\n  .mrz-badge-line.mrz-success {\n    color: var(--mrz-accent, #FF9F40);\n  }\n\n  /* ── Guide frame ── */\n  .mrz-guide-frame {\n    position: relative;\n    width: 100%;\n    color: var(--mrz-guide-frame, #fff);\n    transition: color 0.35s ease;\n    pointer-events: none;\n  }\n\n  .mrz-guide-frame.mrz-guide-success {\n    color: var(--mrz-primary, #4CAF50);\n  }\n\n  .mrz-guide-frame svg {\n    width: 100%;\n    height: auto;\n    display: block;\n  }\n\n  /* ── Flip animation ── */\n  .mrz-flip-animation {\n    display: none;\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    width: 160px;\n    height: 100px;\n    perspective: 600px;\n  }\n\n  .mrz-flip-animation.mrz-flip-visible {\n    display: block;\n  }\n\n  .mrz-flip-card {\n    position: relative;\n    width: 100%;\n    height: 100%;\n    transform-style: preserve-3d;\n  }\n\n  .mrz-flip-card.mrz-flip-animate {\n    animation: mrz-card-flip 0.8s ease-in-out forwards;\n  }\n\n  .mrz-flip-card-front,\n  .mrz-flip-card-back {\n    position: absolute;\n    width: 100%;\n    height: 100%;\n    backface-visibility: hidden;\n    -webkit-backface-visibility: hidden;\n  }\n\n  .mrz-flip-card-back {\n    transform: rotateY(180deg);\n  }\n\n  @keyframes mrz-card-flip {\n    0%   { transform: rotateY(0deg); }\n    100% { transform: rotateY(180deg); }\n  }\n\n  /* ── Bottom bar / Format selector ── */\n  .mrz-format-selector {\n    position: absolute;\n    bottom: 0;\n    left: 0;\n    right: 0;\n    background: var(--mrz-background-overlay, rgba(0, 0, 0, 0.85));\n    padding: 10px 16px calc(20px + env(safe-area-inset-bottom, 0px));\n    overflow: hidden;\n    pointer-events: auto;\n    touch-action: pan-y;\n  }\n\n  /* Row that holds the format buttons plus the sliding indicator */\n  .mrz-format-buttons-row {\n    position: relative;\n    display: flex;\n    align-items: center;\n    width: 100%;\n    padding-top: 10px;\n    transition: transform 0.25s ease;\n  }\n\n  /* Indicator always centered above the format buttons */\n  .mrz-format-indicator {\n    position: absolute;\n    top: 0;\n    left: 50%;\n    transform: translateX(-50%);\n    height: 3px;\n    width: 32px;\n    background: var(--mrz-text, #fff);\n    border-radius: 2px;\n    pointer-events: none;\n  }\n\n  .mrz-format-btn {\n    flex: 1;\n    text-align: center;\n    background: none;\n    border: none;\n    outline: none;\n    box-shadow: none;\n    color: var(--mrz-text-secondary, rgba(255, 255, 255, 0.8));\n    font-size: var(--mrz-format-btn-font-size, 15px);\n    font-weight: 400;\n    padding: 8px 0;\n    cursor: pointer;\n    letter-spacing: 0.2px;\n    -webkit-tap-highlight-color: transparent;\n    touch-action: manipulation;\n    user-select: none;\n    -webkit-user-select: none;\n    transition: color 0.15s ease, font-weight 0.15s ease;\n    font-family: inherit;\n  }\n\n  .mrz-format-btn.mrz-format-active {\n    color: var(--mrz-text, #fff);\n    font-weight: 700;\n  }\n\n  @media (max-width: 400px) {\n    .mrz-format-btn {\n      padding: 8px 14px;\n      font-size: var(--mrz-format-btn-font-size-small, 14px);\n    }\n  }\n\n  /* ── Skip-portrait label (shown after 5 s timeout in portrait phase) ── */\n  .mrz-skip-portrait-label {\n    position: absolute;\n    top: calc(100% + 12px);\n    left: 50%;\n    transform: translateX(-50%);\n    background: var(--mrz-background-skip-label, rgba(55, 55, 55, 0.92));\n    border-radius: 50px;\n    color: var(--mrz-text, #fff);\n    font-size: 14px;\n    font-weight: 400;\n    letter-spacing: 0.1px;\n    line-height: 1.4;\n    text-align: center;\n    white-space: nowrap;\n    padding: 12px 20px;\n    display: none;\n    pointer-events: none;\n    -webkit-tap-highlight-color: transparent;\n    touch-action: manipulation;\n    user-select: none;\n    -webkit-user-select: none;\n  }\n\n  .mrz-skip-portrait-label.mrz-skip-portrait-visible {\n    display: block;\n    pointer-events: auto;\n    cursor: pointer;\n  }\n\n  /* ── Portrait-only overlay (shown on mobile in landscape) ── */\n  .mrz-rotation-overlay {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0, 0, 0, 0.98);\n    display: none;\n    justify-content: center;\n    align-items: center;\n    z-index: 10000;\n    color: var(--mrz-text, #fff);\n    pointer-events: auto;\n  }\n\n  .mrz-rotation-overlay.mrz-rotation-visible {\n    display: flex;\n  }\n\n  .mrz-rotation-content {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 1.5rem;\n    padding: 2rem;\n    text-align: center;\n    max-width: 90%;\n  }\n\n  .mrz-rotation-content svg {\n    width: 80px;\n    height: 80px;\n  }\n\n  .mrz-rotation-message {\n    font-size: 18px;\n    font-weight: 500;\n    line-height: 1.4;\n  }\n\n  @media (min-width: 1024px) {\n    .mrz-top-bar {\n      height: calc(var(--mrz-top-bar-height-desktop, 60px) + env(safe-area-inset-top, 0px));\n    }\n    .mrz-top-bar-inner {\n      flex-basis: var(--mrz-top-bar-height-desktop, 60px);\n    }\n    .mrz-badge-line {\n      font-size: var(--mrz-badge-font-size-desktop, 15px);\n    }\n    .mrz-guide-wrapper {\n      width: var(--mrz-guide-frame-width-desktop, min(60vw, 600px));\n    }\n  }\n";
function xe(e) {
	e.addEventListener("keydown", (t) => {
		(t.key === "Enter" || t.key === " ") && (t.preventDefault(), e.click());
	});
}
function Q(e, t, n) {
	let r = document.createElement("div");
	return r.className = `mrz-icon-btn ${e}`, r.setAttribute("role", "button"), r.setAttribute("aria-label", t), r.setAttribute("tabindex", "0"), r.innerHTML = n, xe(r), r;
}
function Se(e) {
	let { showLoadImage: t, showFormatSelector: n, visibleFormatButtons: r = [
		"visa",
		"all",
		"passport",
		"id"
	], showSoundToggle: i, toolbarButtonsConfig: a, formatSelectorConfig: o, messagesConfig: s, themeConfig: c } = e, l = (e) => ({
		...me[e],
		...a?.[e]
	}), u = {
		close: l("close"),
		loadImage: l("loadImage"),
		cameraSwitch: l("cameraSwitch"),
		flash: l("flash"),
		flashOff: l("flashOff"),
		sound: l("sound"),
		soundOff: l("soundOff")
	}, d = ee(he, o), f = ee(ge, s), p = document.createElement("div");
	p.className = "mrz-scanner-overlay";
	let m = document.createElement("div");
	m.className = "mrz-top-bar";
	let h = document.createElement("div");
	h.className = "mrz-top-safe-spacer";
	let g = document.createElement("div");
	g.className = "mrz-top-bar-inner";
	let _ = Q("mrz-close-btn", u.close.label, u.close.icon);
	u.close.className && _.classList.add(u.close.className), u.close.isHidden && _.classList.add("mrz-hidden");
	let v = document.createElement("div");
	v.className = "mrz-top-controls";
	let y = Q("mrz-load-image-btn", u.loadImage.label, u.loadImage.icon);
	u.loadImage.className && y.classList.add(u.loadImage.className), (!t || u.loadImage.isHidden) && y.classList.add("mrz-hidden");
	let b = document.createElement("span");
	b.className = "mrz-top-divider", (!t || u.loadImage.isHidden) && b.classList.add("mrz-hidden");
	let x = Q("mrz-camera-btn", u.cameraSwitch.label, u.cameraSwitch.icon);
	u.cameraSwitch.className && x.classList.add(u.cameraSwitch.className), u.cameraSwitch.isHidden && x.classList.add("mrz-hidden");
	let S = document.createElement("span");
	S.className = "mrz-top-divider";
	let C = Q("mrz-flash-btn", u.flash.label, "");
	u.flash.className && C.classList.add(u.flash.className), u.flash.isHidden && C.classList.add("mrz-hidden");
	let w = document.createElement("span");
	w.innerHTML = u.flashOff.icon;
	let T = document.createElement("span");
	T.innerHTML = u.flash.icon, T.style.display = "none", C.appendChild(w), C.appendChild(T);
	let E = Q("mrz-sound-btn", u.sound.label, "");
	u.sound.className && E.classList.add(u.sound.className), (!i || u.sound.isHidden) && E.classList.add("mrz-hidden");
	let D = document.createElement("span");
	D.innerHTML = u.soundOff.icon;
	let O = document.createElement("span");
	O.innerHTML = u.sound.icon, O.style.display = "none", E.appendChild(D), E.appendChild(O), v.append(y, b, x, S, C, E), g.append(_, v), m.append(h, g);
	let k = document.createElement("div");
	k.className = "mrz-guide-wrapper";
	let A = document.createElement("div");
	A.className = "mrz-badge";
	let j = document.createElement("span");
	j.className = "mrz-badge-line";
	let M = document.createElement("span");
	M.className = "mrz-badge-line", M.style.display = "none", A.append(j, M);
	let N = document.createElement("div");
	N.className = "mrz-above-guide", N.append(A);
	let P = document.createElement("div");
	P.className = "mrz-guide-frame", P.innerHTML = ne;
	let F = document.createElement("div");
	F.className = "mrz-flip-animation";
	let I = document.createElement("div");
	I.className = "mrz-flip-card";
	let L = document.createElement("div");
	L.className = "mrz-flip-card-front", L.innerHTML = ie;
	let R = document.createElement("div");
	R.className = "mrz-flip-card-back", R.innerHTML = ae, I.append(L, R), F.appendChild(I), P.appendChild(F);
	let z = document.createElement("div");
	z.className = "mrz-skip-portrait-label", z.setAttribute("role", "button"), z.setAttribute("tabindex", "0"), z.textContent = f.skipPortraitLabel, xe(z), k.append(N, P, z);
	let B = null, V = null, H = null, U = null, W = null, G = null;
	if (n) {
		B = document.createElement("div"), B.className = "mrz-format-selector";
		let e = document.createElement("div");
		e.className = "mrz-format-buttons-row";
		let t = (e, t = !1) => {
			let n = document.createElement("div");
			return n.className = `mrz-format-btn${t ? " mrz-format-active" : ""}`, n.setAttribute("role", "button"), n.setAttribute("tabindex", "0"), n.textContent = e, xe(n), n;
		};
		for (let n of r) switch (n) {
			case "visa":
				U = t(d.visaLabel), e.append(U);
				break;
			case "all":
				W = t(d.allLabel, !0), e.append(W);
				break;
			case "passport":
				V = t(d.passportLabel), e.append(V);
				break;
			case "id":
				H = t(d.idLabel), e.append(H);
				break;
		}
		G = document.createElement("div"), G.className = "mrz-format-indicator", B.append(G, e);
	}
	let K = document.createElement("div");
	K.className = "mrz-rotation-overlay";
	let q = document.createElement("div");
	q.className = "mrz-rotation-content";
	let J = document.createElement("div");
	J.innerHTML = pe;
	let Y = document.createElement("div");
	Y.className = "mrz-rotation-message", Y.textContent = f.rotateDevice, q.append(J, Y), K.appendChild(q), p.append(m, k), B && p.appendChild(B), p.appendChild(K);
	let X = ve(c);
	if (X) {
		let e = document.createElement("style");
		e.textContent = X, p.appendChild(e);
	}
	return {
		overlay: p,
		closeBtn: _,
		loadImageBtn: y,
		cameraSwitchBtn: x,
		flashBtn: C,
		flashOnIcon: T,
		flashOffIcon: w,
		soundBtn: E,
		soundOnIcon: O,
		soundOffIcon: D,
		badge: A,
		badgeLine1: j,
		badgeLine2: M,
		guideFrame: P,
		flipAnimation: F,
		skipPortraitLabel: z,
		formatSelector: B,
		formatPassportBtn: V,
		formatIdBtn: H,
		formatVisaBtn: U,
		formatAllBtn: W,
		formatIndicator: G,
		rotationOverlay: K
	};
}
//#endregion
//#region src/views/MRZScannerView.ts
var Ce = {
	width: 125,
	height: 88
}, $ = [
	o.CT_MRTD_TD1_ID,
	o.CT_MRTD_TD2_ID,
	o.CT_MRTD_TD3_PASSPORT,
	o.CT_MRTD_TD2_VISA,
	o.CT_MRTD_TD3_VISA,
	o.CT_MRTD_TD2_FRENCH_ID
], we = {
	[_.Passport]: [o.CT_MRTD_TD3_PASSPORT],
	[_.TD1]: [o.CT_MRTD_TD1_ID],
	[_.TD2]: [o.CT_MRTD_TD2_ID, o.CT_MRTD_TD2_FRENCH_ID],
	[_.MRVA]: [o.CT_MRTD_TD3_VISA],
	[_.MRVB]: [o.CT_MRTD_TD2_VISA]
}, Te = {
	...Object.fromEntries($.map((e) => [e, Ce])),
	[o.CT_MRTD_TD1_ID]: {
		width: 85.6,
		height: 53.98
	},
	[o.CT_MRTD_TD2_ID]: {
		width: 105,
		height: 74
	},
	[o.CT_MRTD_TD2_VISA]: {
		width: 120,
		height: 80
	},
	[o.CT_MRTD_TD3_VISA]: {
		width: 105,
		height: 74
	},
	[o.CT_MRTD_TD2_FRENCH_ID]: {
		width: 105,
		height: 74
	}
}, Ee = 14, De = class e {
	static {
		this.FORMAT_ORDER = [
			"visa",
			"all",
			"passport",
			"id"
		];
	}
	static {
		this.PORTRAIT_SKIP_TIMEOUT_MS = 5e3;
	}
	static {
		this.SAME_SIDE_MISSES_BEFORE_FLIP = 3;
	}
	static {
		this.PORTRAIT_STABLE_FRAMES_REQUIRED = 3;
	}
	showScannerLoadingOverlay(e) {
		let t = S(this.config.container);
		if (!t) throw Error("Scanner view container not found");
		this.loadingScreen = D(t, { message: e }), t.style.display = "block", t.style.position = "relative";
	}
	hideScannerLoadingOverlay(e = !1) {
		this.loadingScreen && (this.loadingScreen.hide(), this.loadingScreen = null, e && (S(this.config.container).style.display = "none"));
	}
	constructor(e, t) {
		this.resources = e, this.config = t, this.isSoundFeedbackOn = !1, this.isFlashOn = !1, this.currentFormatMode = "all", this.currentScanMode = v.All, this.resizeTimer = null, this.defaultBackCameraId = null, this.originalImageData = null, this.initialized = !1, this.initializedUI = !1, this.isMRZScanned = !1, this.isPortraitScanned = !1, this.areSidesDifferent = !1, this.isWaitingForFlip = !1, this.flipTimeoutHandle = null, this.flipCountdownHandle = null, this.portraitSkipTimerHandle = null, this.isProcessingSameSideFrame = !1, this.isProcessingPortraitFrame = !1, this.sameSideMissCount = 0, this.consecutiveStablePortraitFrames = 0, this.latestLocalizedTextLines = null, this.mrzSideData = {
			processedData: null,
			primaryOriginalImage: null,
			primaryDocumentImage: null,
			portraitImage: null
		}, this.ui = null, this.scanSpinnerEl = null, this.loadingScreen = null, this.handleResize = () => {
			this.setGuideFrameVisible(!1), this.resizeTimer && window.clearTimeout(this.resizeTimer), this.resizeTimer = window.setTimeout(() => {
				this.setGuideFrameVisible(this.config.enableScanRegion !== !1), this.updateScanRegion();
			}, 500);
		}, this.firstFrame = !0, this.hasSwitchedToFullTemplate = !1, this.messages = {
			...ge,
			...t.messagesConfig
		};
	}
	async initialize() {
		if (!this.initialized) {
			this.initializeScanModeManager(), this.currentScanMode = this.getScanMode(), C("dynamsoft-mrz-loading-screen-style", O), C("dynamsoft-mrz-scanner-view-style", be);
			try {
				let { cameraView: e, cameraEnhancer: t, cvRouter: r } = this.resources;
				if (!e || !t || !r) throw Error("Camera resources not initialized");
				try {
					e.setScanRegionMaskStyle({
						strokeStyle: "transparent",
						fillStyle: "transparent",
						lineWidth: 0
					}), e.setVideoFit("cover");
				} catch {}
				if (r.setInput(t), this.config.enableMultiFrameCrossFilter === !0) {
					let e = new p();
					e.enableResultCrossVerification(a.CRIT_TEXT_LINE, !0), await r.addResultFilter(e);
				}
				let i = new n();
				if (i.onCapturedResultReceived = (e) => this.handleMRZResult(e), r.addResultReceiver(i), this.resources.returnPortraitImage) {
					let e = new d();
					e.onLocalizedTextLinesReceived = (e) => {
						this.latestLocalizedTextLines = e;
					}, r.getIntermediateResultManager().addResultReceiver(e);
				}
				this.initialized = !0;
			} catch (e) {
				let t = e?.message || e;
				console.error(t), alert(t), this.closeCamera();
				let n = new R({ status: x.RS_FAILED });
				this.currentScanResolver?.(n);
			}
		}
	}
	initializeUI() {
		let e = S(this.config.container);
		if (!e) throw Error("Container element not found");
		let t = e.children[e.children.length - 1];
		if (t?.shadowRoot) {
			if (!t.shadowRoot.querySelector("#mrz-dce-hide-style")) {
				let e = document.createElement("style");
				e.id = "mrz-dce-hide-style", e.textContent = ye, t.shadowRoot.appendChild(e);
			}
			if (this.scanSpinnerEl = t.shadowRoot.querySelector(".dce-mn-scan-spinner"), this.scanSpinnerEl) {
				let e = this.config.themeConfig?.colors;
				e?.spinnerColor && this.scanSpinnerEl.style.setProperty("--mrz-spinner-color", e.spinnerColor), e?.spinnerBackground && this.scanSpinnerEl.style.setProperty("--mrz-spinner-background", e.spinnerBackground);
			}
		}
		let n = this.config.showLoadImageButton !== !1, r = this.getVisibleFormatButtons(), i = this.config.showFormatSelector === !0, a = this.config.showSoundToggle !== !1;
		if (this.ui = Se({
			showLoadImage: n,
			showFormatSelector: i,
			visibleFormatButtons: r,
			showSoundToggle: a,
			toolbarButtonsConfig: this.config.toolbarButtonsConfig,
			formatSelectorConfig: this.config.formatSelectorConfig,
			messagesConfig: this.config.messagesConfig,
			themeConfig: this.config.themeConfig
		}), e.appendChild(this.ui.overlay), this.ui.closeBtn.addEventListener("click", () => this.handleCloseBtn()), this.ui.loadImageBtn.addEventListener("click", () => this.loadImageFile()), this.ui.cameraSwitchBtn.addEventListener("click", () => this.switchCamera()), this.ui.flashBtn.addEventListener("click", () => this.toggleFlash()), this.ui.soundBtn.addEventListener("click", () => this.toggleSoundFeedback()), this.ui.skipPortraitLabel.addEventListener("click", () => this.handleSkipPortrait()), this.ui.formatPassportBtn && this.ui.formatPassportBtn.addEventListener("click", () => this.setFormatMode("passport")), this.ui.formatIdBtn && this.ui.formatIdBtn.addEventListener("click", () => this.setFormatMode("id")), this.ui.formatVisaBtn && this.ui.formatVisaBtn.addEventListener("click", () => this.setFormatMode("visa")), this.ui.formatAllBtn && this.ui.formatAllBtn.addEventListener("click", () => this.setFormatMode("all")), this.ui.formatSelector) {
			let e = 0;
			this.ui.formatSelector.addEventListener("touchstart", (t) => {
				e = t.touches[0].clientX;
			}, { passive: !0 }), this.ui.formatSelector.addEventListener("touchend", (t) => {
				let n = t.changedTouches[0].clientX - e;
				if (Math.abs(n) < 50) return;
				let r = this.getVisibleFormatButtons(), i = r.indexOf(this.currentFormatMode);
				i < 0 || (n < 0 && i < r.length - 1 ? this.setFormatMode(r[i + 1]) : n > 0 && i > 0 && this.setFormatMode(r[i - 1]));
			}, { passive: !0 });
		}
		this.toggleSoundFeedback(!1), this.syncFormatButtons(), this.ui.flashBtn.classList.add("mrz-hidden"), this.setupPortraitOnlyMode(), this.initializedUI = !0;
	}
	getEnabledTypes() {
		let e = this.config.mrzFormatType;
		if (!e) return new Set($);
		let t = (Array.isArray(e) ? e : [e]).flatMap((e) => we[e]);
		return t.length > 0 ? new Set(t) : new Set($);
	}
	getVisibleFormatButtons() {
		let t = this.getEnabledTypes(), n = [
			"passport",
			"id",
			"visa"
		].filter((n) => e.FORMAT_DOC_TYPES[n].some((e) => t.has(e)));
		return n.length <= 1 ? n : ["all", ...n];
	}
	async toggleFlash() {
		try {
			let { cameraEnhancer: e } = this.resources;
			if (!e) return;
			this.isFlashOn ? (await e.turnOffTorch(), this.isFlashOn = !1) : (await e.turnOnTorch(), this.isFlashOn = !0), this.syncFlashIcon();
		} catch {
			this.ui?.flashBtn.classList.add("mrz-hidden");
		}
	}
	syncFlashIcon() {
		this.ui && (this.ui.flashOnIcon.style.display = this.isFlashOn ? "inline" : "none", this.ui.flashOffIcon.style.display = this.isFlashOn ? "none" : "inline");
	}
	probeFlashSupport() {
		try {
			let { cameraEnhancer: e } = this.resources;
			if (!e) return;
			let t = e.getCapabilities();
			t && t.torch ? this.ui?.flashBtn.classList.remove("mrz-hidden") : this.ui?.flashBtn.classList.add("mrz-hidden");
		} catch {
			this.ui?.flashBtn.classList.add("mrz-hidden");
		}
	}
	async switchCamera() {
		try {
			let { cameraEnhancer: e } = this.resources;
			if (!e) return;
			let t = (await navigator.mediaDevices.enumerateDevices()).filter((e) => e.kind === "videoinput").map((e) => ({
				deviceId: e.deviceId,
				label: e.label
			}));
			if (t.length <= 1) {
				this.ui?.cameraSwitchBtn.classList.add("mrz-hidden");
				return;
			}
			let n = e.getCameraSettings()?.deviceId === this.defaultBackCameraId, r;
			if (r = n ? t.find((e) => /front|user|selfie/i.test(e.label)) ?? t.find((e) => e.deviceId !== this.defaultBackCameraId) : t.find((e) => e.deviceId === this.defaultBackCameraId), !r) return;
			await e.selectCamera(r.deviceId), this.setGuideFrameVisible(!1), window.setTimeout(() => {
				this.setGuideFrameVisible(this.config.enableScanRegion !== !1), this.updateScanRegion();
			}, 300);
		} catch (e) {
			console.warn("Camera switch failed:", e?.message || e);
		}
	}
	toggleSoundFeedback(e) {
		this.isSoundFeedbackOn = e === void 0 ? !this.isSoundFeedbackOn : e, this.ui && (this.ui.soundOnIcon.style.display = this.isSoundFeedbackOn ? "inline" : "none", this.ui.soundOffIcon.style.display = this.isSoundFeedbackOn ? "none" : "inline");
	}
	setGuideFrame(e) {
		if (!this.ui) return;
		let { flipAnimation: t } = this.ui;
		this.ui.guideFrame.innerHTML = e === "mrz" ? ne : re, this.ui.guideFrame.appendChild(t);
	}
	setGuideFrameVisible(e) {
		this.ui && (this.ui.guideFrame.style.visibility = e ? "visible" : "hidden");
	}
	showGuideSuccessBorder(e = 1e3) {
		this.ui && (this.ui.guideFrame.classList.add("mrz-guide-success"), window.setTimeout(() => {
			this.ui?.guideFrame.classList.remove("mrz-guide-success");
		}, e));
	}
	showFlipAnimation() {
		if (!this.ui) return;
		let { flipAnimation: e } = this.ui, t = e.querySelector(".mrz-flip-card");
		t && (t.classList.remove("mrz-flip-animate"), e.classList.add("mrz-flip-visible"), t.offsetWidth, t.classList.add("mrz-flip-animate"), t.addEventListener("animationend", () => {
			window.setTimeout(() => this.hideFlipAnimation(), 2e3);
		}, { once: !0 }));
	}
	hideFlipAnimation() {
		if (!this.ui) return;
		let { flipAnimation: e } = this.ui;
		e.classList.remove("mrz-flip-visible"), e.querySelector(".mrz-flip-card")?.classList.remove("mrz-flip-animate");
	}
	showBadge(e, t, n, r) {
		if (!this.ui) return;
		let { badge: i, badgeLine1: a, badgeLine2: o } = this.ui;
		a.textContent = e, a.className = `mrz-badge-line${t ? " mrz-success" : ""}`, n === void 0 ? o.style.display = "none" : (o.textContent = n, o.className = `mrz-badge-line${r ? " mrz-success" : ""}`, o.style.display = "block"), i.classList.add("mrz-badge-visible");
	}
	static {
		this.FORMAT_DOC_TYPES = {
			passport: [o.CT_MRTD_TD3_PASSPORT],
			id: [
				o.CT_MRTD_TD1_ID,
				o.CT_MRTD_TD2_ID,
				o.CT_MRTD_TD2_FRENCH_ID
			],
			visa: [o.CT_MRTD_TD2_VISA, o.CT_MRTD_TD3_VISA],
			all: $
		};
	}
	static buildScanModeManager(e) {
		let t = new Set(e);
		return Object.fromEntries($.map((e) => [e, t.has(e)]));
	}
	async setFormatMode(t) {
		try {
			let n = this.getEnabledTypes();
			this.scanModeManager = e.buildScanModeManager(e.FORMAT_DOC_TYPES[t].filter((e) => n.has(e))), this.currentScanMode = this.getScanMode(), this.stopCapturing(), this.updateScanRegion(), await this.startCapturing(), this.syncFormatButtons();
		} catch (e) {
			console.error("MRZ Scanner switch scan mode error:", e?.message || e), this.closeCamera(), this.currentScanResolver?.(new R({ status: x.RS_FAILED }));
		}
	}
	syncFormatButtons() {
		if (!this.ui) return;
		let { formatPassportBtn: e, formatIdBtn: t, formatVisaBtn: n, formatAllBtn: r } = this.ui, i = this.scanModeManager, a = i[o.CT_MRTD_TD3_PASSPORT], s = i[o.CT_MRTD_TD1_ID] || i[o.CT_MRTD_TD2_ID] || i[o.CT_MRTD_TD2_FRENCH_ID], c = i[o.CT_MRTD_TD2_VISA] || i[o.CT_MRTD_TD3_VISA], l = "all";
		a && !s && !c ? l = "passport" : s && !a && !c ? l = "id" : c && !a && !s && (l = "visa"), this.currentFormatMode = l;
		let u = {
			visa: n,
			all: r,
			passport: e,
			id: t
		};
		for (let [e, t] of Object.entries(u)) t && (t.className = `mrz-format-btn${e === l ? " mrz-format-active" : ""}`);
		let d = u[l];
		if (!d) return;
		let f = this.getVisibleFormatButtons(), p = f.indexOf(l), m = f.length, h = d.parentElement;
		h.style.transform = `translateX(${((m - 1) / 2 - p) * (100 / m)}%)`;
	}
	setupPortraitOnlyMode() {
		if (!this.ui) return;
		let e = this.ui.rotationOverlay, t = window.matchMedia("(orientation: landscape) and (max-width: 1023px)"), n = (t) => {
			e.classList.toggle("mrz-rotation-visible", t.matches);
		};
		t.addEventListener("change", n), n(t);
	}
	updateScanRegion() {
		if (this.config.enableScanRegion === !1) return;
		let e;
		switch (this.currentScanMode) {
			case v.TD1:
			case v.TD1AndTD2:
				e = o.CT_MRTD_TD1_ID;
				break;
			case v.TD2:
				e = o.CT_MRTD_TD2_ID;
				break;
			case v.MRVA:
			case v.MRVAAndMRVB:
				e = o.CT_MRTD_TD3_VISA;
				break;
			case v.MRVB:
				e = o.CT_MRTD_TD2_VISA;
				break;
			default:
				e = o.CT_MRTD_TD3_PASSPORT;
				break;
		}
		this.calculateScanRegion(e);
	}
	calculateScanRegion(e) {
		let { cameraEnhancer: t, cameraView: n } = this.resources;
		if (!t || !t.isOpen() || !n) return;
		let r = Te[e].width / Te[e].height, i = n.getVisibleRegionOfVideo({ inPixels: !0 });
		if (!i) return;
		let { width: a, height: o } = i, s;
		if (a > o) {
			let e = .5 * o * r, t = Math.round(e / a * 100), n = (100 - t) / 2;
			s = {
				left: n,
				right: n + t,
				top: 25,
				bottom: 75,
				isMeasuredInPercentage: !0
			};
		} else {
			let e = .9 * a / r, t = Math.round(e / o * 100), n = (100 - t) / 2;
			s = {
				left: 5,
				right: 95,
				top: n,
				bottom: n + t,
				isMeasuredInPercentage: !0
			};
		}
		try {
			n.setScanRegionMaskVisible(!0);
		} catch {}
		try {
			let e = n.getDrawingLayer(1);
			e && e.setVisible(!1);
		} catch {}
		try {
			let e = n.getDrawingLayer(3);
			e && e.setVisible(!1);
		} catch {}
		try {
			t.setScanRegion(s);
		} catch {}
	}
	async openCamera() {
		try {
			let { cameraEnhancer: e, cameraView: t } = this.resources;
			if (!e || !t) throw Error("Camera resources not initialized");
			let n = S(this.config.container);
			if (!n) throw Error("Container element not found");
			n.style.display = "block";
			let r = t.getUIElement();
			if (e.isOpen()) e.isPaused() && await e.resume();
			else {
				r.parentElement || n.append(r), e.ifSkipCameraInspection = !0, await e.setResolution(E["2k"]), await e.open();
				let t = e.getCameraSettings();
				t?.deviceId && (this.defaultBackCameraId = t.deviceId);
			}
			let i = r.shadowRoot;
			if (i) {
				let e = i.querySelector(".dce-macro-use-mobile-native-like-ui");
				e && (e.style.display = "block");
			}
			!this.initializedUI && e.isOpen() && this.initializeUI();
			let a = (await navigator.mediaDevices.enumerateDevices()).filter((e) => e.kind === "videoinput"), o = a.find((e) => /front|user|selfie/i.test(e.label));
			a.length > 1 && (o || a.some((e) => e.deviceId !== this.defaultBackCameraId)) ? this.ui?.cameraSwitchBtn.classList.remove("mrz-hidden") : this.ui?.cameraSwitchBtn.classList.add("mrz-hidden"), this.probeFlashSupport(), window.addEventListener("resize", this.handleResize);
		} catch (e) {
			let t = e?.message || e;
			console.error(t), e?.name === "NotAllowedError" || typeof t == "string" && t.toLowerCase().includes("permission denied") ? alert(this.messages.cameraAccessDenied) : alert(t), this.closeCamera(), this.currentScanResolver?.(new R({ status: x.RS_FAILED }));
		}
	}
	async closeCamera(e = !0) {
		try {
			window.removeEventListener("resize", this.handleResize), this.resizeTimer &&= (window.clearTimeout(this.resizeTimer), null), this.defaultBackCameraId = null;
			let { cameraEnhancer: t, cameraView: n } = this.resources, r = S(this.config.container);
			if (!r || (r.style.display = e ? "none" : "block", n?.getUIElement().parentElement && r.removeChild(n.getUIElement()), this.ui?.overlay.parentElement && r.removeChild(this.ui.overlay), this.ui = null, this.initializedUI = !1, !t)) return;
			t.close(), this.stopCapturing();
		} catch (e) {
			console.error(`Close Camera error: ${e?.message || e}`);
		}
	}
	pauseCamera() {
		this.resources.cameraEnhancer?.pause();
	}
	stopCapturing() {
		let { cameraView: e, cvRouter: t } = this.resources;
		!t || !e || (t.stopCapturing(), e.clearAllInnerDrawingItems());
	}
	handleCloseBtn() {
		if (this.closeCamera(), this.currentScanResolver) if (this.isMRZScanned && !this.isPortraitScanned && this.areSidesDifferent) {
			let e = new R({
				status: x.RS_SUCCESS,
				data: this.mrzSideData.processedData,
				primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
				primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
				portraitImage: this.mrzSideData.portraitImage
			});
			this.currentScanResolver?.(e), this.resetScanningState();
		} else this.currentScanResolver(new R({ status: x.RS_CANCELLED })), this.resetScanningState();
	}
	startPortraitSkipTimer() {
		this.portraitSkipTimerHandle === null && (this.portraitSkipTimerHandle = window.setTimeout(() => {
			this.portraitSkipTimerHandle = null, this.ui?.skipPortraitLabel.classList.add("mrz-skip-portrait-visible");
		}, e.PORTRAIT_SKIP_TIMEOUT_MS));
	}
	clearPortraitSkipTimer() {
		this.portraitSkipTimerHandle !== null && (window.clearTimeout(this.portraitSkipTimerHandle), this.portraitSkipTimerHandle = null), this.ui?.skipPortraitLabel.classList.remove("mrz-skip-portrait-visible");
	}
	handleSkipPortrait() {
		if (this.closeCamera(), this.currentScanResolver) {
			let e = new R({
				status: x.RS_SUCCESS,
				data: this.mrzSideData.processedData,
				primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
				primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
				portraitImage: null
			});
			this.resources.onResultUpdated?.(e), this.currentScanResolver?.(e), this.resetScanningState();
		}
	}
	async loadImageFile() {
		let { cvRouter: e } = this.resources;
		if (!e) throw Error("Router not initialized");
		let t = document.createElement("input");
		t.type = "file", t.accept = this.config.loadImageAcceptedTypes ?? "image/*", t.style.display = "none", document.body.appendChild(t);
		try {
			this.showScannerLoadingOverlay("Processing file..."), await this.closeCamera(!1);
			let n = await new Promise((e, n) => {
				t.onchange = (t) => {
					let r = t.target.files?.[0];
					if (!r) {
						n(/* @__PURE__ */ Error("No file selected"));
						return;
					}
					e(r);
				}, t.addEventListener("cancel", async () => {
					this.hideScannerLoadingOverlay(!1), this.showScannerLoadingOverlay("Initializing camera..."), await this.openCamera(), this.setGuideFrameVisible(this.config.enableScanRegion !== !1), this.updateScanRegion(), await this.startCapturing(), this.hideScannerLoadingOverlay();
				}), t.click();
			});
			if (!n) return;
			let r;
			if (this.config.loadImageFileConverter && !n.type.startsWith("image/")) try {
				r = await this.config.loadImageFileConverter(n);
			} catch (e) {
				throw Error(`Error converting file: ${e instanceof Error ? e.message : String(e)}`);
			}
			else if (n.type.startsWith("image/")) r = n;
			else throw Error("Unsupported file type. Please provide a converter function for this file type.");
			let i = this.config.utilizedTemplateNames[this.currentScanMode], a = typeof i == "string" ? i : i.full, o = await te(await e.capture(r, a), {
				returnDocumentImage: this.resources.returnDocumentImage,
				returnPortraitImage: this.resources.returnPortraitImage
			});
			this.originalImageData = o.imageData;
			let s = new R({
				status: x.RS_SUCCESS,
				data: o.processedData,
				primaryOriginalImage: o.imageData,
				primaryDocumentImage: o.primaryDocumentImage,
				portraitImage: o.portraitImage
			});
			this.resources.onResultUpdated?.(s), this.currentScanResolver?.(s);
		} catch (e) {
			let t = e?.message || e;
			console.error(t), alert(t), this.closeCamera(), this.currentScanResolver?.(new R({ status: x.RS_FAILED }));
		} finally {
			this.hideScannerLoadingOverlay(!0), document.body.removeChild(t);
		}
	}
	initializeScanModeManager() {
		let { mrzFormatType: t } = this.config;
		this.scanModeManager = e.buildScanModeManager($), !(!t || Array.isArray(t) && t.length === 0) && (Object.keys(this.scanModeManager).forEach((e) => {
			this.scanModeManager[e] = !1;
		}), (Array.isArray(t) ? t : [t]).forEach((e) => {
			we[e].forEach((e) => {
				this.scanModeManager[e] = !0;
			});
		}));
	}
	getScanMode() {
		let e = this.scanModeManager, t = e[o.CT_MRTD_TD3_PASSPORT], n = e[o.CT_MRTD_TD1_ID], r = e[o.CT_MRTD_TD2_ID] || e[o.CT_MRTD_TD2_FRENCH_ID], i = e[o.CT_MRTD_TD3_VISA], a = e[o.CT_MRTD_TD2_VISA], s = i || a, c = n || r, l = [
			t,
			s,
			c
		].filter(Boolean).length;
		if (l === 3) return v.All;
		if (l === 2) {
			if (t && c && !s) {
				if (n && !r) return v.PassportAndTD1;
				if (r && !n) return v.PassportAndTD2;
				if (n && r) return v.All;
			}
			return v.All;
		}
		return t ? v.TD3 : i && a ? v.MRVAAndMRVB : i ? v.MRVA : a ? v.MRVB : n && r ? v.TD1AndTD2 : n ? v.TD1 : r ? v.TD2 : v.All;
	}
	async startCapturing() {
		let { cvRouter: e } = this.resources;
		if (!e) throw Error("Router not initialized");
		let t = this.config.utilizedTemplateNames[this.currentScanMode], n = typeof t == "string" ? `${t}-MRZOnly` : t.mrzOnly;
		try {
			this.firstFrame = !0, await e.startCapturing(n);
		} catch (e) {
			let t = e?.message || e;
			console.error("Failed to start capturing:", t), this.closeCamera(), this.currentScanResolver?.(new R({ status: x.RS_FAILED }));
		}
	}
	async switchToFullTemplate() {
		if (this.hasSwitchedToFullTemplate) return;
		this.hasSwitchedToFullTemplate = !0;
		let { cvRouter: e } = this.resources;
		if (!e) return;
		let t = this.config.utilizedTemplateNames[this.currentScanMode], n = typeof t == "string" ? t : t.full;
		try {
			e.stopCapturing(), await e.startCapturing(n);
		} catch (e) {
			console.warn("Template switch failed:", e), this.hasSwitchedToFullTemplate = !1;
		}
	}
	async launch() {
		try {
			return this.resetScanningState(), await this.initialize(), new Promise(async (e) => {
				this.currentScanResolver = e, this.showScannerLoadingOverlay("Initializing camera..."), await this.openCamera(), this.setGuideFrame("mrz"), this.setGuideFrameVisible(this.config.enableScanRegion !== !1), this.updateScanRegion(), await this.startCapturing(), this.hideScannerLoadingOverlay(), this.resources.returnPortraitImage ? this.showBadge(this.messages.scanMRZFirst, !1) : this.showBadge(this.messages.positionMRZ, !1);
			});
		} catch (e) {
			let t = e?.message || e;
			console.error("MRZ Scanner launch error:", t), this.closeCamera(), this.currentScanResolver?.(new R({ status: x.RS_FAILED }));
		}
	}
	isDocumentTypeEnabled(e) {
		return this.scanModeManager[e] === !0;
	}
	async handleMRZResult(e) {
		if (this.firstFrame) {
			this.firstFrame = !1;
			return;
		}
		if (e.items.length <= 1 && !this.isMRZScanned) {
			this.hideScanSpinner();
			return;
		}
		if (this.isMRZScanned && !this.isPortraitScanned && this.resources.returnPortraitImage) {
			let t = e.items.filter((e) => e.type === a.CRIT_ORIGINAL_IMAGE);
			t.length > 0 && (this.originalImageData = G(t[0].imageData)), e?.parsedResult?.parsedResultItems?.length ? await this.tryPortraitOnSameSide(e, this.resources.onResultUpdated) : t.length > 0 && await this.handlePortraitSideScan(e, this.resources.onResultUpdated);
			return;
		}
		if (e.items.length <= 1) {
			this.isMRZScanned || this.hideScanSpinner();
			return;
		}
		try {
			let { onResultUpdated: t } = this.resources, n = (e?.parsedResult?.parsedResultItems)?.filter((e) => {
				let t = e.codeType;
				return this.isDocumentTypeEnabled(t);
			});
			if (this.isMRZScanned || (n?.length ? this.showScanSpinner() : this.hideScanSpinner()), n?.length && !this.isMRZScanned) {
				this.isMRZScanned = !0, this.isSoundFeedbackOn && c.beep();
				let r = {
					...e,
					parsedResult: e.parsedResult ? {
						...e.parsedResult,
						parsedResultItems: n
					} : e.parsedResult
				}, i = null;
				if ((this.resources.returnDocumentImage || this.resources.returnPortraitImage) && this.resources.cvRouter) {
					let t = e.items.find((e) => e.type === a.CRIT_ORIGINAL_IMAGE);
					if (t) try {
						i = (await this.resources.cvRouter.capture(t.imageData, "DetectAndNormalizeDocument_Default"))?.processedDocumentResult ?? null;
					} catch (e) {
						console.warn("DDN failed:", e);
					}
				}
				let o = await te(r, {
					returnDocumentImage: this.resources.returnDocumentImage,
					returnPortraitImage: !1,
					overrideDocumentResult: i
				});
				this.originalImageData = o.imageData;
				let s = i?.detectedQuadResultItems?.[0]?.location ?? null;
				await this.handleMRZSideScan(o.processedData, o.primaryDocumentImage, s, t);
			}
		} catch (e) {
			let t = e?.message || e;
			console.error(t), alert(t), this.closeCamera(), this.currentScanResolver?.(new R({ status: x.RS_FAILED }));
		}
	}
	async handleMRZSideScan(e, t, n, r) {
		let i = null, a = !1;
		if (this.resources.returnPortraitImage && this.originalImageData) try {
			let e = await l.findPortraitZone();
			if (e && !e.errorCode && e.points?.length === 4 && (!n || J(e, n))) {
				let t = Z(e, B, this.originalImageData);
				i = G(await u.cropAndDeskewImage(this.originalImageData, t)), a = !0;
			}
		} catch (e) {
			console.warn("Error finding portrait zone:", e);
		}
		if (this.isMRZScanned = !0, this.mrzSideData = {
			processedData: e,
			primaryOriginalImage: this.originalImageData,
			primaryDocumentImage: t,
			portraitImage: i
		}, this.resources.returnPortraitImage && !a) this.hideScanSpinner(), this.showGuideSuccessBorder(1e3), this.showBadge(this.messages.scanSuccess, !0, this.messages.scanningPortrait, !1), this.startPortraitSkipTimer();
		else {
			this.hideScanSpinner(), this.areSidesDifferent = !1, this.isPortraitScanned = !0, this.showGuideSuccessBorder(1e3);
			let n = i ? this.messages.portraitScanned : void 0;
			this.showBadge(this.messages.scanSuccess, !0, n, !!n), setTimeout(() => {
				this.closeCamera();
				let n = new R({
					status: x.RS_SUCCESS,
					data: e,
					primaryOriginalImage: this.originalImageData,
					primaryDocumentImage: t,
					portraitImage: i
				});
				r?.(n), this.currentScanResolver?.(n), this.resetScanningState();
			}, 1e3);
		}
	}
	async tryPortraitOnSameSide(t, n) {
		if (this.isProcessingSameSideFrame) return;
		this.isProcessingSameSideFrame = !0;
		let r = !1;
		try {
			if (!X(this.latestLocalizedTextLines)) return;
			let e = await l.findPortraitZone();
			if (this.isPortraitScanned) return;
			if (e && !e.errorCode && e.points?.length === 4) {
				let i = Y(t);
				if ((!i || J(e, i)) && this.originalImageData) {
					r = !0;
					let t = Z(e, B, this.originalImageData), i = G(await u.cropAndDeskewImage(this.originalImageData, t));
					this.flipTimeoutHandle !== null && (window.clearTimeout(this.flipTimeoutHandle), this.flipTimeoutHandle = null), this.flipCountdownHandle !== null && (window.clearInterval(this.flipCountdownHandle), this.flipCountdownHandle = null), this.areSidesDifferent = !1, this.isWaitingForFlip = !1, this.isPortraitScanned = !0, this.mrzSideData.portraitImage = i, this.hideScanSpinner(), this.showGuideSuccessBorder(1e3), this.showBadge(this.messages.scanSuccess, !0, this.messages.portraitScanned, !0), setTimeout(() => {
						this.closeCamera();
						let e = new R({
							status: x.RS_SUCCESS,
							data: this.mrzSideData.processedData,
							primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
							primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
							portraitImage: i
						});
						n?.(e), this.currentScanResolver?.(e), this.resetScanningState();
					}, 1e3);
				}
			}
		} catch (e) {
			console.warn("tryPortraitOnSameSide error:", e);
		} finally {
			if (!r && (this.isProcessingSameSideFrame = !1, this.sameSideMissCount++, !this.areSidesDifferent && this.sameSideMissCount >= e.SAME_SIDE_MISSES_BEFORE_FLIP)) {
				this.areSidesDifferent = !0, this.switchToFullTemplate();
				let e = this.config.flipDocumentTimeout ?? 3e3, t = Math.ceil(e / 1e3), n = (e) => this.messages.flipDocumentCountdown.replace("{seconds}", String(e));
				this.setGuideFrame("portrait"), this.showFlipAnimation(), this.showGuideSuccessBorder(1e3), this.showBadge(this.messages.scanSuccess, !0, n(t), !1), this.isWaitingForFlip = !0, this.flipCountdownHandle = window.setInterval(() => {
					t--, t > 0 && this.showBadge(this.messages.scanSuccess, !0, n(t), !1);
				}, 1e3), this.flipTimeoutHandle = window.setTimeout(() => {
					window.clearInterval(this.flipCountdownHandle), this.flipCountdownHandle = null, this.flipTimeoutHandle = null, this.isWaitingForFlip = !1, this.showBadge(this.messages.scanSuccess, !0, this.messages.flipDocument, !1);
				}, e);
			}
		}
	}
	async handlePortraitSideScan(t, n) {
		if (this.isProcessingPortraitFrame) return;
		if (!X(this.latestLocalizedTextLines)) {
			this.hideScanSpinner();
			return;
		}
		let r = null;
		if (this.resources.returnDocumentImage || this.resources.returnPortraitImage) {
			if (r = Y(t), r) this.consecutiveStablePortraitFrames++, this.isWaitingForFlip || this.showScanSpinner();
			else if (this.consecutiveStablePortraitFrames = 0, this.hideScanSpinner(), this.resources.returnDocumentImage) return;
			if (this.consecutiveStablePortraitFrames < e.PORTRAIT_STABLE_FRAMES_REQUIRED) return;
		}
		this.isProcessingPortraitFrame = !0;
		let i = !1;
		try {
			let e = await l.findPortraitZone();
			if (e && !e.errorCode && e.points?.length === 4 && this.originalImageData) {
				i = !0, this.isPortraitScanned = !0;
				let t = this.originalImageData, a = null;
				if (this.resources.returnDocumentImage && r) try {
					let e = Z(r, Ee, this.originalImageData);
					a = G(await u.cropAndDeskewImage(this.originalImageData, e));
				} catch (e) {
					console.warn("Error extracting secondary document image:", e);
				}
				let o = null;
				try {
					let t = Z(e, B, this.originalImageData);
					o = G(await u.cropAndDeskewImage(this.originalImageData, t));
				} catch (e) {
					console.warn("Error cropping portrait image:", e);
				}
				this.hideFlipAnimation(), this.isSoundFeedbackOn && c.beep(), this.hideScanSpinner(), this.showGuideSuccessBorder(1e3), this.showBadge(this.messages.scanSuccess, !0, this.messages.bothSidesScanned, !0), setTimeout(() => {
					this.closeCamera();
					let e = new R({
						status: x.RS_SUCCESS,
						data: this.mrzSideData.processedData,
						primaryOriginalImage: this.mrzSideData.primaryOriginalImage,
						secondaryOriginalImage: t,
						primaryDocumentImage: this.mrzSideData.primaryDocumentImage,
						secondaryDocumentImage: a,
						portraitImage: o || this.mrzSideData.portraitImage
					});
					n?.(e), this.currentScanResolver?.(e), this.resetScanningState();
				}, 1e3);
			}
		} catch (e) {
			console.error("Error finding portrait on second side:", e);
		} finally {
			i || (this.isProcessingPortraitFrame = !1);
		}
	}
	showScanSpinner() {
		this.scanSpinnerEl?.classList.add("dce-visible");
	}
	hideScanSpinner() {
		this.scanSpinnerEl?.classList.remove("dce-visible");
	}
	resetScanningState() {
		this.hideScanSpinner(), this.hideFlipAnimation(), this.isMRZScanned = !1, this.isPortraitScanned = !1, this.areSidesDifferent = !1, this.isWaitingForFlip = !1, this.isProcessingSameSideFrame = !1, this.isProcessingPortraitFrame = !1, this.consecutiveStablePortraitFrames = 0, this.sameSideMissCount = 0, this.latestLocalizedTextLines = null, this.hasSwitchedToFullTemplate = !1, this.flipTimeoutHandle !== null && (window.clearTimeout(this.flipTimeoutHandle), this.flipTimeoutHandle = null), this.flipCountdownHandle !== null && (window.clearInterval(this.flipCountdownHandle), this.flipCountdownHandle = null), this.clearPortraitSkipTimer(), this.mrzSideData = {
			processedData: null,
			primaryOriginalImage: null,
			primaryDocumentImage: null,
			portraitImage: null
		};
	}
}, Oe = {
	GlobalParameter: { IntraOpNumThreads: 2 },
	CaptureVisionTemplates: [
		{
			Name: "DetectAndNormalizeDocument_Default",
			ImageROIProcessingNameArray: ["roi-detect-and-normalize-document"]
		},
		{
			Name: "DetectDocumentBoundaries_Default",
			ImageROIProcessingNameArray: ["roi-detect-document-boundaries"]
		},
		{
			Name: "NormalizeDocument_Default",
			ImageROIProcessingNameArray: ["roi-normalize-document"]
		},
		{
			Name: "ReadAll",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-and-id"],
			SemanticProcessingNameArray: ["sp-passport-and-id"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadPassport",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport"],
			SemanticProcessingNameArray: ["sp-passport"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadId-TD1",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-id-td1"],
			SemanticProcessingNameArray: ["sp-id-td1"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadId-TD2",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-id-td2"],
			SemanticProcessingNameArray: ["sp-id-td2"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadId",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-id"],
			SemanticProcessingNameArray: ["sp-id"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadPassportAndId-TD1",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-and-id-td1"],
			SemanticProcessingNameArray: ["sp-passport-and-id-td1"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadPassportAndId-TD2",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-and-id-td2"],
			SemanticProcessingNameArray: ["sp-passport-and-id-td2"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadVisa",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-visa"],
			SemanticProcessingNameArray: ["sp-visa"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadVisa-MRVA",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-visa-mrva"],
			SemanticProcessingNameArray: ["sp-visa-mrva"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadVisa-MRVB",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-visa-mrvb"],
			SemanticProcessingNameArray: ["sp-visa-mrvb"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadAll-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-and-id-mrz-only"],
			SemanticProcessingNameArray: ["sp-passport-and-id"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadPassport-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-mrz-only"],
			SemanticProcessingNameArray: ["sp-passport"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadId-TD1-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-id-td1-mrz-only"],
			SemanticProcessingNameArray: ["sp-id-td1"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadId-TD2-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-id-td2-mrz-only"],
			SemanticProcessingNameArray: ["sp-id-td2"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadId-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-id-mrz-only"],
			SemanticProcessingNameArray: ["sp-id"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadPassportAndId-TD1-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-and-id-td1-mrz-only"],
			SemanticProcessingNameArray: ["sp-passport-and-id-td1"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadPassportAndId-TD2-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-passport-and-id-td2-mrz-only"],
			SemanticProcessingNameArray: ["sp-passport-and-id-td2"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadVisa-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-visa-mrz-only"],
			SemanticProcessingNameArray: ["sp-visa"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadVisa-MRVA-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-visa-mrva-mrz-only"],
			SemanticProcessingNameArray: ["sp-visa-mrva"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		},
		{
			Name: "ReadVisa-MRVB-MRZOnly",
			OutputOriginalImage: 1,
			ImageROIProcessingNameArray: ["roi-visa-mrvb-mrz-only"],
			SemanticProcessingNameArray: ["sp-visa-mrvb"],
			Timeout: 1e4,
			MaxParallelTasks: 0
		}
	],
	TargetROIDefOptions: [
		{
			Name: "roi-detect-and-normalize-document",
			TaskSettingNameArray: ["task-detect-and-normalize-document"]
		},
		{
			Name: "roi-detect-document-boundaries",
			TaskSettingNameArray: ["task-detect-document-boundaries"]
		},
		{
			Name: "roi-normalize-document",
			TaskSettingNameArray: ["task-normalize-document"]
		},
		{
			Name: "roi-passport-and-id",
			TaskSettingNameArray: ["task-passport-and-id", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-passport-and-id-td1",
			TaskSettingNameArray: ["task-passport-and-id-td1", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-passport-and-id-td2",
			TaskSettingNameArray: ["task-passport-and-id-td2", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-passport",
			TaskSettingNameArray: ["task-passport", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-id-td1",
			TaskSettingNameArray: ["task-id-td1", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-id-td2",
			TaskSettingNameArray: ["task-id-td2", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-id",
			TaskSettingNameArray: ["task-id", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-visa",
			TaskSettingNameArray: ["task-visa", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-visa-mrva",
			TaskSettingNameArray: ["task-visa-mrva", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-visa-mrvb",
			TaskSettingNameArray: ["task-visa-mrvb", "2-task-detect-and-normalize-document"]
		},
		{
			Name: "roi-passport-and-id-mrz-only",
			TaskSettingNameArray: ["task-passport-and-id"]
		},
		{
			Name: "roi-passport-mrz-only",
			TaskSettingNameArray: ["task-passport"]
		},
		{
			Name: "roi-id-td1-mrz-only",
			TaskSettingNameArray: ["task-id-td1"]
		},
		{
			Name: "roi-id-td2-mrz-only",
			TaskSettingNameArray: ["task-id-td2"]
		},
		{
			Name: "roi-id-mrz-only",
			TaskSettingNameArray: ["task-id"]
		},
		{
			Name: "roi-passport-and-id-td1-mrz-only",
			TaskSettingNameArray: ["task-passport-and-id-td1"]
		},
		{
			Name: "roi-passport-and-id-td2-mrz-only",
			TaskSettingNameArray: ["task-passport-and-id-td2"]
		},
		{
			Name: "roi-visa-mrz-only",
			TaskSettingNameArray: ["task-visa"]
		},
		{
			Name: "roi-visa-mrva-mrz-only",
			TaskSettingNameArray: ["task-visa-mrva"]
		},
		{
			Name: "roi-visa-mrvb-mrz-only",
			TaskSettingNameArray: ["task-visa-mrvb"]
		}
	],
	TextLineSpecificationOptions: [
		{
			Name: "tls-mrz-passport",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [44, 44],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [{
				StringRegExPattern: "(P[A-Z<][A-Z<]{3}[A-Z<]{39}){(44)}",
				StringLengthRange: [44, 44],
				BaseTextLineSpecificationName: "tls-base"
			}, {
				StringRegExPattern: "([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[0-9]{2}[0-9]{2}[0-9][MF<][0-9]{2}[0-9]{2}[0-9]{2}[0-9][A-Z0-9<]{14}[0-9<][0-9]){(44)}",
				StringLengthRange: [44, 44],
				BaseTextLineSpecificationName: "tls-base"
			}]
		},
		{
			Name: "tls-mrz-visa-td3",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [44, 44],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [{
				StringRegExPattern: "(V[A-Z<][A-Z<]{3}[A-Z<]{39}){(44)}",
				StringLengthRange: [44, 44],
				BaseTextLineSpecificationName: "tls-base"
			}, {
				StringRegExPattern: "([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[0-9]{2}[0-9]{2}[0-9][MF<][0-9]{2}[0-9]{2}[0-9]{2}[0-9][A-Z0-9<]{14}[A-Z0-9<]{2}){(44)}",
				StringLengthRange: [44, 44],
				BaseTextLineSpecificationName: "tls-base"
			}]
		},
		{
			Name: "tls-mrz-visa-td2",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [36, 36],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [{
				StringRegExPattern: "(V[A-Z<][A-Z<]{3}[A-Z<]{31}){(36)}",
				StringLengthRange: [36, 36],
				BaseTextLineSpecificationName: "tls-base"
			}, {
				StringRegExPattern: "([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[0-9]{2}[0-9]{2}[0-9][MF<][0-9]{2}[0-9]{2}[0-9]{2}[0-9][A-Z0-9<]{8}){(36)}",
				StringLengthRange: [36, 36],
				BaseTextLineSpecificationName: "tls-base"
			}]
		},
		{
			Name: "tls-mrz-id-td2",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [36, 36],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [{
				StringRegExPattern: "([ACI][A-Z<][A-Z<]{3}[A-Z<]{31}){(36)}",
				StringLengthRange: [36, 36],
				BaseTextLineSpecificationName: "tls-base"
			}, {
				StringRegExPattern: "([A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{2}[0-9<]{4}[0-9][MF<][0-9]{2}[0-9]{2}[0-9]{2}[0-9][A-Z0-9<]{8}){(36)}",
				StringLengthRange: [36, 36],
				BaseTextLineSpecificationName: "tls-base"
			}]
		},
		{
			Name: "tls-mrz-id-td1",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [30, 30],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [
				{
					StringRegExPattern: "([ACI][A-Z<][A-Z<]{3}[A-Z0-9<]{9}[0-9<][A-Z0-9<]{15}){(30)}",
					StringLengthRange: [30, 30],
					BaseTextLineSpecificationName: "tls-base"
				},
				{
					StringRegExPattern: "([0-9]{2}[0-9]{2}[0-9]{2}[0-9][MF<][0-9]{2}[0-9<]{4}[0-9][A-Z<]{3}[A-Z0-9<]{11}[0-9]){(30)}",
					StringLengthRange: [30, 30],
					BaseTextLineSpecificationName: "tls-base"
				},
				{
					StringRegExPattern: "([A-Z<]{30}){(30)}",
					StringLengthRange: [30, 30],
					BaseTextLineSpecificationName: "tls-base"
				}
			]
		},
		{
			Name: "tls-mrz-FrenchId-td2",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [36, 36],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [{
				StringRegExPattern: "(I[A-Z<])(FRA)([A-Z<]{25})([A-Z0-9<]{3})([0-9<]{3}){(36)}",
				StringLengthRange: [36, 36],
				BaseTextLineSpecificationName: "tls-base"
			}, {
				StringRegExPattern: "([A-Z0-9]{12}[0-9][A-Z<]{14}[0-9]{2}[0-9]{2}[0-9]{2}[0-9][MF<][0-9]){(36)}",
				StringLengthRange: [36, 36],
				BaseTextLineSpecificationName: "tls-base"
			}]
		},
		{
			Name: "tls-mrz-SuissDL",
			BaseTextLineSpecificationName: "tls-base",
			StringLengthRange: [9, 30],
			OutputResults: 1,
			ExpectedGroupsCount: 1,
			ConcatResults: 1,
			ConcatSeparator: "\n",
			SubGroups: [
				{
					StringRegExPattern: "([A-Z0-9]{3}[0-9]{3}[DFIR](<<)){(9)}",
					StringLengthRange: [9, 9],
					BaseTextLineSpecificationName: "tls-base"
				},
				{
					StringRegExPattern: "(FACHE[0-9]{12}(<<)[0-9]{2}[0-9]{2}[0-9]{2}[<]{5}){(30)}",
					StringLengthRange: [30, 30],
					BaseTextLineSpecificationName: "tls-base"
				},
				{
					StringRegExPattern: "([A-Z<]{30}){(30)}",
					StringLengthRange: [30, 30],
					BaseTextLineSpecificationName: "tls-base"
				}
			]
		},
		{
			Name: "tls-base",
			CharacterModelName: "MRZCharRecognition",
			TextLineRecModelName: "MRZTextLineRecognition",
			CharHeightRange: [
				5,
				1e3,
				1
			],
			BinarizationModes: [{
				BlockSizeX: 41,
				BlockSizeY: 41,
				Mode: "BM_LOCAL_BLOCK",
				EnableFillBinaryVacancy: 0,
				ThresholdCompensation: 10
			}],
			ConfusableCharactersCorrection: {
				ConfusableCharacters: [
					["0", "O"],
					["1", "I"],
					["5", "S"]
				],
				FontNameArray: ["OCR_B"]
			}
		}
	],
	LabelRecognizerTaskSettingOptions: [
		{
			Name: "task-passport",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: ["tls-mrz-passport"],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-id-td1",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: ["tls-mrz-id-td1"],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-id-td2",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: [
				"tls-mrz-id-td2",
				"tls-mrz-visa-td2",
				"tls-mrz-FrenchId-td2"
			],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-passport-and-id",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: [
				"tls-mrz-passport",
				"tls-mrz-visa-td3",
				"tls-mrz-id-td1",
				"tls-mrz-id-td2",
				"tls-mrz-visa-td2",
				"tls-mrz-FrenchId-td2"
			],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-passport-and-id-td1",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: [
				"tls-mrz-passport",
				"tls-mrz-visa-td3",
				"tls-mrz-id-td1"
			],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-passport-and-id-td2",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: [
				"tls-mrz-passport",
				"tls-mrz-visa-td3",
				"tls-mrz-id-td2",
				"tls-mrz-visa-td2",
				"tls-mrz-FrenchId-td2"
			],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-id",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: [
				"tls-mrz-id-td1",
				"tls-mrz-id-td2",
				"tls-mrz-visa-td2",
				"tls-mrz-FrenchId-td2"
			],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-visa",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: ["tls-mrz-visa-td2", "tls-mrz-visa-td3"],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-visa-mrva",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: ["tls-mrz-visa-td3"],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		},
		{
			Name: "task-visa-mrvb",
			MaxThreadsInOneTask: 4,
			TextLineSpecificationNameArray: ["tls-mrz-visa-td2"],
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-mrz"
				},
				{
					Section: "ST_TEXT_LINE_LOCALIZATION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_LOCALIZE_TEXT_LINES",
						LocalizationModes: [{
							Mode: "LM_NEURAL_NETWORK",
							ModelNameArray: ["MRZLocalization"]
						}, { Mode: "LM_GENERAL" }]
					}]
				},
				{
					Section: "ST_TEXT_LINE_RECOGNITION",
					ImageParameterName: "ip-mrz",
					StageArray: [{
						Stage: "SST_RECOGNIZE_RAW_TEXT_LINES",
						ConfusableCharactersPath: "ConfusableChars.data",
						OverlappingCharactersPath: "OverlappingChars.data",
						EnableRegexForceCorrection: 0
					}, { Stage: "SST_ASSEMBLE_TEXT_LINES" }]
				}
			]
		}
	],
	DocumentNormalizerTaskSettingOptions: [
		{
			Name: "task-detect-and-normalize-document",
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [{ Stage: "SST_PREDETECT_REGIONS" }]
				},
				{
					Section: "ST_DOCUMENT_DETECTION",
					ContentType: "CT_DOCUMENT",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [
						{ Stage: "SST_ASSEMBLE_LONG_LINES" },
						{ Stage: "SST_ASSEMBLE_LOGICAL_LINES" },
						{ Stage: "SST_DETECT_CORNERS" },
						{ Stage: "SST_DETECT_EDGES" },
						{ Stage: "SST_DETECT_QUADS" }
					]
				},
				{
					Section: "ST_DOCUMENT_DESKEWING",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [{ Stage: "SST_DESKEW_IMAGE" }]
				},
				{
					Section: "ST_IMAGE_ENHANCEMENT",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [{ Stage: "SST_ENHANCE_IMAGE" }]
				}
			]
		},
		{
			Name: "task-detect-document-boundaries",
			SectionArray: [{
				Section: "ST_REGION_PREDETECTION",
				ImageParameterName: "ip-detect",
				StageArray: [{ Stage: "SST_PREDETECT_REGIONS" }]
			}, {
				Section: "ST_DOCUMENT_DETECTION",
				ContentType: "CT_DOCUMENT",
				ImageParameterName: "ip-detect",
				StageArray: [
					{ Stage: "SST_ASSEMBLE_LONG_LINES" },
					{ Stage: "SST_ASSEMBLE_LOGICAL_LINES" },
					{ Stage: "SST_DETECT_CORNERS" },
					{ Stage: "SST_DETECT_EDGES" },
					{ Stage: "SST_DETECT_QUADS" }
				]
			}]
		},
		{
			Name: "task-normalize-document",
			SectionArray: [{
				Section: "ST_DOCUMENT_DESKEWING",
				ImageParameterName: "ip-normalize",
				StageArray: [{ Stage: "SST_DESKEW_IMAGE" }]
			}, {
				Section: "ST_IMAGE_ENHANCEMENT",
				ImageParameterName: "ip-normalize",
				StageArray: [{ Stage: "SST_ENHANCE_IMAGE" }]
			}]
		},
		{
			Name: "2-task-detect-and-normalize-document",
			SectionArray: [
				{
					Section: "ST_REGION_PREDETECTION",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [{ Stage: "SST_PREDETECT_REGIONS" }]
				},
				{
					Section: "ST_DOCUMENT_DETECTION",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [
						{ Stage: "SST_ASSEMBLE_LONG_LINES" },
						{ Stage: "SST_ASSEMBLE_LOGICAL_LINES" },
						{ Stage: "SST_DETECT_CORNERS" },
						{ Stage: "SST_DETECT_EDGES" },
						{ Stage: "SST_DETECT_QUADS" }
					]
				},
				{
					Section: "ST_DOCUMENT_DESKEWING",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [{ Stage: "SST_DESKEW_IMAGE" }]
				},
				{
					Section: "ST_IMAGE_ENHANCEMENT",
					ImageParameterName: "ip-detect-and-normalize",
					StageArray: [{ Stage: "SST_ENHANCE_IMAGE" }]
				}
			]
		}
	],
	CaptureVisionModelOptions: [
		{
			Name: "MRZCharRecognition",
			DirectoryPath: "",
			MaxModelInstances: 4
		},
		{
			Name: "MRZTextLineRecognition",
			DirectoryPath: "",
			MaxModelInstances: 1
		},
		{
			Name: "MRZLocalization",
			ModelArgs: { InputImageLongerEdge: 640 }
		}
	],
	ImageParameterOptions: [
		{
			Name: "ip-detect-and-normalize",
			ApplicableStages: [
				{
					Stage: "SST_DETECT_TEXT_ZONES",
					TextDetectionMode: {
						Mode: "TTDM_WORD",
						Direction: "HORIZONTAL",
						Sensitivity: 7
					}
				},
				{
					Stage: "SST_BINARIZE_IMAGE",
					BinarizationModes: [{
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 30,
						BlockSizeY: 30,
						EnableFillBinaryVacancy: 0,
						ThresholdCompensation: 5
					}]
				},
				{
					Stage: "SST_BINARIZE_TEXTURE_REMOVED_GRAYSCALE",
					BinarizationModes: [{
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 30,
						BlockSizeY: 30,
						EnableFillBinaryVacancy: 0,
						ThresholdCompensation: 5
					}]
				},
				{
					Stage: "SST_CONVERT_TO_GRAYSCALE",
					ColourConversionModes: [
						{ Mode: "CICM_GENERAL" },
						{ Mode: "CICM_EDGE_ENHANCEMENT" },
						{
							Mode: "CICM_HSV",
							ReferChannel: "H_CHANNEL"
						}
					]
				},
				{
					Stage: "SST_DETECT_TEXTURE",
					TextureDetectionModes: [{
						Mode: "TDM_GENERAL_WIDTH_CONCENTRATION",
						Sensitivity: 8
					}]
				}
			]
		},
		{
			Name: "ip-detect",
			ApplicableStages: [
				{
					Stage: "SST_CONVERT_TO_GRAYSCALE",
					ColourConversionModes: [
						{ Mode: "CICM_GENERAL" },
						{ Mode: "CICM_EDGE_ENHANCEMENT" },
						{
							Mode: "CICM_HSV",
							ReferChannel: "H_CHANNEL"
						}
					]
				},
				{
					Stage: "SST_BINARIZE_IMAGE",
					BinarizationModes: [{
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 25,
						BlockSizeY: 25,
						EnableFillBinaryVacancy: 0,
						ThresholdCompensation: 5
					}]
				},
				{
					Stage: "SST_BINARIZE_TEXTURE_REMOVED_GRAYSCALE",
					BinarizationModes: [{
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 25,
						BlockSizeY: 25,
						EnableFillBinaryVacancy: 0,
						ThresholdCompensation: 5
					}]
				},
				{
					Stage: "SST_DETECT_TEXT_ZONES",
					TextDetectionMode: {
						Mode: "TTDM_WORD",
						Direction: "HORIZONTAL",
						Sensitivity: 7
					}
				},
				{
					Stage: "SST_DETECT_TEXTURE",
					TextureDetectionModes: [{
						Mode: "TDM_GENERAL_WIDTH_CONCENTRATION",
						Sensitivity: 8
					}]
				}
			]
		},
		{
			Name: "ip-normalize",
			ApplicableStages: [
				{
					Stage: "SST_BINARIZE_IMAGE",
					BinarizationModes: [{
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 0,
						BlockSizeY: 0,
						EnableFillBinaryVacancy: 0
					}]
				},
				{
					Stage: "SST_BINARIZE_TEXTURE_REMOVED_GRAYSCALE",
					BinarizationModes: [{
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 0,
						BlockSizeY: 0,
						EnableFillBinaryVacancy: 0
					}]
				},
				{
					Stage: "SST_DETECT_TEXT_ZONES",
					TextDetectionMode: {
						Mode: "TTDM_WORD",
						Direction: "HORIZONTAL",
						Sensitivity: 7
					}
				}
			]
		},
		{
			Name: "ip-mrz",
			ApplicableStages: [
				{
					Stage: "SST_SCALE_IMAGE",
					ImageScaleSetting: {
						ScaleType: "ST_SCALE_DOWN",
						ReferenceEdge: "RE_SHORTER_EDGE",
						EdgeLengthThreshold: 99999
					}
				},
				{
					Stage: "SST_CONVERT_TO_GRAYSCALE",
					ColourConversionModes: [{
						Mode: "CICM_HSV",
						ReferChannel: "V_CHANNEL"
					}]
				},
				{
					Stage: "SST_BINARIZE_IMAGE",
					BinarizationModes: [{
						EnableFillBinaryVacancy: 0,
						Mode: "BM_THRESHOLD"
					}, {
						EnableFillBinaryVacancy: 0,
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 0,
						BlockSizeY: 0,
						ThresholdCompensation: 15
					}]
				},
				{
					Stage: "SST_BINARIZE_TEXTURE_REMOVED_GRAYSCALE",
					BinarizationModes: [{
						EnableFillBinaryVacancy: 0,
						Mode: "BM_THRESHOLD"
					}, {
						EnableFillBinaryVacancy: 0,
						Mode: "BM_LOCAL_BLOCK",
						BlockSizeX: 0,
						BlockSizeY: 0,
						ThresholdCompensation: 15
					}]
				},
				{
					Stage: "SST_DETECT_TEXTURE",
					TextureDetectionModes: [{
						Mode: "TDM_GENERAL_WIDTH_CONCENTRATION",
						Sensitivity: 8
					}]
				},
				{
					Stage: "SST_DETECT_TEXT_ZONES",
					TextDetectionMode: {
						Mode: "TTDM_LINE",
						MaxSpacingInALine: 300,
						CharHeightRange: [
							5,
							1e3,
							1
						],
						StringLengthRange: [9, 50],
						Direction: "HORIZONTAL",
						Sensitivity: 7
					}
				}
			]
		}
	],
	SemanticProcessingOptions: [
		{
			Name: "sp-passport-and-id",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-passport-and-id", "roi-passport-and-id-mrz-only"] },
			TaskSettingNameArray: ["dcp-passport-and-id"]
		},
		{
			Name: "sp-passport",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-passport", "roi-passport-mrz-only"] },
			TaskSettingNameArray: ["dcp-passport"]
		},
		{
			Name: "sp-passport-and-id-td1",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-passport-and-id-td1", "roi-passport-and-id-td1-mrz-only"] },
			TaskSettingNameArray: ["dcp-passport-and-id-td1"]
		},
		{
			Name: "sp-passport-and-id-td2",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-passport-and-id-td2", "roi-passport-and-id-td2-mrz-only"] },
			TaskSettingNameArray: ["dcp-passport-and-id-td2"]
		},
		{
			Name: "sp-id-td1",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-id-td1", "roi-id-td1-mrz-only"] },
			TaskSettingNameArray: ["dcp-id-td1"]
		},
		{
			Name: "sp-id-td2",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-id-td2", "roi-id-td2-mrz-only"] },
			TaskSettingNameArray: ["dcp-id-td2"]
		},
		{
			Name: "sp-id",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-id", "roi-id-mrz-only"] },
			TaskSettingNameArray: ["dcp-id"]
		},
		{
			Name: "sp-visa",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-visa", "roi-visa-mrz-only"] },
			TaskSettingNameArray: ["dcp-visa"]
		},
		{
			Name: "sp-visa-mrva",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-visa-mrva", "roi-visa-mrva-mrz-only"] },
			TaskSettingNameArray: ["dcp-visa-mrva"]
		},
		{
			Name: "sp-visa-mrvb",
			ReferenceObjectFilter: { ReferenceTargetROIDefNameArray: ["roi-visa-mrvb", "roi-visa-mrvb-mrz-only"] },
			TaskSettingNameArray: ["dcp-visa-mrvb"]
		}
	],
	CodeParserTaskSettingOptions: [
		{
			Name: "dcp-passport-and-id",
			CodeSpecifications: [
				"MRTD_TD3_PASSPORT",
				"MRTD_TD2_VISA",
				"MRTD_TD3_VISA",
				"MRTD_TD1_ID",
				"MRTD_TD2_ID",
				"MRTD_TD2_FRENCH_ID"
			]
		},
		{
			Name: "dcp-passport",
			CodeSpecifications: ["MRTD_TD3_PASSPORT"]
		},
		{
			Name: "dcp-id-td1",
			CodeSpecifications: ["MRTD_TD1_ID"]
		},
		{
			Name: "dcp-id-td2",
			CodeSpecifications: ["MRTD_TD2_ID", "MRTD_TD2_FRENCH_ID"]
		},
		{
			Name: "dcp-passport-and-id-td1",
			CodeSpecifications: ["MRTD_TD3_PASSPORT", "MRTD_TD1_ID"]
		},
		{
			Name: "dcp-passport-and-id-td2",
			CodeSpecifications: [
				"MRTD_TD3_PASSPORT",
				"MRTD_TD2_ID",
				"MRTD_TD2_FRENCH_ID"
			]
		},
		{
			Name: "dcp-id",
			CodeSpecifications: [
				"MRTD_TD1_ID",
				"MRTD_TD2_ID",
				"MRTD_TD2_FRENCH_ID"
			]
		},
		{
			Name: "dcp-visa",
			CodeSpecifications: ["MRTD_TD2_VISA", "MRTD_TD3_VISA"]
		},
		{
			Name: "dcp-visa-mrva",
			CodeSpecifications: ["MRTD_TD3_VISA"]
		},
		{
			Name: "dcp-visa-mrvb",
			CodeSpecifications: ["MRTD_TD2_VISA"]
		}
	]
}, ke = "dm-camera-core-container", Ae = "dce-viewfinder-container", je = { rootDirectory: "https://cdn.jsdelivr.net/npm/" }, Me = "100dvh", Ne = class n {
	showLoadingOverlay(e) {
		let t = this.config.scannerViewConfig?.container;
		if (!t) throw Error("Scanner view container not configured");
		let n = S(t);
		if (!n) throw Error("Scanner view container element not found");
		this.loadingScreen = D(n, { message: e }), n.style.display = "block", n.style.position = "relative";
	}
	hideLoadingOverlay(e = !1) {
		let t = S(this.config.scannerViewConfig?.container);
		t && this.loadingScreen && (this.loadingScreen.hide(), this.loadingScreen = null, t.style.display = "none", e && this.config?.container && (S(this.config.container).style.display = "none"));
	}
	constructor(e) {
		this.config = e, this.resources = {}, this.isInitialized = !1, this.isCapturing = !1, this.loadingScreen = null, this.isDynamsoftResourcesLoaded = !1, this.isFileMode = !1, this.isDynamsoftResourcesLoaded || this.initializeDynamsoftResources();
	}
	static normalizeTemplateName(e) {
		return typeof e == "string" ? {
			full: e,
			mrzOnly: `${e}-MRZOnly`
		} : e;
	}
	async initialize() {
		if (this.isInitialized) return {
			resources: this.resources,
			components: { scannerView: this.scannerView }
		};
		try {
			if (!this.initializeMRZScannerConfig()) return console.error("Failed to initialize mrz scanner config"), {
				resources: this.resources,
				components: {}
			};
			C("dynamsoft-mrz-loading-screen-style", O), this.showLoadingOverlay("Loading..."), await this.initializeDCVResources(), this.resources.onResultUpdated = (e) => {
				this.resources.result = e;
			}, this.resources.returnOriginalImage = this.config.returnOriginalImage ?? !1, this.resources.returnDocumentImage = this.config.returnDocumentImage ?? !0, this.resources.returnPortraitImage = this.config.returnPortraitImage ?? !0;
			let e = {};
			return !this.isFileMode && this.config.scannerViewConfig && (this.scannerView = new De(this.resources, this.config.scannerViewConfig), e.scannerView = this.scannerView, await this.scannerView.initialize()), this.isInitialized = !0, {
				resources: this.resources,
				components: e
			};
		} catch (e) {
			this.isInitialized = !1;
			let t = `Initialization Failed: ${e?.message || e}`;
			throw console.error(t), Error(t);
		} finally {
			this.hideLoadingOverlay(!0);
		}
	}
	initializeDynamsoftResources() {
		i.engineResourcePaths = w(this.config?.engineResourcePaths) ? je : this.config.engineResourcePaths, i.loadWasm(), r.loadSpec("MRTD"), this.isDynamsoftResourcesLoaded = !0;
	}
	async initializeDCVResources() {
		try {
			if (this.isDynamsoftResourcesLoaded || this.initializeDynamsoftResources(), f._onAuthMessage = (e) => e.replace("(https://www.dynamsoft.com/customer/license/trialLicense?product=unknown&deploymenttype=unknown)", "(https://www.dynamsoft.com/customer/license/trialLicense?product=mrz&deploymenttype=web)"), await f.initLicense(this.config?.license || "", { executeNow: !0 }), !this.isFileMode) {
				let t = this.config.scannerViewConfig?.cameraEnhancerUIPath, n;
				if (t) if (t.trimStart().startsWith("<")) n = t;
				else try {
					n = await fetch(t).then((e) => e.text());
				} catch (e) {
					console.warn(`Failed to fetch UI from ${t}, using default UI:`, e);
				}
				n &&= n.replace(Ae, `${ke} ${Ae}`), this.resources.cameraEnhancer = await e.createInstance(n), this.resources.cameraView = this.resources.cameraEnhancer;
			}
			this.resources.cvRouter = await t.createInstance(), await t.appendDLModelBuffer([
				"MRZLocalization",
				"MRZCharRecognition",
				"MRZTextLineRecognition"
			]);
			let n = this.config.templateFilePath, r = await this.resources.cvRouter.initSettings(n);
			if (r?.errorCode !== 0) throw Error(`Failed to load template (${r.errorCode}): ${r.errorString}`);
		} catch (e) {
			let t = typeof e == "string" ? e : e?.message ?? (typeof e == "object" ? JSON.stringify(e) : String(e)), n = t?.toLowerCase().includes("license") ? "The MRZ Scanner license is invalid or has expired. Please contact the site administrator to resolve this issue." : `Resource Initialization Failed: ${t}`;
			throw console.error(n), Error(n);
		}
	}
	shouldCreateDefaultContainer() {
		let e = !this.config.container, t = !this.config.scannerViewConfig?.container;
		return e && t;
	}
	createDefaultMRZScannerContainer() {
		let e = document.createElement("div");
		return e.className = "mrz-scanner-main-container", Object.assign(e.style, {
			height: Me,
			width: "100%",
			position: "absolute",
			left: "0",
			top: "0",
			zIndex: "999"
		}), document.body.append(e), e;
	}
	checkForTemporaryLicense(e) {
		return !e?.length || e?.startsWith("A") || e?.startsWith("L") || e?.startsWith("P") || e?.startsWith("Y") ? "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9" : e;
	}
	validateViewConfigs() {
		try {
			if (this.config.container && !S(this.config.container)) {
				let e = "Invalid main container reference";
				return alert(e), console.error(e), !1;
			}
			if (this.config.scannerViewConfig?.container && !S(this.config.scannerViewConfig?.container)) {
				let e = "Invalid scanner view container reference";
				return alert(e), console.error(e), !1;
			}
		} catch (e) {
			let t = `Error accessing container references: ${e instanceof Error ? e.message : String(e)}`;
			return alert(t), console.error(t), !1;
		}
		return !0;
	}
	initializeMRZScannerConfig() {
		if (this.config = this.config ?? {}, !this.validateViewConfigs()) return !1;
		this.shouldCreateDefaultContainer() ? this.config.container = this.createDefaultMRZScannerContainer() : this.config.container && (this.config.container = S(this.config.container) ?? void 0);
		let e = this.config.container ? this.createViewContainers(S(this.config.container)) : {}, t = {
			license: this.checkForTemporaryLicense(this.config.license),
			utilizedTemplateNames: Object.fromEntries(Object.values(v).map((e) => [e, n.normalizeTemplateName(this.config.utilizedTemplateNames?.[e] || b[e])])),
			templateFilePath: this.config?.templateFilePath || Oe
		}, r = {
			...this.config.scannerViewConfig,
			container: e[y.Scanner] || S(this.config.scannerViewConfig?.container) || null,
			cameraEnhancerUIPath: this.config.scannerViewConfig?.uiPath || this.config.scannerViewConfig?.cameraEnhancerUIPath || "<div\r\n	style=\"\r\n		position: relative;\r\n		width: 100%;\r\n		height: 100%;\r\n		min-width: 100px;\r\n		min-height: 100px;\r\n		background: #000;\r\n	\"\r\n>\r\n	<div\r\n		class=\"dce-camera-related-container\"\r\n		style=\"position: relative; width: 100%; height: 100%; background-color: black\"\r\n	>\r\n		<!-- Loading spinner shown while camera initializes -->\r\n		<svg\r\n			class=\"dce-bg-loading\"\r\n			style=\"\r\n				display: none;\r\n				position: absolute;\r\n				left: 0;\r\n				top: 0;\r\n				right: 0;\r\n				bottom: 0;\r\n				margin: auto;\r\n				width: 20%;\r\n				height: 20%;\r\n				fill: #aaa;\r\n				animation: 1s linear infinite dce-rotate;\r\n				z-index: 3;\r\n			\"\r\n			viewBox=\"0 0 1792 1792\"\r\n		>\r\n			<path\r\n				d=\"M1760 896q0 176-68.5 336t-184 275.5-275.5 184-336 68.5-336-68.5-275.5-184-184-275.5-68.5-336q0-213 97-398.5t265-305.5 374-151v228q-221 45-366.5 221t-145.5 406q0 130 51 248.5t136.5 204 204 136.5 248.5 51 248.5-51 204-136.5 136.5-204 51-248.5q0-230-145.5-406t-366.5-221v-228q206 31 374 151t265 305.5 97 398.5z\"\r\n			/>\r\n		</svg>\r\n\r\n		<!-- Camera icon shown before camera permission granted -->\r\n		<svg\r\n			class=\"dce-bg-camera\"\r\n			style=\"\r\n				display: none;\r\n				position: absolute;\r\n				left: 0;\r\n				top: 0;\r\n				right: 0;\r\n				bottom: 0;\r\n				margin: auto;\r\n				width: 40%;\r\n				height: 40%;\r\n				fill: #aaa;\r\n			\"\r\n			viewBox=\"0 0 2048 1792\"\r\n		>\r\n			<path\r\n				d=\"M1024 672q119 0 203.5 84.5t84.5 203.5-84.5 203.5-203.5 84.5-203.5-84.5-84.5-203.5 84.5-203.5 203.5-84.5zm704-416q106 0 181 75t75 181v896q0 106-75 181t-181 75h-1408q-106 0-181-75t-75-181v-896q0-106 75-181t181-75h224l51-136q19-49 69.5-84.5t103.5-35.5h512q53 0 103.5 35.5t69.5 84.5l51 136h224zm-704 1152q185 0 316.5-131.5t131.5-316.5-131.5-316.5-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5z\"\r\n			/>\r\n		</svg>\r\n\r\n		<!-- Camera viewfinder container (DCE injects video feed here) -->\r\n		<div\r\n			class=\"dce-viewfinder-container\"\r\n			style=\"position: absolute; left: 0; top: 0; width: 100%; height: 100%\"\r\n		></div>\r\n\r\n		<!-- Scan area container (required by DCE for scan region overlay) -->\r\n		<div\r\n			class=\"dce-scanarea\"\r\n			style=\"position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none\"\r\n		>\r\n			<!-- Scan spinner shown during active scanning -->\r\n			<svg class=\"dce-mn-scan-spinner\" viewBox=\"0 0 56 56\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\r\n				<rect class=\"dce-spinner-bg\" width=\"56\" height=\"56\" rx=\"8\" />\r\n				<g class=\"dce-spinner-inner\" clip-path=\"url(#dce-spinner-clip)\">\r\n					<path d=\"M25.0759 15.968V8.18762C16.2732 9.50351 9.32755 16.3824 8.00195 25.1036H15.8608C16.9879 20.6144 20.5493 17.0842 25.0759 15.968Z\" />\r\n					<path d=\"M30.9277 15.968C35.4574 17.0842 39.0187 20.6144 40.1428 25.1036H48.0016C46.6761 16.3824 39.7304 9.50351 30.9277 8.18762V15.968Z\" />\r\n					<path d=\"M25.0759 40.0321C20.5462 38.9158 16.9848 35.3856 15.8608 30.8965H8.00195C9.32755 39.6176 16.2732 46.4965 25.0759 47.8124V40.0321Z\" />\r\n					<path d=\"M30.9277 40.0321V47.8124C39.7304 46.4965 46.6761 39.6176 48.0016 30.8965H40.1428C39.0157 35.3856 35.4543 38.9158 30.9277 40.0321Z\" />\r\n				</g>\r\n				<defs>\r\n					<clipPath id=\"dce-spinner-clip\">\r\n						<rect width=\"40\" height=\"40\" fill=\"white\" transform=\"translate(8 8)\" />\r\n					</clipPath>\r\n				</defs>\r\n			</svg>\r\n		</div>\r\n	</div>\r\n</div>\r\n\r\n<style>\r\n	/* Animation keyframes */\r\n	@keyframes dce-rotate {\r\n		from { transform: rotate(0deg); }\r\n		to { transform: rotate(360deg); }\r\n	}\r\n\r\n	@keyframes dce-spin {\r\n		from { transform: rotate(0deg); }\r\n		to { transform: rotate(360deg); }\r\n	}\r\n\r\n	/* Scan spinner styles (used by MRZScannerView) */\r\n	.dce-mn-scan-spinner {\r\n		position: absolute;\r\n		top: 50%;\r\n		left: 50%;\r\n		width: 56px;\r\n		height: 56px;\r\n		margin: -28px 0 0 -28px;\r\n		opacity: 0;\r\n		transition: opacity 0.15s ease;\r\n		pointer-events: none;\r\n		z-index: 4;\r\n	}\r\n\r\n	.dce-mn-scan-spinner.dce-visible {\r\n		opacity: 1;\r\n	}\r\n\r\n	.dce-mn-scan-spinner .dce-spinner-bg {\r\n		fill: var(--mrz-spinner-background, rgba(0, 0, 0, 0.2));\r\n	}\r\n\r\n	.dce-mn-scan-spinner .dce-spinner-inner {\r\n		animation: dce-spin 1.2s linear infinite;\r\n		transform-origin: 28px 28px;\r\n	}\r\n\r\n	.dce-mn-scan-spinner .dce-spinner-inner path {\r\n		fill: var(--mrz-spinner-color, #fff);\r\n	}\r\n\r\n	@media (prefers-reduced-motion: reduce) {\r\n		.dce-mn-scan-spinner .dce-spinner-inner { animation: none; }\r\n	}\r\n</style>\r\n",
			templateFilePath: t.templateFilePath,
			utilizedTemplateNames: t.utilizedTemplateNames,
			enableMultiFrameCrossFilter: this.config.scannerViewConfig?.enableMultiFrameCrossFilter ?? !0,
			mrzFormatType: this.config.mrzFormatType
		};
		return Object.assign(this.config, {
			...t,
			scannerViewConfig: r
		}), !0;
	}
	createViewContainers(e) {
		return e.textContent = "", [y.Scanner].reduce((t, n) => {
			let r = document.createElement("div");
			return r.className = `mrz-scanner-${n}-view-container`, Object.assign(r.style, {
				height: "100%",
				width: "100%",
				display: "none",
				position: "relative"
			}), e.append(r), t[n] = r, t;
		}, {});
	}
	dispose() {
		this.scannerView = void 0, this.resources.cameraEnhancer && (this.resources.cameraEnhancer.dispose(), this.resources.cameraEnhancer = void 0, this.resources.cameraView = void 0), this.resources.cvRouter && (this.resources.cvRouter.dispose(), this.resources.cvRouter = void 0), this.resources.result = void 0, this.resources.onResultUpdated = void 0;
		let e = (e) => {
			let t = S(e);
			t && (t.style.display = "none", t.textContent = "");
		};
		e(this.config.container), e(this.config.scannerViewConfig?.container), this.isInitialized = !1;
	}
	async processImageSource(e) {
		try {
			this.showLoadingOverlay("Processing image...");
			let t = this.resources.cvRouter;
			if (!t) throw Error("CaptureVisionRouter not initialized");
			let n;
			if (typeof e == "string") {
				let t = await fetch(e);
				if (!t.ok) throw Error(`Failed to fetch image: ${t.status} ${t.statusText}`);
				n = await t.blob();
			} else n = e;
			let r = this.config.utilizedTemplateNames.all.full, i = await te(await t.capture(n, r), {
				returnDocumentImage: this.resources.returnDocumentImage,
				returnPortraitImage: this.resources.returnPortraitImage
			}), a = new R({
				status: x.RS_SUCCESS,
				data: i.processedData,
				primaryOriginalImage: i.imageData,
				primaryDocumentImage: i.primaryDocumentImage,
				portraitImage: i.portraitImage
			});
			return this.resources.onResultUpdated?.(a), a;
		} catch (e) {
			return console.error("Failed to process image source:", e), new R({ status: x.RS_FAILED });
		} finally {
			this.hideLoadingOverlay(!1);
		}
	}
	async launch(e) {
		if (this.isCapturing) throw Error("Capture session already in progress");
		try {
			this.isCapturing = !0, this.isFileMode = !!e;
			let { components: t } = await this.initialize();
			if (this.config.container && (S(this.config.container).style.display = "block"), this.isFileMode) return await this.processImageSource(e), this.resources.result;
			if (!t.scannerView && this.resources.result) return this.resources.result;
			if (!t.scannerView) throw Error("Scanner view is required when no previous result exists");
			let n = await t.scannerView.launch();
			return n?.status === x.RS_SUCCESS ? this.resources.result : new R({ status: n?.status ?? x.RS_FAILED });
		} catch (e) {
			let t = e instanceof Error ? e.message : String(e);
			return alert(t), console.error(t), new R({ status: x.RS_FAILED });
		} finally {
			this.isCapturing = !1, this.dispose();
		}
	}
}, Pe = {
	MRZScanner: Ne,
	MRZScannerView: De
};
//#endregion
export { b as DEFAULT_TEMPLATE_NAMES, Pe as DynamsoftMRZScanner, g as EnumDocumentSide, k as EnumMRZData, _ as EnumMRZDocumentType, v as EnumMRZScanMode, y as EnumMRZScannerViews, x as EnumResultStatus, A as MRZDataLabel, Ne as MRZScanner, De as MRZScannerView, N as displayMRZDate };

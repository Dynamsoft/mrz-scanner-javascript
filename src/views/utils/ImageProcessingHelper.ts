import {
	_toBlob,
	_toCanvas,
	CapturedResult,
	DSImageData,
	EnumCapturedResultItemType,
	IdentityProcessor,
	ImageProcessor,
	LocalizedTextLinesUnit,
	MimeType,
	OriginalImageResultItem,
	ParsedResultItem,
	Quadrilateral,
	TextLineResultItem,
} from "dynamsoft-capture-vision-bundle";
import { MRZData, processMRZData } from "./MRZParser";

const CROP_MARGIN_PX = 14;
export const PORTRAIT_MARGINS = { top: 30, bottom: 15, left: 5, right: 10 };
const MIN_QUAD_AREA_RATIO = 0.05;
const MIN_DOCUMENT_TO_PORTRAIT_AREA_RATIO = 3;
const ALREADY_CROPPED_THRESHOLD = 0.75;
const PORTRAIT_CONFIDENCE_THRESHOLD = 70;

/**
 * A captured image returned from {@link MRZResult.getDocumentImage},
 * {@link MRZResult.getOriginalImage}, and {@link MRZResult.getPortraitImage}.
 *
 * Extends the bare {@link DSImageData} (raw bytes / dimensions / format)
 * with the rendering helpers attached at runtime by {@link attachImageHelpers}.
 */
export interface MRZImage extends DSImageData {
	/** Render the image data into an `HTMLCanvasElement`. */
	toCanvas(): HTMLCanvasElement;
	/** Encode the image data as a PNG `Blob`. */
	toBlob(): Promise<Blob>;
}

export function attachImageHelpers(image: DSImageData): MRZImage {
	const enriched = image as MRZImage;
	enriched.toCanvas = () => _toCanvas(image);
	enriched.toBlob = async () => await _toBlob(`image/png` as MimeType, image);
	return enriched;
}

function isValidPortraitQuad(quad: Quadrilateral | null): boolean {
	if (!quad || (quad as any).errorCode) return false;
	if (!quad.points || quad.points.length !== 4) return false;
	if (!quad.area || quad.area <= 0) return false;
	return true;
}

export function isPointInQuadrilateral(
	point: { x: number; y: number },
	quad: Quadrilateral,
): boolean {
	const points = quad.points;
	let inside = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const xi = points[i].x,
			yi = points[i].y;
		const xj = points[j].x,
			yj = points[j].y;
		const intersect =
			yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

export function validatePortraitLocation(
	portraitQuad: Quadrilateral,
	documentQuad: Quadrilateral,
): boolean {
	const allPointsInside = portraitQuad.points.every((point: any) =>
		isPointInQuadrilateral(point, documentQuad),
	);

	if (!allPointsInside) {
		return false;
	}
	if (!documentQuad.area || !portraitQuad.area || portraitQuad.area === 0) {
		return false;
	}

	const areaRatio = documentQuad.area / portraitQuad.area;
	return areaRatio >= MIN_DOCUMENT_TO_PORTRAIT_AREA_RATIO;
}

export function getValidDocumentQuad(result: CapturedResult): Quadrilateral | null {
	const documentResult = result.processedDocumentResult;
	const quadItem = documentResult?.detectedQuadResultItems?.[0];
	if (!quadItem) return null;
	const quad = quadItem.location;
	if (!quad || !quad.points || quad.points.length !== 4) return null;
	if (!quad.area || quad.area <= 0) return null;
	return quad;
}

export function hasHighConfidencePortraitZone(
	latestLocalizedTextLines: LocalizedTextLinesUnit | null,
): boolean {
	const elements = latestLocalizedTextLines?.auxiliaryRegionElements;
	if (!elements) return true;
	return elements.some(
		(el) => el.name === "PortraitZone" && el.confidence > PORTRAIT_CONFIDENCE_THRESHOLD,
	);
}

export type ExpandMargin =
	| number
	| { top?: number; bottom?: number; left?: number; right?: number };

export function expandQuad(
	quad: Quadrilateral,
	margin: ExpandMargin,
	imageData: DSImageData | null,
): Quadrilateral {
	const m =
		typeof margin === "number"
			? { top: margin, bottom: margin, left: margin, right: margin }
			: {
					top: margin.top ?? 0,
					bottom: margin.bottom ?? 0,
					left: margin.left ?? 0,
					right: margin.right ?? 0,
				};

	const pts = quad.points;
	const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
	const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
	const maxX = imageData ? imageData.width - 1 : Infinity;
	const maxY = imageData ? imageData.height - 1 : Infinity;

	const expandedPoints = pts.map((p: { x: number; y: number }) => {
		const isRight = p.x > cx;
		const isBottom = p.y > cy;
		const offsetX = isRight ? m.right : -m.left;
		const offsetY = isBottom ? m.bottom : -m.top;

		return {
			x: Math.max(0, Math.min(maxX, p.x + offsetX)),
			y: Math.max(0, Math.min(maxY, p.y + offsetY)),
		};
	}) as [
		{ x: number; y: number },
		{ x: number; y: number },
		{ x: number; y: number },
		{ x: number; y: number },
	];

	return { points: expandedPoints };
}

export interface ProcessImageOptions {
	returnDocumentImage?: boolean;
	returnPortraitImage?: boolean;
	validatePortraitLocation?: boolean;
	overrideDocumentResult?: CapturedResult["processedDocumentResult"] | null;
}

export interface ProcessedImageResult {
	imageData: MRZImage;
	processedData: MRZData;
	primaryDocumentImage: MRZImage | null;
	portraitImage: MRZImage | null;
}

export async function processImageFromCapturedResult(
	capturedResult: CapturedResult,
	options: ProcessImageOptions = {},
): Promise<ProcessedImageResult> {
	const {
		returnDocumentImage = false,
		returnPortraitImage = false,
		validatePortraitLocation: shouldValidatePortraitLocation = false,
		overrideDocumentResult = null,
	} = options;

	const originalImageItems = capturedResult.items.filter(
		(item: any) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE,
	) as OriginalImageResultItem[];

	if (originalImageItems.length === 0) {
		throw new Error("No image data found in captured result");
	}

	const imageData = attachImageHelpers(originalImageItems[0].imageData);

	const parsedResultItems = capturedResult?.parsedResult?.parsedResultItems;
	let processedData = {} as MRZData;
	if (parsedResultItems?.length) {
		const mrzText =
			((parsedResultItems[0] as any)?.referenceItem as TextLineResultItem)?.text || "";
		const parsedResult = parsedResultItems[0] as ParsedResultItem;
		processedData = processMRZData(mrzText, parsedResult)!;
	}

	let portraitQuadEarly: Quadrilateral | null = null;
	if (returnPortraitImage) {
		try {
			portraitQuadEarly = await IdentityProcessor.findPortraitZone();
		} catch {}
	}

	let primaryDocumentImage: MRZImage | null = null;
	let documentQuad: Quadrilateral | null = null;

	if (returnDocumentImage) {
		try {
			const documentResult = overrideDocumentResult ?? capturedResult.processedDocumentResult;
			const quadItem = documentResult?.detectedQuadResultItems?.[0];

			if (quadItem) {
				const quadLocation = quadItem.location;
				const imageArea = imageData.width * imageData.height;
				const quadArea = quadLocation?.area ?? 0;
				const areaRatio = quadArea / imageArea;

				const isQuadValid = quadLocation && quadArea > 0 && areaRatio >= MIN_QUAD_AREA_RATIO;

				if (isQuadValid) {
					documentQuad = quadLocation;
					const isAlreadyCropped = areaRatio > ALREADY_CROPPED_THRESHOLD;

					if (isAlreadyCropped) {
						primaryDocumentImage = imageData;
					} else {
						const deskewedItem = documentResult?.deskewedImageResultItems?.[0];

						if (deskewedItem?.imageData) {
							primaryDocumentImage = attachImageHelpers(deskewedItem.imageData);
						} else {
							const expandedQuad = expandQuad(documentQuad, CROP_MARGIN_PX, imageData);
							primaryDocumentImage = attachImageHelpers(
								await ImageProcessor.cropAndDeskewImage(imageData, expandedQuad),
							);
						}
					}
				}
			}

			if (!primaryDocumentImage) {
				primaryDocumentImage = imageData;
			}
		} catch {
			primaryDocumentImage = imageData;
		}
	}

	let portraitImage: MRZImage | null = null;
	if (returnPortraitImage && portraitQuadEarly) {
		try {
			if (!isValidPortraitQuad(portraitQuadEarly)) {
				return { imageData, processedData, primaryDocumentImage, portraitImage: null };
			}

			const isValid =
				shouldValidatePortraitLocation && documentQuad
					? validatePortraitLocation(portraitQuadEarly, documentQuad)
					: true;

			if (isValid) {
				const expandedQuad = expandQuad(portraitQuadEarly, PORTRAIT_MARGINS, imageData);
				portraitImage = attachImageHelpers(
					await ImageProcessor.cropAndDeskewImage(imageData, expandedQuad),
				);
			}
		} catch {}
	}

	return {
		imageData,
		processedData,
		primaryDocumentImage,
		portraitImage,
	};
}

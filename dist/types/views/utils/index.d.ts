import { ToolbarButton } from "./types";
export declare function getElement(element: string | HTMLElement): HTMLElement | null;
export declare function createControls(buttons: ToolbarButton[], containerStyle?: Partial<CSSStyleDeclaration>): HTMLElement;
export declare function createStyle(id: string, style: string): void;
export declare function isSVGString(str: string): boolean;
export declare const isEmptyObject: (obj: object | null | undefined) => boolean;
export declare function checkOrientation(): "portrait" | "landscape";
export declare function capitalize(string: String): string;
export declare const STANDARD_RESOLUTIONS: {
    readonly "4k": {
        readonly width: 3840;
        readonly height: 2160;
    };
    readonly "2k": {
        readonly width: 2560;
        readonly height: 1440;
    };
    readonly "1080p": {
        readonly width: 1920;
        readonly height: 1080;
    };
    readonly "720p": {
        readonly width: 1280;
        readonly height: 720;
    };
    readonly "480p": {
        readonly width: 640;
        readonly height: 480;
    };
};
type ResolutionLevel = keyof typeof STANDARD_RESOLUTIONS;
export declare function findClosestResolutionLevel(selectedResolution: {
    width: number;
    height: number;
}): ResolutionLevel;
export {};
//# sourceMappingURL=index.d.ts.map
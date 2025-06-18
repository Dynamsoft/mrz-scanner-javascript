interface LoadingScreenOptions {
    message?: string;
    spinnerSize?: number;
}
export declare function showLoadingScreen(container: HTMLElement, options?: LoadingScreenOptions): {
    element: HTMLDivElement;
    updateMessage: (newMessage: string | null) => void;
    hide: () => void;
};
export declare const DEFAULT_LOADING_SCREEN_STYLE = "\n  .dynamsoft-mrz-loading-screen {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background-color: #323234;\n    z-index: 998;\n    opacity: 1;\n    transition: opacity 0.2s ease-out;\n  }\n\n  .dynamsoft-mrz-loading-screen.fade-out {\n    opacity: 0;\n  }\n\n  .dynamsoft-mrz-loading {\n    position: absolute;\n    left: 50%;\n    top: 50%;\n    color: white;\n    z-index: 999;\n    transform: translate(-50%, -50%);\n  }\n\n  .dynamsoft-mrz-loading-content {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 16px;\n  }\n\n  .dynamsoft-mrz-loading svg {\n    animation: spin 1s linear infinite;\n  }\n\n  .dynamsoft-mrz-loading-message {\n    color: white;\n    font-family: \"Verdana\";\n    font-size: 14px;\n    text-align: center;\n    max-width: 200px;\n    line-height: 1.4;\n    opacity: 0.9;\n  }\n\n  @keyframes spin {\n    from {\n      transform: rotate(0deg);\n    }\n    to {\n      transform: rotate(360deg);\n    }\n  }\n";
export {};
//# sourceMappingURL=LoadingScreen.d.ts.map
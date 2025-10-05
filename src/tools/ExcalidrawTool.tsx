import type {
  BlockTool,
  BlockToolConstructorOptions,
} from "@editorjs/editorjs";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import React from "react";
import ExcalidrawBoard from "./ExcalidrawBoard";
export interface ExcalidrawData {
  elements: any[];
  appState: any;
  files: any;
  height?: number;
}

export default class ExcalidrawTool implements BlockTool {
  private readOnly: boolean;
  private data: ExcalidrawData;
  private wrapper: HTMLElement | null = null;
  private reactRoot: Root | null = null;
  private resizeHandle: HTMLElement | null = null;
  private isResizing = false;
  private startY = 0;
  private startHeight = 0;

  static get toolbox() {
    return {
      title: "Drawing Board",
      icon: `<svg
          data-v-6433c584=""
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-presentation-icon lucide-presentation"
        >
          <path d="M2 3h20"></path>
          <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path>
          <path d="m7 21 5-5 5 5"></path>
        </svg>`,
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, readOnly }: BlockToolConstructorOptions) {
    this.readOnly = readOnly || false;

    // Ensure appState has proper default structure for Excalidraw
    const defaultAppState = {
      collaborators: new Map(),
      currentItemStrokeColor: "#000000",
      currentItemBackgroundColor: "transparent",
      currentItemFillStyle: "hachure",
      currentItemStrokeWidth: 1,
      currentItemStrokeStyle: "solid",
      currentItemRoughness: 1,
      currentItemOpacity: 100,
      currentItemFontFamily: 1,
      currentItemFontSize: 20,
      currentItemTextAlign: "left",
      currentItemStartArrowhead: null,
      currentItemEndArrowhead: "arrow",
      scrollX: 0,
      scrollY: 0,
      zoom: { value: 1 },
      currentItemRoundness: "round",
      gridSize: null,
      colorPalette: {},
    };

    this.data = {
      elements: data?.elements || [],
      files: data?.files || {},
      height: data?.height || 500,
      // Ensure appState is properly merged with defaults
      appState: {
        ...defaultAppState,
        ...(data?.appState || {}),
        // Ensure collaborators is always a Map
        collaborators:
          data?.appState?.collaborators instanceof Map
            ? data.appState.collaborators
            : new Map(
                data?.appState?.collaborators
                  ? Object.entries(data.appState.collaborators)
                  : []
              ),
      },
    };
  }

  render(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      position: relative;
      width: 100%;
      margin: 10px 0;
    `;

    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("excalidraw-tool-wrapper");
    this.wrapper.style.cssText = `
      width: 100%;
      height: ${this.data.height || 500}px;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      overflow: hidden;
      resize: none;
      position: relative;
      z-index: 1;
    `;

    // Create resize handle
    this.resizeHandle = document.createElement("div");
    this.resizeHandle.style.cssText = `
      position: absolute;
      bottom: -5px;
      left: 0;
      right: 0;
      height: 10px;
      cursor: ns-resize;
      background: transparent;
      border-radius: 0 0 8px 8px;
    `;

    // Add resize handle visual indicator
    const resizeIndicator = document.createElement("div");
    resizeIndicator.style.cssText = `
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 3px;
      background: #ccc;
      border-radius: 2px;
    `;
    this.resizeHandle.appendChild(resizeIndicator);

    // Add resize event listeners
    this.resizeHandle.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Create React root and render Excalidraw
    this.reactRoot = createRoot(this.wrapper);
    this.reactRoot.render(
      React.createElement(ExcalidrawBoard, {
        initialData: this.data,
        readOnly: this.readOnly,
        onChange: (elements: any, appState: any, files: any) => {
          this.data = { ...this.data, elements, appState, files };
        },
      })
    );

    container.appendChild(this.wrapper);
    container.appendChild(this.resizeHandle);

    return container;
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isResizing = true;
    this.startY = e.clientY;
    this.startHeight = this.wrapper?.offsetHeight || 500;
    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isResizing || !this.wrapper) return;

    const deltaY = e.clientY - this.startY;
    const newHeight = Math.max(200, this.startHeight + deltaY); // Minimum height of 200px

    this.wrapper.style.height = `${newHeight}px`;
    this.data.height = newHeight;
  }

  private handleMouseUp(): void {
    this.isResizing = false;
  }

  save(): ExcalidrawData {
    return this.data;
  }

  destroy() {
    // Clean up event listeners
    document.removeEventListener("mousemove", this.handleMouseMove.bind(this));
    document.removeEventListener("mouseup", this.handleMouseUp.bind(this));

    if (this.reactRoot) {
      this.reactRoot.unmount();
    }
  }

  static get sanitize() {
    return {
      elements: true,
      appState: true,
      files: true,
    };
  }
}

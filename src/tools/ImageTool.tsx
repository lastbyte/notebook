import type {
  BlockTool,
  BlockToolConstructorOptions,
} from "@editorjs/editorjs";

export interface ImageData {
  url: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default class ImageTool implements BlockTool {
  private readOnly: boolean;
  private data: ImageData;
  private wrapper: HTMLElement | null = null;
  private imageElement: HTMLImageElement | null = null;
  private captionElement: HTMLElement | null = null;
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private resizeHandle: HTMLElement | null = null;
  private resizeMode: "width" | "height" | "both" = "width";

  static get toolbox() {
    return {
      title: "Image",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>`,
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, readOnly }: BlockToolConstructorOptions) {
    this.readOnly = readOnly || false;
    this.data = data || {
      url: "",
      caption: "",
      alt: "",
      width: undefined,
      height: undefined,
    };
  }

  render(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      position: relative;
      width: 100%;
      margin: 10px 0;
      text-align: center;
    `;

    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("image-tool-wrapper");
    this.wrapper.style.cssText = `
      display: inline-block;
      position: relative;
      max-width: 100%;
    `;

    if (this.data.url) {
      this.renderImage();
    } else {
      this.renderUrlInput();
    }

    container.appendChild(this.wrapper);
    return container;
  }

  private renderUrlInput(): void {
    if (!this.wrapper) return;

    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      border: 2px dashed #e1e5e9;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      background: #f8f9fa;
    `;

    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = "Enter image URL...";
    input.style.cssText = `
      width: 100%;
      max-width: 400px;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 12px;
      outline: none;
    `;

    input.addEventListener("focus", () => {
      input.style.borderColor = "#3b82f6";
    });

    input.addEventListener("blur", () => {
      input.style.borderColor = "#d1d5db";
    });

    const button = document.createElement("button");
    button.textContent = "Add Image";
    button.style.cssText = `
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
      margin-left: 8px;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.background = "#2563eb";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "#3b82f6";
    });

    const handleAddImage = () => {
      const url = input.value.trim();
      if (url) {
        this.data.url = url;
        this.wrapper!.innerHTML = "";
        this.renderImage();
      }
    };

    button.addEventListener("click", handleAddImage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleAddImage();
      }
    });

    const inputWrapper = document.createElement("div");
    inputWrapper.style.cssText =
      "display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 8px;";

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(button);
    inputContainer.appendChild(inputWrapper);

    const helpText = document.createElement("p");
    helpText.textContent =
      "Enter a valid image URL to add an image to your content";
    helpText.style.cssText = `
      margin: 16px 0 0 0;
      color: #6b7280;
      font-size: 14px;
    `;
    inputContainer.appendChild(helpText);

    this.wrapper.appendChild(inputContainer);
  }

  private renderImage(): void {
    if (!this.wrapper || !this.data.url) return;

    const imageContainer = document.createElement("div");
    imageContainer.style.cssText = `
      position: relative;
      display: inline-block;
      max-width: 100%;
    `;

    this.imageElement = document.createElement("img");
    this.imageElement.src = this.data.url;
    this.imageElement.alt = this.data.alt || "";
    this.imageElement.style.cssText = `
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ${this.data.width ? `width: ${this.data.width}px;` : ""}
      ${this.data.height ? `height: ${this.data.height}px;` : ""}
    `;

    // Add error handling
    this.imageElement.addEventListener("error", () => {
      this.renderErrorState();
    });

    // Add resize handle if not readonly
    if (!this.readOnly) {
      this.createResizeHandle(imageContainer);

      // Add edit button
      const editButton = document.createElement("button");
      editButton.innerHTML = "✏️";
      editButton.title = "Edit image URL";
      editButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s;
      `;

      editButton.addEventListener("click", () => {
        this.data.url = "";
        this.wrapper!.innerHTML = "";
        this.renderUrlInput();
      });

      imageContainer.addEventListener("mouseenter", () => {
        editButton.style.opacity = "1";
      });

      imageContainer.addEventListener("mouseleave", () => {
        editButton.style.opacity = "0";
      });

      imageContainer.appendChild(editButton);
    }

    imageContainer.appendChild(this.imageElement);

    // Add caption
    this.renderCaption(imageContainer);

    this.wrapper.appendChild(imageContainer);
  }

  private createResizeHandle(container: HTMLElement): void {
    // Create multiple resize handles for different directions
    const handles = [
      { position: "bottom-right", cursor: "nw-resize", mode: "both" as const },
      { position: "bottom", cursor: "ns-resize", mode: "height" as const },
      { position: "right", cursor: "ew-resize", mode: "width" as const },
    ];

    handles.forEach(({ position, cursor, mode }) => {
      const handle = document.createElement("div");
      let positionStyles = "";

      switch (position) {
        case "bottom-right":
          positionStyles =
            "bottom: -5px; right: -5px; width: 12px; height: 12px; border-radius: 50%;";
          break;
        case "bottom":
          positionStyles =
            "bottom: -5px; left: 50%; transform: translateX(-50%); width: 20px; height: 8px; border-radius: 4px;";
          break;
        case "right":
          positionStyles =
            "right: -5px; top: 50%; transform: translateY(-50%); width: 8px; height: 20px; border-radius: 4px;";
          break;
      }

      handle.style.cssText = `
        position: absolute;
        ${positionStyles}
        background: #3b82f6;
        border: 2px solid white;
        cursor: ${cursor};
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 10;
      `;

      handle.addEventListener("mousedown", (e) => {
        this.resizeMode = mode;
        this.handleResizeStart(e);
      });

      container.appendChild(handle);

      // Store the main resize handle (bottom-right) for legacy compatibility
      if (position === "bottom-right") {
        this.resizeHandle = handle;
      }
    });

    // Show/hide handles on hover
    container.addEventListener("mouseenter", () => {
      const handles = container.querySelectorAll('div[style*="cursor:"]');
      handles.forEach((handle) => {
        (handle as HTMLElement).style.opacity = "1";
      });
    });

    container.addEventListener("mouseleave", () => {
      if (!this.isResizing) {
        const handles = container.querySelectorAll('div[style*="cursor:"]');
        handles.forEach((handle) => {
          (handle as HTMLElement).style.opacity = "0";
        });
      }
    });

    // Add global event listeners
    document.addEventListener("mousemove", this.handleResize.bind(this));
    document.addEventListener("mouseup", this.handleResizeEnd.bind(this));
  }

  private handleResizeStart(e: MouseEvent): void {
    if (!this.imageElement) return;

    this.isResizing = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = this.imageElement.offsetWidth;
    this.startHeight = this.imageElement.offsetHeight;

    // Add a visual indicator that resizing is active
    this.imageElement.style.opacity = "0.8";
    document.body.style.cursor = (e.target as HTMLElement).style.cursor;
    document.body.style.userSelect = "none";

    e.preventDefault();
    e.stopPropagation();
  }

  private handleResize(e: MouseEvent): void {
    if (!this.isResizing || !this.imageElement) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    switch (this.resizeMode) {
      case "width": {
        newWidth = Math.max(100, Math.min(800, this.startWidth + deltaX));
        // Maintain aspect ratio
        const aspectRatio = this.startHeight / this.startWidth;
        newHeight = newWidth * aspectRatio;
        break;
      }

      case "height": {
        newHeight = Math.max(75, Math.min(600, this.startHeight + deltaY));
        // Maintain aspect ratio
        const widthRatio = this.startWidth / this.startHeight;
        newWidth = newHeight * widthRatio;
        break;
      }

      case "both": {
        newWidth = Math.max(100, Math.min(800, this.startWidth + deltaX));
        newHeight = Math.max(75, Math.min(600, this.startHeight + deltaY));
        break;
      }
    }

    this.imageElement.style.width = `${newWidth}px`;
    this.imageElement.style.height = `${newHeight}px`;
    this.data.width = newWidth;
    this.data.height = newHeight;
  }

  private handleResizeEnd(): void {
    if (!this.imageElement) return;

    this.isResizing = false;

    // Reset visual indicators
    this.imageElement.style.opacity = "1";
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    // Hide all resize handles
    if (this.wrapper) {
      const handles = this.wrapper.querySelectorAll('div[style*="cursor:"]');
      handles.forEach((handle) => {
        (handle as HTMLElement).style.opacity = "0";
      });
    }
  }

  private renderCaption(container: HTMLElement): void {
    this.captionElement = document.createElement("div");
    this.captionElement.contentEditable = this.readOnly ? "false" : "true";
    this.captionElement.textContent = this.data.caption || "";
    this.captionElement.style.cssText = `
      margin-top: 8px;
      padding: 8px;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      outline: none;
      border-radius: 4px;
      min-height: 20px;
    `;

    if (!this.readOnly) {
      this.captionElement.setAttribute(
        "data-placeholder",
        "Enter caption (optional)"
      );
      this.captionElement.style.cssText += `
        border: 1px solid transparent;
        transition: border-color 0.2s;
      `;

      this.captionElement.addEventListener("focus", () => {
        this.captionElement!.style.borderColor = "#3b82f6";
        this.captionElement!.style.background = "#f8f9fa";
      });

      this.captionElement.addEventListener("blur", () => {
        this.captionElement!.style.borderColor = "transparent";
        this.captionElement!.style.background = "transparent";
        this.data.caption = this.captionElement!.textContent || "";
      });

      this.captionElement.addEventListener("input", () => {
        this.data.caption = this.captionElement!.textContent || "";
      });
    }

    container.appendChild(this.captionElement);
  }

  private renderErrorState(): void {
    if (!this.wrapper) return;

    this.wrapper.innerHTML = "";

    const errorContainer = document.createElement("div");
    errorContainer.style.cssText = `
      border: 2px dashed #ef4444;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      background: #fef2f2;
      color: #dc2626;
    `;

    const errorIcon = document.createElement("div");
    errorIcon.innerHTML = "⚠️";
    errorIcon.style.cssText = "font-size: 24px; margin-bottom: 8px;";

    const errorText = document.createElement("p");
    errorText.textContent = "Failed to load image";
    errorText.style.cssText = "margin: 0 0 12px 0; font-weight: 500;";

    const retryButton = document.createElement("button");
    retryButton.textContent = "Try Different URL";
    retryButton.style.cssText = `
      padding: 8px 16px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    `;

    retryButton.addEventListener("click", () => {
      this.data.url = "";
      this.wrapper!.innerHTML = "";
      this.renderUrlInput();
    });

    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorText);
    if (!this.readOnly) {
      errorContainer.appendChild(retryButton);
    }

    this.wrapper.appendChild(errorContainer);
  }

  save(): ImageData {
    return this.data;
  }

  destroy(): void {
    // Clean up event listeners
    document.removeEventListener("mousemove", this.handleResize.bind(this));
    document.removeEventListener("mouseup", this.handleResizeEnd.bind(this));
  }

  static get sanitize() {
    return {
      url: true,
      caption: true,
      alt: true,
      width: true,
      height: true,
    };
  }
}

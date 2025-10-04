import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";
import { HexColorPicker } from "vanilla-colorful";

export default class BackgroundTool implements InlineTool {
  private button: HTMLButtonElement | null = null;
  private api: API;
  private currentColor: string = "#ffff00";

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Background Color";
  }

  get shortcut(): string {
    return "CMD+SHIFT+H";
  }

  constructor({ api }: InlineToolConstructorOptions) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML = this.getButtonHTML();
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.classList.add("ce-inline-tool");

    return this.button;
  }

  private getButtonHTML(): string {
    return `
<svg data-v-15b35c9e="" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-icon customizable lucide-paint-bucket-icon lucide-paint-bucket lucide-icon customizable"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"></path><path d="m5 2 5 5"></path><path d="M2 13h15"></path><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"></path></svg>
    `;
  }

  private updateButtonColor(): void {
    if (this.button) {
      this.button.innerHTML = this.getButtonHTML();
    }
  }

  surround(range: Range): void {
    if (!range) {
      return;
    }

    this.showColorPicker();
  }

  private showColorPicker(): void {
    // Create a temporary color picker for selection
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.zIndex = "10000";
    tempContainer.style.background = "white";
    tempContainer.style.border = "1px solid #ccc";
    tempContainer.style.borderRadius = "8px";
    tempContainer.style.padding = "16px";
    tempContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

    // Position below the inline toolbar
    const inlineToolbar = document.querySelector(".ce-inline-toolbar");
    if (inlineToolbar) {
      const toolbarRect = inlineToolbar.getBoundingClientRect();
      tempContainer.style.top = `${toolbarRect.bottom + window.scrollY + 40}px`;
      tempContainer.style.left = `${toolbarRect.left + window.scrollX}px`;
    } else {
      // Fallback to center if toolbar not found
      tempContainer.style.top = "50%";
      tempContainer.style.left = "50%";
      tempContainer.style.transform = "translate(-50%, -50%)";
      tempContainer.style.position = "fixed";
    }

    document.body.appendChild(tempContainer);

    // Create color picker
    const colorPicker = new HexColorPicker();
    colorPicker.color = this.currentColor;
    tempContainer.appendChild(colorPicker);

    const handleColorSelection = (color: string) => {
      this.currentColor = color;
      this.updateButtonColor();
      this.applySurroundWithColor(color);
    };

    colorPicker.addEventListener("color-changed", (event: CustomEvent) => {
      handleColorSelection(event.detail.value);
    });

    // Close modal function
    const closeModal = () => {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeyDown);
    };

    // Close modal when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (!tempContainer.contains(event.target as Node)) {
        closeModal();
      }
    };

    // Close modal when pressing Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    // Add event listeners after a short delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
      document.addEventListener("keydown", handleKeyDown);
    }, 100);
  }

  private applySurroundWithColor(color: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // Check if the selection already has a background span
    const parentSpan = this.api.selection.findParentTag(
      "SPAN",
      "background-color"
    );

    if (parentSpan) {
      if (color) {
        // Update existing background color
        (parentSpan as HTMLSpanElement).style.backgroundColor = color;
      } else {
        // Remove background color
        this.unwrap(parentSpan);
      }
    } else if (color) {
      // Apply new background color
      const selectedText = range.extractContents();
      const bgSpan = document.createElement("span");
      bgSpan.style.backgroundColor = color;
      bgSpan.className = "background-color";
      bgSpan.appendChild(selectedText);
      range.insertNode(bgSpan);

      // Expand selection to include the span
      this.api.selection.expandToTag(bgSpan);
    }
  }

  private unwrap(tag: HTMLElement): void {
    const parent = tag.parentNode;
    if (!parent) return;

    while (tag.firstChild) {
      parent.insertBefore(tag.firstChild, tag);
    }
    parent.removeChild(tag);
  }

  checkState(): boolean {
    const selection = this.api.selection.findParentTag(
      "SPAN",
      "background-color"
    );

    if (selection) {
      const colorValue = (selection as HTMLSpanElement).style.backgroundColor;
      this.currentColor = this.rgbToHex(colorValue) || colorValue;
      this.updateButtonColor();
    }

    if (this.button) {
      this.button.classList.toggle(
        this.api.styles.inlineToolButtonActive,
        !!selection
      );
    }

    return !!selection;
  }

  private rgbToHex(rgb: string): string | null {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;

    const [, r, g, b] = match;
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = parseInt(x, 10).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  static get sanitize() {
    return {
      span: {
        class: "background-color",
        style: true,
      },
    };
  }
}

import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";
import { HexColorPicker } from "vanilla-colorful";

export default class TextColorTool implements InlineTool {
  private button: HTMLButtonElement | null = null;
  private api: API;
  private currentColor: string = "#000000";

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Text Color";
  }

  get shortcut(): string {
    return "CMD+SHIFT+C";
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
      <svg data-v-15b35c9e="" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-icon customizable lucide-baseline-icon lucide-baseline lucide-icon customizable"><path d="M4 20h16"></path><path d="m6 16 6-12 6 12"></path><path d="M8 12h8"></path></svg>
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

    // Show color picker by clicking the trigger
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
      tempContainer.style.top = `${toolbarRect.bottom + window.scrollY + 8}px`;
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

    // Check if the selection already has a color span
    const parentSpan = this.api.selection.findParentTag("SPAN", "color-text");

    if (parentSpan) {
      if (color) {
        // Update existing color
        (parentSpan as HTMLSpanElement).style.color = color;
      } else {
        // Remove color
        this.unwrap(parentSpan);
      }
    } else if (color) {
      // Apply new color
      const selectedText = range.extractContents();
      const colorSpan = document.createElement("span");
      colorSpan.style.color = color;
      colorSpan.className = "color-text";
      colorSpan.appendChild(selectedText);
      range.insertNode(colorSpan);

      // Expand selection to include the span
      this.api.selection.expandToTag(colorSpan);
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
    const selection = this.api.selection.findParentTag("SPAN", "color-text");

    if (selection) {
      const colorValue = (selection as HTMLSpanElement).style.color;
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
        class: "color-text",
        style: true,
      },
    };
  }
}

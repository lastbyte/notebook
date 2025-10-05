import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";

export default class TextAlignTool implements InlineTool {
  private api: API;
  private wrapper: HTMLElement | null = null;
  private currentAlignment: "left" | "center" | "right" = "left";

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Text Align";
  }

  get shortcut(): string {
    return "CMD+SHIFT+A";
  }

  constructor({ api }: InlineToolConstructorOptions) {
    this.api = api;
  }

  render(): HTMLElement {
    // Create wrapper for all alignment buttons
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("text-align-tool-wrapper");
    this.wrapper.style.display = "inline-flex";
    this.wrapper.style.gap = "2px";

    const alignments: Array<{
      value: "left" | "center" | "right";
      label: string;
      icon: string;
    }> = [
      {
        value: "left",
        label: "Left",
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      },
      {
        value: "center",
        label: "Center",
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      },
      {
        value: "right",
        label: "Right",
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      },
    ];

    alignments.forEach((alignment) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = alignment.icon;
      button.classList.add(this.api.styles.inlineToolButton);
      button.classList.add("ce-inline-tool");
      button.title = `Align ${alignment.label}`;

      // Mark active button
      if (alignment.value === this.currentAlignment) {
        button.classList.add(this.api.styles.inlineToolButtonActive);
      }

      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.applyAlignment(alignment.value);
      });

      this.wrapper?.appendChild(button);
    });

    return this.wrapper;
  }

  private updateActiveButton(
    activeAlignment: "left" | "center" | "right"
  ): void {
    if (!this.wrapper) return;

    // Remove active class from all buttons
    const buttons = this.wrapper.querySelectorAll("button");
    buttons.forEach((button) => {
      button.classList.remove(this.api.styles.inlineToolButtonActive);
    });

    // Add active class to the selected button
    const buttonIndex =
      activeAlignment === "left" ? 0 : activeAlignment === "center" ? 1 : 2;
    const activeButton = buttons[buttonIndex];
    if (activeButton) {
      activeButton.classList.add(this.api.styles.inlineToolButtonActive);
    }
  }

  private applyAlignment(alignment: "left" | "center" | "right"): void {
    this.currentAlignment = alignment;

    // Update active button state
    this.updateActiveButton(alignment);

    // Apply alignment to current block
    const currentBlock = this.api.blocks.getCurrentBlockIndex();
    const blockElement = this.api.blocks.getBlockByIndex(currentBlock)?.holder;

    if (blockElement) {
      // Find the content element within the block
      const contentElement =
        blockElement.querySelector('[contenteditable="true"]') ||
        blockElement.querySelector(".ce-paragraph") ||
        blockElement.querySelector(".cdx-block");

      if (contentElement) {
        // Remove existing alignment classes
        contentElement.classList.remove(
          "text-left",
          "text-center",
          "text-right"
        );

        // Apply new alignment
        contentElement.classList.add(`text-${alignment}`);
        (contentElement as HTMLElement).style.textAlign = alignment;
      }
    }
  }

  surround(): void {
    // This method is required by InlineTool interface but not used for this tool
    // since we're applying styles to the entire block rather than selected text
  }

  checkState(): boolean {
    // This could be enhanced to detect current alignment state
    return false;
  }

  static get sanitize() {
    return {};
  }
}

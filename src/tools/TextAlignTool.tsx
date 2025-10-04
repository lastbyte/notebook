import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";

export default class TextAlignTool implements InlineTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private dropdown: HTMLElement | null = null;
  private isDropdownOpen = false;
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
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML = this.getAlignmentIcon(this.currentAlignment);
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.classList.add("ce-inline-tool");
    this.button.title = "Text Alignment";

    // Create dropdown
    this.createDropdown();

    // Add click event to toggle dropdown
    this.button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        this.dropdown &&
        !this.dropdown.contains(e.target as Node) &&
        e.target !== this.button
      ) {
        this.closeDropdown();
      }
    });

    return this.button;
  }

  private createDropdown(): void {
    this.dropdown = document.createElement("div");
    this.dropdown.classList.add("text-align-dropdown");
    this.dropdown.style.display = "none";

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
      const option = document.createElement("button");
      option.type = "button";
      option.classList.add("text-align-option");
      option.innerHTML = `${alignment.icon} ${alignment.label}`;
      option.title = `Align ${alignment.label}`;

      option.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.applyAlignment(alignment.value);
        this.closeDropdown();
      });

      this.dropdown?.appendChild(option);
    });

    // Position dropdown
    document.body.appendChild(this.dropdown);
  }

  private toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    if (!this.dropdown || !this.button) return;

    const rect = this.button.getBoundingClientRect();
    this.dropdown.style.position = "absolute";
    this.dropdown.style.top = `${rect.bottom + 5}px`;
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.display = "block";
    this.dropdown.style.zIndex = "1000";

    this.isDropdownOpen = true;
    this.button.classList.add(this.api.styles.inlineToolButtonActive);
  }

  private closeDropdown(): void {
    if (!this.dropdown || !this.button) return;

    this.dropdown.style.display = "none";
    this.isDropdownOpen = false;
    this.button.classList.remove(this.api.styles.inlineToolButtonActive);
  }

  private applyAlignment(alignment: "left" | "center" | "right"): void {
    this.currentAlignment = alignment;

    // Update button icon
    if (this.button) {
      this.button.innerHTML = this.getAlignmentIcon(alignment);
    }

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

  private getAlignmentIcon(alignment: "left" | "center" | "right"): string {
    switch (alignment) {
      case "left":
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      case "center":
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      case "right":
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      default:
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
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

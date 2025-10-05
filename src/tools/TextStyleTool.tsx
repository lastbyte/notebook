import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";

export default class TextStyleTool implements InlineTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private dropdown: HTMLElement | null = null;
  private isDropdownOpen = false;
  private currentStyle:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body1"
    | "body2"
    | "caption1"
    | "caption2" = "body1";

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Text Style";
  }

  get shortcut(): string {
    return "CMD+SHIFT+T";
  }

  constructor({ api }: InlineToolConstructorOptions) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML = this.getStyleIcon(this.currentStyle);
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.classList.add("ce-inline-tool");
    this.button.classList.add("text-style-tool");
    this.button.title = "Text Style";

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
    this.dropdown.classList.add("text-style-dropdown");
    this.dropdown.style.display = "none";

    const textStyles: Array<{
      value:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "body1"
        | "body2"
        | "caption1"
        | "caption2";
      label: string;
      icon: string;
      category: string;
    }> = [
      { value: "h1", label: "Heading 1", icon: "H1", category: "Headings" },
      { value: "h2", label: "Heading 2", icon: "H2", category: "Headings" },
      { value: "h3", label: "Heading 3", icon: "H3", category: "Headings" },
      { value: "h4", label: "Heading 4", icon: "H4", category: "Headings" },
      { value: "h5", label: "Heading 5", icon: "H5", category: "Headings" },
      { value: "h6", label: "Heading 6", icon: "H6", category: "Headings" },
      { value: "body1", label: "Body Large", icon: "B1", category: "Body" },
      { value: "body2", label: "Body Medium", icon: "B2", category: "Body" },
      {
        value: "caption1",
        label: "Caption Large",
        icon: "C1",
        category: "Caption",
      },
      {
        value: "caption2",
        label: "Caption Small",
        icon: "C2",
        category: "Caption",
      },
    ];

    // Group styles by category
    const categories = [...new Set(textStyles.map((style) => style.category))];

    categories.forEach((category, index) => {
      if (index > 0) {
        const separator = document.createElement("div");
        separator.classList.add("text-style-separator");
        this.dropdown?.appendChild(separator);
      }

      const categoryLabel = document.createElement("div");
      categoryLabel.classList.add("text-style-category");
      categoryLabel.textContent = category;
      this.dropdown?.appendChild(categoryLabel);

      const categoryStyles = textStyles.filter(
        (style) => style.category === category
      );

      categoryStyles.forEach((style) => {
        const option = document.createElement("button");
        option.type = "button";
        option.classList.add("text-style-option");
        option.innerHTML = `<span class="text-style-icon">${style.icon}</span> ${style.label}`;
        option.title = style.label;

        option.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyTextStyle(style.value);
          this.closeDropdown();
        });

        this.dropdown?.appendChild(option);
      });
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

  private applyTextStyle(
    style:
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6"
      | "body1"
      | "body2"
      | "caption1"
      | "caption2"
  ): void {
    this.currentStyle = style;

    // Update button icon
    if (this.button) {
      this.button.innerHTML = this.getStyleIcon(style);
    }

    // Apply style to current block
    const currentBlock = this.api.blocks.getCurrentBlockIndex();
    const blockElement = this.api.blocks.getBlockByIndex(currentBlock)?.holder;

    if (blockElement) {
      // Find the content element within the block - try multiple selectors
      const contentElement =
        blockElement.querySelector('[contenteditable="true"]') ||
        blockElement.querySelector(".ce-paragraph") ||
        blockElement.querySelector(".cdx-block") ||
        blockElement.querySelector("div[data-placeholder]") ||
        blockElement.querySelector("p") ||
        blockElement.querySelector("div");

      if (contentElement) {
        // Remove existing text style classes
        const stylesToRemove = [
          "text-h1",
          "text-h2",
          "text-h3",
          "text-h4",
          "text-h5",
          "text-h6",
          "text-body1",
          "text-body2",
          "text-caption1",
          "text-caption2",
        ];

        contentElement.classList.remove(...stylesToRemove);

        // Apply new text style
        contentElement.classList.add(`text-${style}`);

        // Also set data attribute for easier debugging and persistence
        contentElement.setAttribute("data-text-style", style);

        // Store the style in localStorage separately for persistence
        const blockId =
          blockElement.getAttribute("data-id") ||
          blockElement.id ||
          currentBlock.toString();
        const textStylesKey = "editorjs-text-styles";
        let textStyles: Record<string, string> = {};

        try {
          const savedStyles = localStorage.getItem(textStylesKey);
          if (savedStyles) {
            textStyles = JSON.parse(savedStyles);
          }
        } catch (error) {
          console.warn("Could not load existing text styles:", error);
        }

        textStyles[blockId] = style;

        try {
          localStorage.setItem(textStylesKey, JSON.stringify(textStyles));
        } catch (error) {
          console.warn("Could not save text style:", error);
        }

        console.log(`Applied text style: ${style} to element:`, contentElement);
      } else {
        console.warn("Could not find content element to apply text style");
      }
    } else {
      console.warn("Could not find block element");
    }
  }

  private getStyleIcon(
    style:
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6"
      | "body1"
      | "body2"
      | "caption1"
      | "caption2"
  ): string {
    const labelMap = {
      h1: "Heading 1",
      h2: "Heading 2",
      h3: "Heading 3",
      h4: "Heading 4",
      h5: "Heading 5",
      h6: "Heading 6",
      body1: "Body Large",
      body2: "Body Medium",
      caption1: "Caption Large",
      caption2: "Caption Small",
    };

    const labelText = labelMap[style];
    return `
      <span class="text-style-content">
        <span class="text-style-label">${labelText}</span>
        <svg data-v-6433c584="" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"></path></svg>
      </span>
    `;
  }

  surround(): void {
    // This method is required by InlineTool interface but not used for this tool
    // since we're applying styles to the entire block rather than selected text
  }

  checkState(): boolean {
    // This could be enhanced to detect current text style state
    return false;
  }

  static get sanitize() {
    return {};
  }
}

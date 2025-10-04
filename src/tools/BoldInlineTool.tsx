import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";

export default class BoldInlineTool implements InlineTool {
  private button: HTMLButtonElement | null = null;
  private api: API;

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Bold";
  }

  get shortcut(): string {
    return "CMD+B";
  }

  constructor({ api }: InlineToolConstructorOptions) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML =
      '<svg data-v-6433c584="" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bold-icon lucide-bold"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"></path></svg>';
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.classList.add("ce-inline-tool");

    return this.button;
  }

  surround(range: Range): void {
    if (!range) {
      return;
    }

    // Check if the selection is already bold
    const parentTag =
      this.api.selection.findParentTag("STRONG") ||
      this.api.selection.findParentTag("B");

    if (parentTag) {
      // If already bold, remove the bold formatting
      this.unwrap(parentTag);
    } else {
      // If not bold, add bold formatting
      const selectedText = range.extractContents();
      const bold = document.createElement("strong");

      bold.appendChild(selectedText);
      range.insertNode(bold);

      // Expand selection to include the bold tag
      this.api.selection.expandToTag(bold);
    }
  }

  private unwrap(tag: HTMLElement): void {
    // Move all child nodes out of the tag and remove the tag
    const parent = tag.parentNode;
    if (!parent) return;

    // Move all children before the tag
    while (tag.firstChild) {
      parent.insertBefore(tag.firstChild, tag);
    }

    // Remove the empty tag
    parent.removeChild(tag);
  }

  checkState(): boolean {
    const selection =
      this.api.selection.findParentTag("STRONG") ||
      this.api.selection.findParentTag("B");

    if (this.button) {
      this.button.classList.toggle(
        this.api.styles.inlineToolButtonActive,
        !!selection
      );
    }

    return !!selection;
  }

  static get sanitize() {
    return {
      strong: {},
      b: {},
    };
  }
}

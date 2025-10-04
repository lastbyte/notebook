import type {
  InlineTool,
  InlineToolConstructorOptions,
  API,
} from "@editorjs/editorjs";

export default class ItalicInlineTool implements InlineTool {
  private button: HTMLButtonElement | null = null;
  private api: API;

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Italic";
  }

  get shortcut(): string {
    return "CMD+I";
  }

  constructor({ api }: InlineToolConstructorOptions) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML =
      '<svg data-v-6433c584="" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-italic-icon lucide-italic"><line x1="19" x2="10" y1="4" y2="4"></line><line x1="14" x2="5" y1="20" y2="20"></line><line x1="15" x2="9" y1="4" y2="20"></line></svg>';
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.classList.add("ce-inline-tool");

    return this.button;
  }

  surround(range: Range): void {
    if (!range) {
      return;
    }

    // Check if the selection is already italic
    const parentTag =
      this.api.selection.findParentTag("EM") ||
      this.api.selection.findParentTag("I");

    if (parentTag) {
      // If already italic, remove the italic formatting
      this.unwrap(parentTag);
    } else {
      // If not italic, add italic formatting
      const selectedText = range.extractContents();
      const italic = document.createElement("em");

      italic.appendChild(selectedText);
      range.insertNode(italic);

      // Expand selection to include the italic tag
      this.api.selection.expandToTag(italic);
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
      this.api.selection.findParentTag("EM") ||
      this.api.selection.findParentTag("I");

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
      em: {},
      i: {},
    };
  }
}

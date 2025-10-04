// Type declarations for EditorJS plugins without TypeScript support

declare module "editorjs-anchor" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class Anchor implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(): any;
  }
}

declare module "editorjs-undo" {
  import EditorJS from "@editorjs/editorjs";
  export default class Undo {
    constructor(config: { editor: EditorJS });
  }
}

declare module "editorjs-multiblock-selection-plugin" {
  import EditorJS from "@editorjs/editorjs";
  export default class MultiBlockSelectionPlugin {
    constructor(config: { editor: EditorJS; version: string });
  }
}

declare module "@coolbytes/editorjs-delimiter" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class Delimiter implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(): any;
  }
}

declare module "@calumk/editorjs-nested-checklist" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class NestedChecklist implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(): any;
  }
}

declare module "@editorjs/link" {
  import { BlockTool } from "@editorjs/editorjs";
  export default class Link implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(): any;
  }
}

// Type declarations for EditorJS plugins without official types

declare module "@editorjs/marker" {
  import type { InlineTool } from "@editorjs/editorjs";
  const Marker: typeof InlineTool;
  export default Marker;
}

declare module "@editorjs/inline-code" {
  import type { InlineTool } from "@editorjs/editorjs";
  const InlineCode: typeof InlineTool;
  export default InlineCode;
}

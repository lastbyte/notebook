import EditorJS from "@editorjs/editorjs";
import { useEffect, useRef } from "react";

import MultiBlockSelectionPlugin from "editorjs-multiblock-selection-plugin";
import Undo from "editorjs-undo";

import BackgroundTool from "../tools/BackgroundTool";
import BoldInlineTool from "../tools/BoldInlineTool";
import ItalicInlineTool from "../tools/ItalicInlineTool";
import TextAlignTool from "../tools/TextAlignTool";
import TextColorTool from "../tools/TextColorTool";
import ImageTool from "../tools/ImageTool";

import { Separator } from "@/components/ui/separator";
import "../styles/editor.css";
import TextStyleTool from "../tools/TextStyleTool";
import ExcalidrawTool from "@/tools/ExcalidrawTool";

export default function EditorPage() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    let isMounted = true;
    const holderElement = editorRef.current;

    const initializeEditor = async () => {
      if (holderElement && !editorInstanceRef.current && isMounted) {
        // Clear any existing content in the holder
        holderElement.innerHTML = "";

        try {
          editorInstanceRef.current = new EditorJS({
            autofocus: true,
            inlineToolbar: true,
            minHeight: 500,
            holder: holderElement,
            placeholder: "Type here to write your story...",
            onReady: () => {
              if (isMounted && editorInstanceRef.current) {
                console.log("Editor.js is ready to work!");
                // Initialize plugins after editor is ready
                new Undo({ editor: editorInstanceRef.current });
                new MultiBlockSelectionPlugin({
                  editor: editorInstanceRef.current,
                  version: "2.28.0",
                });
              }
            },

            // Other configuration options...
            tools: {
              excalidraw: ExcalidrawTool,
              image: ImageTool,
              // Inline tools
              bold: BoldInlineTool,
              italic: ItalicInlineTool,
              textStyle: TextStyleTool,
              textAlign: TextAlignTool,
              textColor: TextColorTool,
              backgroundColor: BackgroundTool,
            },
          });
        } catch (error) {
          console.error("Failed to initialize EditorJS:", error);
        }
      }
    };

    initializeEditor();

    // Cleanup function
    return () => {
      isMounted = false;

      if (editorInstanceRef.current) {
        // Clean up the mutation observer
        const editorWithObserver = editorInstanceRef.current as EditorJS & {
          widthObserver?: MutationObserver;
        };
        if (editorWithObserver.widthObserver) {
          editorWithObserver.widthObserver.disconnect();
        }

        try {
          if (editorInstanceRef.current.destroy) {
            editorInstanceRef.current.destroy();
          }
        } catch (error) {
          console.error("Error destroying editor:", error);
        }

        editorInstanceRef.current = null;
      }

      // Clear the holder element
      if (holderElement) {
        holderElement.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="h-full w-full p-2 flex flex-col gap-2">
      <div className="w-full flex flex-row justify-between items-center">
        <p className="text-lg font-semibold"> Notebook</p>
        <p className="font-mono">2023-03-15</p>
      </div>
      <Separator />
      <div className="flex-1">
        <div ref={editorRef} className="w-full h-full"></div>
      </div>
    </div>
  );
}

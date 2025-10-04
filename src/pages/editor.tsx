import EditorJS from "@editorjs/editorjs";
import { useEffect, useRef, useState } from "react";

import MultiBlockSelectionPlugin from "editorjs-multiblock-selection-plugin";
import Undo from "editorjs-undo";

import BackgroundTool from "../tools/BackgroundTool";
import BoldInlineTool from "../tools/BoldInlineTool";
import ItalicInlineTool from "../tools/ItalicInlineTool";
import TextAlignTool from "../tools/TextAlignTool";
import TextColorTool from "../tools/TextColorTool";
import ImageTool from "../tools/ImageTool";
import Table from "@editorjs/table";
import Title from "title-editorjs";

import EditorjsList from "@editorjs/list";

import { Separator } from "@/components/ui/separator";
import "../styles/editor.css";
import TextStyleTool from "../tools/TextStyleTool";
import ExcalidrawTool from "@/tools/ExcalidrawTool";

export default function EditorPage() {
  const editorRef = useRef<EditorJS | null>(null);
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    return now.toLocaleString(); // Format the date and time as per locale
  });

  useEffect(() => {
    // Initialize editor only once
    if (!editorRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        const holderElement = document.getElementById("editorjs");
        if (!holderElement) {
          console.error('Element with ID "editorjs" not found');
          return;
        }

        editorRef.current = new EditorJS({
          autofocus: true,
          inlineToolbar: true,
          minHeight: 500,
          holder: "editorjs",
          placeholder: "Type here to write your story...",
          onReady: () => {
            if (editorRef.current) {
              console.log("Editor.js is ready to work!");
              // Initialize plugins after editor is ready
              new Undo({ editor: editorRef.current });
              new MultiBlockSelectionPlugin({
                editor: editorRef.current,
                version: "2.28.0",
              });
            }
          },

          // Other configuration options...
          tools: {
            excalidraw: ExcalidrawTool,
            image: ImageTool,
            title: {
              class: Title,
              inlineToolbar: true,
            },
            List: {
              class: EditorjsList,
              inlineToolbar: true,
              config: {
                defaultStyle: "unordered",
              },
            },
            Table: Table,
            // Inline tools
            bold: BoldInlineTool,
            italic: ItalicInlineTool,
            textStyle: TextStyleTool,
            textAlign: TextAlignTool,
            textColor: TextColorTool,
            backgroundColor: BackgroundTool,
          },
        });
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }

    // Cleanup function to destroy editor on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update timestamp every minute
    const interval = setInterval(() => {
      const now = new Date();
      setTimestamp(now.toLocaleString());
    }, 1000); // 1000 ms = 1 second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full p-2 flex flex-col gap-2">
      <div className="w-full flex flex-row justify-between items-center">
        <p className="text-lg font-semibold"> Notebook</p>
        <p className="font-mono">{timestamp}</p>
      </div>
      <Separator />
      <div className="flex-1">
        <div id="editorjs" className="w-full h-full"></div>
      </div>
    </div>
  );
}

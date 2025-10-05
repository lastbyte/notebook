/* eslint-disable @typescript-eslint/no-explicit-any */
import EditorJS from "@editorjs/editorjs";
import { useCallback, useEffect, useRef, useState } from "react";

import MultiBlockSelectionPlugin from "editorjs-multiblock-selection-plugin";
import Undo from "editorjs-undo";

import Table from "@editorjs/table";
import Title from "title-editorjs";
import ImageTool from "../tools/ImageTool";

import EditorjsList from "@editorjs/list";

import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Separator } from "@/components/ui/separator";
import BackgroundTool from "@/tools/BackgroundTool";
import ExcalidrawTool from "@/tools/ExcalidrawTool";
import TextAlignTool from "@/tools/TextAlignTool";
import TextColorTool from "@/tools/TextColorTool";
import { RotateCcw, SaveIcon, UploadIcon } from "lucide-react";
import "../styles/editor.css";
import TextStyleTool from "../tools/TextStyleTool";

export default function EditorPage() {
  const editorRef = useRef<EditorJS | null>(null);
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    return now.toLocaleString(); // Format the date and time as per locale
  });
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference, default to system preference
    const saved = localStorage.getItem("dark-mode");
    if (saved !== null) {
      return saved === "true";
    }
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const saveTimeoutRef = useRef<number | null>(null);

  // LocalStorage keys
  const EDITOR_DATA_KEY = "editorjs-notebook-data";
  const LAST_SAVED_KEY = "editorjs-last-saved";

  // Helper function to serialize data with Map handling
  const serializeEditorData = (data: any) => {
    return JSON.stringify(data, (_, value) => {
      if (value instanceof Map) {
        return { __type: "Map", value: Array.from(value.entries()) };
      }
      return value;
    });
  };

  // Helper function to deserialize data with Map handling
  const deserializeEditorData = (data: string) => {
    return JSON.parse(data, (_, value) => {
      if (value && value.__type === "Map") {
        return new Map(value.value);
      }
      return value;
    });
  };

  // Save editor data to localStorage
  const saveToLocalStorage = useCallback(async () => {
    if (editorRef.current) {
      try {
        const outputData = await editorRef.current.save();
        const now = new Date().toISOString();
        localStorage.setItem(EDITOR_DATA_KEY, serializeEditorData(outputData));
        localStorage.setItem(LAST_SAVED_KEY, now);
        console.log("Editor data saved to localStorage");
      } catch (error) {
        console.error("Failed to save editor data:", error);
      }
    }
  }, [EDITOR_DATA_KEY, LAST_SAVED_KEY]);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveToLocalStorage();
    }, 2000); // Save after 2 seconds of inactivity
  }, [saveToLocalStorage]);

  // Load editor data from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(EDITOR_DATA_KEY);
      if (savedData) {
        return deserializeEditorData(savedData);
      }
    } catch (error) {
      console.error("Failed to load editor data from localStorage:", error);
    }
    return null;
  }, [EDITOR_DATA_KEY]);

  // Clear saved data
  const clearLocalStorage = useCallback(async () => {
    if (editorRef.current) {
      try {
        // Clear the editor content
        await editorRef.current.clear();
        // Remove from localStorage
        localStorage.removeItem(EDITOR_DATA_KEY);
        localStorage.removeItem(LAST_SAVED_KEY);
        console.log("Editor data cleared from localStorage");
      } catch (error) {
        console.error("Failed to clear editor data:", error);
      }
    }
  }, [EDITOR_DATA_KEY, LAST_SAVED_KEY]);

  // Toggle read-only mode
  const toggleReadOnlyMode = useCallback(() => {
    const newReadOnlyState = !isReadOnly;

    if (editorRef.current) {
      const editorElement = document.getElementById("editorjs");
      if (editorElement) {
        // Toggle pointer events and contenteditable attributes
        if (newReadOnlyState) {
          editorElement.style.pointerEvents = "none";
          editorElement.style.opacity = "0.7";
          // Disable all contenteditable elements
          const editableElements =
            editorElement.querySelectorAll("[contenteditable]");
          editableElements.forEach((el) => {
            el.setAttribute("contenteditable", "false");
          });
        } else {
          editorElement.style.pointerEvents = "auto";
          editorElement.style.opacity = "1";
          // Re-enable all contenteditable elements
          const editableElements =
            editorElement.querySelectorAll("[contenteditable]");
          editableElements.forEach((el) => {
            el.setAttribute("contenteditable", "true");
          });
        }
      }
    }

    setIsReadOnly(newReadOnlyState);
    console.log(
      `Editor switched to ${newReadOnlyState ? "read-only" : "edit"} mode`
    );
  }, [isReadOnly]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Save preference to localStorage
    localStorage.setItem("dark-mode", newDarkMode.toString());

    // Apply/remove dark class to document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    console.log(`Switched to ${newDarkMode ? "dark" : "light"} mode`);
  }, [isDarkMode]);

  // Export data as JSON file
  const exportData = useCallback(async () => {
    if (editorRef.current) {
      try {
        const outputData = await editorRef.current.save();
        const dataStr = serializeEditorData(outputData);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `notebook-${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to export data:", error);
      }
    }
  }, []);

  // Open file from disk
  const openFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const data = deserializeEditorData(text);

          // Validate that it's valid EditorJS data
          if (data && typeof data === "object" && "blocks" in data) {
            if (editorRef.current) {
              await editorRef.current.render(data);
              console.log("File loaded successfully");
            }
          } else {
            alert(
              "Invalid file format. Please select a valid notebook JSON file."
            );
          }
        } catch (error) {
          console.error("Failed to load file:", error);
          alert("Failed to load file. Please check the file format.");
        }
      }
    };
    input.click();
  }, []);

  // Save file to disk (same as export but with save naming)
  const saveFile = useCallback(async () => {
    if (editorRef.current) {
      try {
        const outputData = await editorRef.current.save();
        const dataStr = serializeEditorData(outputData);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `notebook-${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log("File saved successfully");
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    }
  }, []);

  // Print document
  const printDocument = useCallback(() => {
    // Add a small delay to allow the menu popup to close first
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  // Edit menu functions
  const undoAction = useCallback(() => {
    // The undo functionality is handled by the editorjs-undo plugin
    // Create and dispatch a keyboard event for undo
    const editorElement = document.getElementById("editorjs");
    if (editorElement) {
      editorElement.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: !navigator.userAgent.includes("Mac"),
          metaKey: navigator.userAgent.includes("Mac"),
          bubbles: true,
        })
      );
    }
  }, []);

  const redoAction = useCallback(() => {
    // The redo functionality is handled by the editorjs-undo plugin
    const editorElement = document.getElementById("editorjs");
    if (editorElement) {
      editorElement.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: !navigator.userAgent.includes("Mac"),
          metaKey: navigator.userAgent.includes("Mac"),
          shiftKey: true,
          bubbles: true,
        })
      );
    }
  }, []);

  const cutAction = useCallback(async () => {
    try {
      // Get selected text
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        await navigator.clipboard.writeText(selection.toString());
        // Delete the selected content by replacing with empty string
        selection.deleteFromDocument();
      }
    } catch (error) {
      console.error("Cut operation failed:", error);
      // Fallback to document.execCommand if clipboard API fails
      document.execCommand("cut");
    }
  }, []);

  const copyAction = useCallback(async () => {
    try {
      // Get selected text
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        await navigator.clipboard.writeText(selection.toString());
      }
    } catch (error) {
      console.error("Copy operation failed:", error);
      // Fallback to document.execCommand if clipboard API fails
      document.execCommand("copy");
    }
  }, []);

  const pasteAction = useCallback(async () => {
    try {
      // Read from clipboard
      const text = await navigator.clipboard.readText();
      if (text) {
        // Insert text at current cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (error) {
      console.error("Paste operation failed:", error);
      // Fallback to document.execCommand if clipboard API fails
      document.execCommand("paste");
    }
  }, []);

  // Apply initial dark mode state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case "o":
            event.preventDefault();
            openFile();
            break;
          case "s":
            event.preventDefault();
            saveFile();
            break;
          case "p":
            event.preventDefault();
            printDocument();
            break;
          case "z":
            if (event.shiftKey) {
              // Redo (Cmd/Ctrl + Shift + Z)
              event.preventDefault();
              redoAction();
            } else {
              // Undo (Cmd/Ctrl + Z)
              event.preventDefault();
              undoAction();
            }
            break;
          case "x":
            // Cut (Cmd/Ctrl + X) - let it work naturally but we could intercept if needed
            break;
          case "c":
            // Copy (Cmd/Ctrl + C) - let it work naturally but we could intercept if needed
            break;
          case "v":
            // Paste (Cmd/Ctrl + V) - let it work naturally but we could intercept if needed
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openFile, saveFile, printDocument, undoAction, redoAction]);

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

        // Load saved data if available
        const savedData = loadFromLocalStorage();

        editorRef.current = new EditorJS({
          autofocus: true,
          inlineToolbar: true,
          minHeight: 500,
          holder: "editorjs",
          placeholder: "Type here to write your story...",
          data: savedData || undefined, // Load saved data or start empty
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
          onChange: () => {
            // Auto-save after each change with debouncing (only when not in read-only mode)
            if (!isReadOnly) {
              debouncedAutoSave();
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
            list: {
              class: EditorjsList,
              inlineToolbar: true,
              config: {
                defaultStyle: "unordered",
              },
            },
            Table: Table,
            TextAlignTool: TextAlignTool,
            TextColorTool: TextColorTool,
            BackgroundTool: BackgroundTool,
            textStyle: {
              class: TextStyleTool,
              config: {
                fontSizeEnabled: true,
                fontFamilyEnabled: true,
                fontSizes: [
                  { label: "12px", value: "12px" },
                  { label: "14px", value: "14px" },
                  { label: "16px", value: "16px" },
                  { label: "18px", value: "18px" },
                  { label: "20px", value: "20px" },
                ],
                fontFamilies: [
                  { label: "Arial", value: "Arial" },
                  { label: "Georgia", value: "Georgia" },
                  { label: "Courier New", value: "Courier New" },
                  { label: "Verdana", value: "Verdana" },
                ],
                defaultFontSize: "20px",
                defaultFontFamily: "Verdana",
              },
            },
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedAutoSave, loadFromLocalStorage, isReadOnly]);

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
      <div className="w-full flex flex-row justify-between items-center print-hide">
        <Menubar className="border-none shadow-none">
          <MenubarMenu>
            <MenubarTrigger>Notebook</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>About</MenubarItem>
              <MenubarItem>star on GitHub</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={openFile}>
                Open <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={saveFile}>
                Save <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={printDocument}>
                Print... <MenubarShortcut>⌘P</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={undoAction}>
                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={redoAction}>
                Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={cutAction}>Cut</MenubarItem>
              <MenubarItem onClick={copyAction}>Copy</MenubarItem>
              <MenubarItem onClick={pasteAction}>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={isReadOnly}
                onCheckedChange={toggleReadOnlyMode}
              >
                Read only Mode
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
              >
                Dark Mode
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={"ghost"}
              onClick={saveToLocalStorage}
              className="cursor-pointer"
              size={"sm"}
              disabled={isReadOnly}
            >
              <SaveIcon />
            </Button>
            <Button
              variant={"ghost"}
              onClick={exportData}
              className="cursor-pointer"
              size={"sm"}
            >
              <UploadIcon />
            </Button>
            <Button
              variant={"ghost"}
              onClick={clearLocalStorage}
              className="cursor-pointer"
              size={"sm"}
              disabled={isReadOnly}
            >
              <RotateCcw />
            </Button>
          </div>
          <div className="flex flex-col items-end">
            <p className="font-mono text-sm">{timestamp}</p>
            {isReadOnly && (
              <p className="text-xs text-muted-foreground">Read-only mode</p>
            )}
          </div>
        </div>
      </div>
      <Separator className="print-hide" />
      <div className="flex-1">
        <div id="editorjs" className="w-full h-full"></div>
      </div>
    </div>
  );
}

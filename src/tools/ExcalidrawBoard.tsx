import React, { useCallback } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawBoardProps {
  initialData: {
    elements: any[];
    appState: any;
    files: any;
  };
  readOnly: boolean;
  onChange: (elements: any, appState: any, files: any) => void;
}

const ExcalidrawBoard: React.FC<ExcalidrawBoardProps> = ({
  initialData,
  readOnly,
  onChange,
}) => {
  const handleChange = useCallback(
    (elements: any, appState: any, files: any) => {
      onChange(elements, appState, files);
    },
    [onChange]
  );

  return (
    <div
      className="excalidraw-container"
      style={{
        height: "100%",
        width: "100%",
        border: "none",
        outline: "none",
      }}
    >
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        viewModeEnabled={readOnly}
        theme="light"
      >
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
};

export default ExcalidrawBoard;

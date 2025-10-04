import { useState } from "react";
import "./App.css";
import EditorPage from "./pages/editor";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-2 w-full h-full">
      <EditorPage />
    </div>
  );
}

export default App;

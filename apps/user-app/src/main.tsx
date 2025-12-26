import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("main.tsx: Starting render...");
try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        console.error("main.tsx: Root element with id 'root' not found!");
    } else {
        createRoot(rootElement).render(<App />);
        console.log("main.tsx: Render called successfully.");
    }
} catch (error) {
    console.error("main.tsx: Error during render initialization:", error);
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

try {
    const rootElement = document.getElementById("root");
    if (rootElement) {
        createRoot(rootElement).render(<App />);
    }
} catch (error) {
    console.error("Critical: Error during render initialization:", error);
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import "./lib/i18n";
import reportWebVitals from './reportWebVitals';

try {
    const rootElement = document.getElementById("root");
    if (rootElement) {
        createRoot(rootElement).render(
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        );
    }
} catch (error) {
    console.error("Critical: Error during render initialization:", error);
}

reportWebVitals(console.log);

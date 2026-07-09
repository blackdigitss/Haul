import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/syne";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

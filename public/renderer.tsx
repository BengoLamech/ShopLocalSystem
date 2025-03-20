import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("React root container not found! Make sure index.html has <div id='root'>");
    return; // Stop execution if root is missing
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

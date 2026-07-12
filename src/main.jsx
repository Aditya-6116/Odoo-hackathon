/**
 * -------------------------------------------------------
 * File: main.jsx
 * Purpose: React application entry point.
 * Module: App Bootstrap
 *
 * Description: Mounts the AssetFlow React app into the root DOM element.
 *
 * TODO: Add providers when application state is implemented.
 * -------------------------------------------------------
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

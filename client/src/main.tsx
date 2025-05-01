import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "Flypside Business Partners";

// Set favicon and meta tags
const head = document.head;
const meta = document.createElement("meta");
meta.name = "description";
meta.content = "Flypside Business Partners Portal - Create events, manage offers, and connect with other businesses";
head.appendChild(meta);

// Add link to Google Fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
head.appendChild(fontLink);

// Add link to Font Awesome
const iconLink = document.createElement("link");
iconLink.rel = "stylesheet";
iconLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css";
head.appendChild(iconLink);

createRoot(document.getElementById("root")!).render(<App />);

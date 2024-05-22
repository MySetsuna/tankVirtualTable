import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@radix-ui/themes/styles.css";

import { ArtPipeline } from "./use/art-pipeline";

function App() {
  return <ArtPipeline />;
}

const container = document.getElementById("root");
const root = createRoot(container!);
const { StrictMode } = React;

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

import * as React from "react";
import { createRoot } from "react-dom/client";
import { Row } from "@tanstack/react-table";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { GanttMode } from "./Gantt/components/VirtualGantt";
import dayjs, { Dayjs } from "dayjs";
import { Gantt, GroupOption } from "./Gantt";
import {
  getBarEnd,
  getBarStart,
  getFrontLinkIds,
  getPostLinkIds,
  getRowId,
} from "./use/use-lib";
import { getStartAndEnd } from "./Gantt/components/VirtualGantt/utils";
import { GroupKeyer } from "./Gantt/types/gantt";
import { getGroupOptions } from "./use/use-hepler";
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

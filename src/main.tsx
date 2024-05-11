import * as React from "react";
import { createRoot } from "react-dom/client";
import { ScrollArea, TextField, Theme } from "@radix-ui/themes";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { makeData, Person } from "./makeData";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { VirtualTable } from "./VirtualTable";
import { VirtualGantt } from "./VirtualGantt";
import dayjs from "dayjs";
import { Gantt } from "./Gantt";
import Flow from "./ReactFlowDemo";

const mdata = makeData(50);

function App() {
  return (
    <>
      <Gantt data={mdata} />
    </>
  );
}

const container = document.getElementById("root");
const root = createRoot(container!);
const { StrictMode } = React;

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

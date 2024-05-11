import dayjs, { Dayjs } from "dayjs";
import {
  CSSProperties,
  Ref,
  RefObject,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Draggable from "react-draggable";
import { useXarrow } from "react-xarrows";
import React from "react";
import Xarrow from "react-xarrows";
import { createPortal } from "react-dom";
import { GanttStyleByStartParams, getDayDiff } from "../VirtualGantt/utils";
import { AnyObject, BarRefMap } from "../VirtualGantt";

export type GanttBarInstance<T = AnyObject> = {
  container: RefObject<HTMLElement>;
  id: string;
  index: number;
  reverseIndex: number;
  original: T;
  frontLinkIds: string[];
  postLinkIds: string[];
  isVisible: boolean;
  dragArrow: RefObject<HTMLElement>;
};

export type GanttBarProps<T = AnyObject> = {
  row: T;
  startDate: Dayjs;
  endDate: Dayjs;
  cellWidth: number;
  index: number;
  barStart?: Dayjs;
  barEnd?: Dayjs;
  barStyle?: CSSProperties;
  barClassName?: string;
  minBarRange: number;
  getGanttStyleByStart: (params: GanttStyleByStartParams) => {
    style: CSSProperties;
    diff: number;
  };
};
export const MyGnttBar = forwardRef(
  (props: GanttBarProps, ref: Ref<GanttBarInstance>) => {
    const {
      row,
      startDate,
      endDate,
      cellWidth,
      getGanttStyleByStart,
      barStart,
      barEnd,
      minBarRange,
      barStyle,
      barClassName,
      index,
    } = props;

    const barContainerRef = useRef<HTMLDivElement | null>(null);

    const { style, diff } = getGanttStyleByStart({
      barStart,
      barEnd,
      startDate,
      cellWidth,
      minBarRange,
    });

    const barRange = getDayDiff(barStart, barEnd, minBarRange);


    return (
      <>
        <div
          title={
            barStart?.format("YYYY-MM-DD") +
            "___" +
            startDate.format("YYYY-MM-DD")
          }
          ref={barContainerRef}
          style={{
            height: 20,
            margin: "auto",
            width: barRange * cellWidth,
            backgroundColor: "pink",
            ...(barStyle ?? {}),
            ...style,
          }}
          className={barClassName}
        >
          {/* {createPortal(
            <Xarrow
              start={`gantt_bar__${row.id}`} //can be react ref
              end={`gantt_bar__${row.id + 1}`} //or an id
            />,
            document.body
          )} */}

          <div id={`gantt_bar__${row.id}`}>
            {barStart?.format("YYYY-MM-DD")}-{startDate.format("YYYY-MM-DD")}-
            {diff}-{diff * cellWidth}
            ---
          </div>
        </div>
      </>
    );
  }
);

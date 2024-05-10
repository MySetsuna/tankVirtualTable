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

export type GanttBarProps = {
  row: any;
  startDate: Dayjs;
  endDate: Dayjs;
  cellWidth: number;
  linkIds?: string[];
  barRefMap: Map<string, RefObject<HTMLDivElement>>;
  parentDom: HTMLDivElement | null;
  getGanttStyleByStart: (
    bartStartAt: Dayjs,
    startDate: Dayjs,
    cellWidth: number
  ) => { style: CSSProperties; diff: number };
};
export const GnttBar = forwardRef((props: GanttBarProps, ref: any) => {
  const {
    row,
    barRefMap,
    startDate,
    endDate,
    cellWidth,
    linkIds,
    getGanttStyleByStart,
    parentDom,
  } = props;
  const rowStart = dayjs(row.createdAt);
  //   if (rowStart.startOf("date").valueOf() > endDate.startOf("date").valueOf()) {
  //     barRefMap.delete(row.id);
  //     return null;
  //   }
  const { style, diff } = getGanttStyleByStart(rowStart, startDate, cellWidth);

  const diff2 = rowStart.diff(startDate, "day");
  const updateXarrow = useXarrow();

  return (
    <>
      {linkIds?.map((linkId) => {
        const localRef = useRef<any>(null);
        const linkRef = useRef<any>(null);
        const [isHoverd, setIsHoverd] = useState(false);

        const localeDom = barRefMap.get(row.id);
        const linkDom = barRefMap.get(linkId);
        useEffect(() => {
          localRef.current = localeDom;
          linkRef.current = linkDom;
        }, [localeDom, linkDom]);
        return (
          <React.Fragment key={linkId}>
            {parentDom &&
              localeDom &&
              linkDom &&
              createPortal(
                <Xarrow
                  zIndex={99999999999999999}
                  startAnchor={["bottom"]}
                  endAnchor={["top"]}
                  start={localRef as any} //can be react ref
                  end={linkRef as any} //or an id
                  curveness={1}
                  strokeWidth={3}
                  headSize={4}
                //   path="grid"
                  labels={
                    isHoverd ? (
                      <div
                        style={{ backgroundColor: "red", color: "white" }}
                        onClick={() => {
                          linkRef.current = null;
                        }}
                        onMouseLeave={() => {
                          setIsHoverd(false);
                        }}
                      >
                        X
                      </div>
                    ) : undefined
                  }
                  // headShape={"circle"}
                  // showTail
                  showXarrow={localRef.current && linkRef.current}
                  gridBreak={"10px"}
                  //   passProps={}
                  passProps={{
                    onClick: () => {
                      console.log(row.id + 1, linkRef);
                      console.log(row.id, localRef);
                    },
                    onMouseOver: () => {
                      setIsHoverd(true);
                    },

                    className: "gantt-line-body",
                  }}
                  // path="straight"
                />,
                parentDom
              )}
          </React.Fragment>
        );
      })}
      {/* {parentDom &&
        localRef.current &&
        linkRef.current &&
        createPortal(
          <Xarrow
            zIndex={99999999999999999}
            startAnchor={["bottom"]}
            endAnchor={["top"]}
            start={localRef as any} //can be react ref
            end={linkRef as any} //or an id
            curveness={1}
            strokeWidth={3}
            headSize={4}
            path="grid"
            labels={
              isHoverd ? (
                <div
                  style={{ backgroundColor: "red", color: "white" }}
                  onClick={() => {
                    setLinkId(null);
                    linkRef.current = null;
                  }}
                >
                  X
                </div>
              ) : undefined
            }
            // headShape={"circle"}
            // showTail
            showXarrow={localRef.current && linkRef.current}
            gridBreak={"10px"}
            arrowBodyProps={{
              onClick: () => {
                console.log(row.id + 1, linkRef);
                console.log(row.id, localRef);
              },
              onMouseOver: () => {
                setIsHoverd(true);
              },
              className: "gantt-line-body",
            }}
            // path="straight"
          />,
          parentDom
        )} */}
      <Draggable axis={"x"} onDrag={updateXarrow} onStop={updateXarrow}>
        <div
          title={
            rowStart.format("YYYY-MM-DD") +
            "___" +
            startDate.format("YYYY-MM-DD")
          }
          ref={ref}
          style={{
            height: 20,
            margin: "auto",
            width: 300,
            backgroundColor: "pink",
            ...style,
          }}
        >
          {/* {createPortal(
            <Xarrow
              start={`gantt_bar__${row.id}`} //can be react ref
              end={`gantt_bar__${row.id + 1}`} //or an id
            />,
            document.body
          )} */}

          <div id={`gantt_bar__${row.id}`}>
            {rowStart.format("YYYY-MM-DD")}-{startDate.format("YYYY-MM-DD")}-
            {diff}-{diff * cellWidth}
            ---
            {diff2}
          </div>
        </div>
      </Draggable>
    </>
  );
});

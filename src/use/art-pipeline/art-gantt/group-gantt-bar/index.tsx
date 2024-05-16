import { IApiArtStory, IApiArtTask } from "../../../art-task";
import { debounce } from "lodash";
import { Key, memo, useCallback, useEffect } from "react";
import { useGanttExpand } from "../../gantt-expand-provider";
import { ART_STORY_GROUP_ID } from "../lib/common";
import React from "react";
import { BaseGroupHeaderData, GroupGanttBarProps } from "../../../../Gantt";

type IProps = GroupGanttBarProps<
  IApiArtTask,
  BaseGroupHeaderData<IApiArtStory>
>;
export const GroupGanttBar = memo((props: IProps) => {
  const { data } = props;
  const { row, group } = data;

  const [
    expandKeys,
    setExpandKeys,
    expandedModuleIdx,
    setExpandedModuleIdx,
    callback,
  ] = useGanttExpand();

  const setExpand =
    row.groupingColumnId === ART_STORY_GROUP_ID
      ? setExpandedModuleIdx
      : setExpandKeys;
  const expands =
    row.groupingColumnId === ART_STORY_GROUP_ID
      ? expandedModuleIdx
      : expandKeys;
  const handleExpanded = useCallback(
    debounce(() => {
      // row.toggleExpanded();
      let newExpands: Key[] = [];
      if (row.getIsExpanded()) {
        newExpands = expands.filter((key: any) => key !== group.id);
      } else {
        console.log(group.id, "group.id");

        newExpands = [...expands, group.id];
      }
      setExpand(newExpands as any);
      callback?.modules?.(newExpands as number[]);
      // console.log(group, 'group');
    }, 100),
    [expands]
  );

  useEffect(() => {
    row.toggleExpanded(expands.includes(group.id));
    if (row.groupingColumnId === ART_STORY_GROUP_ID) {
      //
    }
  }, [expands, row, group]);

  return (
    <div
      onClick={handleExpanded}
      style={{
        background: "lightskyblue",
        width: "100%",
        height: "100%",
      }}
    >
      <span>{row.getIsExpanded() ? "👇" : "👉"}</span>
      <span>{row.groupingValue as string}</span>=======
      <span>{group.data.title}</span>
    </div>
  );
});

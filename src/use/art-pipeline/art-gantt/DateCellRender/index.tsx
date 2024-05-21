import { VirtualItem } from '@tanstack/react-virtual';
import { GanttNode } from '../../../../Gantt';
import { Row } from '@tanstack/react-table';
import { Dayjs } from 'dayjs';
import { IApiArtTask } from '../../../art-task';
import React, { CSSProperties } from 'react';
import { useGanttUpdater } from '../../gantt-updater-provider';
import { onFitPosWhenResizeEnd } from '../../../../Gantt/utils';
import { getLeafRowOriginalId } from '../lib/utils';
import { useReactFlow } from 'reactflow';

type IProps = {
  row: Row<IApiArtTask>;
  virtualRow: VirtualItem;
  date: Dayjs;
  onBarChange?: (startAt: Dayjs, endAt: Dayjs, original: IApiArtTask) => void;
  originStart?: Dayjs;
  resizeLeafNode: (
    rowId: string,
    width: number,
    date: Dayjs,
    virtualRow: VirtualItem
  ) => void;
  style?: CSSProperties;
  onClick?: () => void;
};
export const DateCellRender = (props: IProps) => {
  const {
    resizeLeafNode,
    row,
    style,
    onClick,
    virtualRow,
    date,
    onBarChange,
    originStart,
  } = props;
  const [, , , , , , mdRef] = useGanttUpdater();
  const { getNode } = useReactFlow();

  const node = getNode(getLeafRowOriginalId(row)) as GanttNode<IApiArtTask>;

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    document.body.style.userSelect = 'none';
    // onBarChange?.(date, date, row.original);
    const listener = (evt: MouseEvent) => {
      const width = evt.clientX - event.clientX + 60;

      // onNodesChange([
      //   {
      //     id,
      //     type: 'dimensions',
      //     dimensions: {
      //       width: evt.clientX - event.clientX + 60,
      //       height: node?.height ?? virtualRow.size,
      //     },
      //   },
      // ]);
      console.log(row.id, 'row.id');
      resizeLeafNode(row.id, width, date, virtualRow);
    };
    mdRef.current = {
      id: row.original.artTaskId,
      listener,
      changeFn: () => {
        console.log(433);

        document.removeEventListener('mousemove', listener);
        document.body.style.userSelect = 'auto';
        const id = getLeafRowOriginalId(row);
        const node = getNode(id) as GanttNode<IApiArtTask>;
        // onFitPosWhenResizeEnd(
        //   node?.data.cellWidth,
        //   node,
        //   originStart,
        //   onBarChange
        // );
        if (node.data.startAt && node.data.endAt) {
          onBarChange?.(
            node.data.startAt ?? date,
            node.data.endAt ?? date,
            row.original
          );
        }
      },
    };
    document.addEventListener('mousemove', listener);
    document.addEventListener('mouseup', mdRef.current.changeFn);
  };

  if (!node || node?.data.emptyRange) {
    return (
      <div
        style={style}
        onMouseDown={onMouseDown}
        onClick={onClick}
        //   onMouseUp={onMouseUp}
      ></div>
    );
  }

  return null;
};

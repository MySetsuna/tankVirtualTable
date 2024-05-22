import { Table, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  AlertMap,
  GanttAlertType,
  UserRole,
  buildNearAvailableAlertData,
} from '../lib/common';
import { ColumnType } from 'antd/lib/table';
import { GanttAlertProps } from '@/components/Gantt/components/VirtualGantt';
import { ModalWrap } from '@/components/modal-wrap';
import { createPortal } from 'react-dom';
import { IApiArtTask } from '@/model/pmstation/api-modules/art-task';

export const GanttAlert = (
  props: GanttAlertProps<
    IApiArtTask,
    AlertMap,
    { userRoles: UserRole[]; users: string[] }
  >
) => {
  const {
    alertMap,
    params: { userRoles, users },
    date,
    type,
    start,
    end,
  } = props;
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const columns: ColumnType<any>[] = [
    {
      title: '人员ID',
      dataIndex: 'handler',
      width: 100,
    },
    { title: '用户组', dataIndex: 'roles', width: 100 },
    { title: '时间段', dataIndex: 'date' },
  ];

  const [data, setData] = useState<any[]>([]);

  const todayFmtStr = date.format('YYYY-MM-DD');

  // const { conflictIds } = alertMap[todayFmtStr] ?? {};

  const alertCount = data.length;

  useEffect(() => {
    if (
      (open || isHovered) &&
      Object.values(GanttAlertType).includes(type as GanttAlertType)
    ) {
      const data = buildNearAvailableAlertData(
        date,
        alertMap,
        users,
        userRoles,
        type as GanttAlertType,
        start,
        end
      );
      setData(data);
    }
  }, [type, alertMap, users, date, isHovered, start, end]);

  if (GanttAlertType.Normal === type) {
    return null;
  }

  return (
    <>
      <Tooltip
        title={
          GanttAlertType.UnAvailable === type
            ? `冲突${alertCount}`
            : `空闲${alertCount}`
        }
      >
        <div
          onMouseOver={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ width: '100%', height: '100%' }}
          onClick={
            GanttAlertType.UnAvailable === type
              ? () => {
                  // todo 处理筛选
                }
              : () => {
                  setOpen(true);
                }
          }
        ></div>
      </Tooltip>
      {GanttAlertType.Available === type &&
        open &&
        createPortal(
          <ModalWrap
            zIndex={9999}
            title={`${todayFmtStr}空闲人员（${alertCount}）`}
            onOk={() => Promise.resolve(true)}
            onClose={() => {
              setOpen((pre) => !pre);
            }}
            maskClosable
          >
            <Table columns={columns} dataSource={data} pagination={false} />
          </ModalWrap>,
          document.body
        )}
    </>
  );
};

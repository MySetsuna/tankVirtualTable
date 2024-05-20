import { Modal, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { IApiArtTask } from '../../../art-task';
import {
  AlertMap,
  GanttAlertType,
  buildNearAvailableAlertData,
} from '../lib/common';
import { GanttAlertPropps } from '../../../../Gantt/components/VirtualGantt';
import { ColumnType } from 'antd/lib/table';

export const GanttAlert = (props: GanttAlertPropps<IApiArtTask, AlertMap>) => {
  const { alertMap, params, date, type } = props;
  const [open, setOpen] = useState(false);

  const columns: ColumnType<any>[] = [
    { title: '人员', dataIndex: 'handler' },
    { title: 'role', dataIndex: 'role' },
    { title: 'date', dataIndex: 'date' },
  ];
  const [data, setData] = useState<any[]>([]);
  const {
    conflictIds,
    type: alertType,
    user,
  } = alertMap[date.format('YYYY-MM-DD')] ?? {};

  useEffect(() => {
    if (GanttAlertType.Available === type && open) {
      const data = buildNearAvailableAlertData(date, alertMap, params);
      setData(data);
    }
  }, [type, alertMap, params, date, open]);
  if (GanttAlertType.Normal === type) {
    return null;
  }
  if (GanttAlertType.UnAvailable === type) {
    return;
  }
  return (
    <>
      <Tooltip
        title={
          GanttAlertType.UnAvailable === type
            ? conflictIds.length
            : Object.keys(user).length
        }
      >
        <div
          style={{ width: '100%', height: '100%' }}
          onClick={() => setOpen(true)}
        ></div>
      </Tooltip>
      {GanttAlertType.Available === type && (
        <Modal open={open} onCancel={() => setOpen(false)}>
          {JSON.stringify(data)}
        </Modal>
      )}
    </>
  );
};

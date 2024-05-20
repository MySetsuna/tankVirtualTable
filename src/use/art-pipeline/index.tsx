import { useEffect, useState } from 'react';
import { ArtPipGantt } from './art-gantt';
import { IApiArtPip, IApiArtStory, IApiArtTask } from '.././art-task';

import { GanttExpandProvider } from './gantt-expand-provider';
import React from 'react';
import { makeArtPip, makeStory, makeTask } from '../../makeData';

export const ArtPipeline = () => {
  const [newPipName, setNewPipName] = useState<string>('');
  const [pipList, setPipList] = useState<IApiArtPip[]>([]);
  const [tasks, setTasks] = useState<IApiArtTask[]>([]);
  const [stories, setStories] = useState<IApiArtStory[]>([]);
  const [artPip, setArtPip] = useState<IApiArtPip | undefined>();
  const [isGroupView, setIsGroupView] = useState<boolean>(true);
  const [groupStr, setGroupStr] = useState<string>('');

  const fetchPips = async () => {
    const result = await makeArtPip(5);
    if (result) {
      setPipList(result);
      if (result.length) setArtPip(result[0]);
    }
  };

  const fetchTasks = async (artPipId: number) => {
    const result = await makeTask(50).sort(
      (a, b) => a.artStoryId - b.artStoryId
    );
    if (result) {
      setTasks(result.slice());
    }
  };

  const fetchStory = async (artPipId: number) => {
    const result = await makeStory(20);
    if (result) {
      setStories(result.slice());
    }
  };

  const onCreate = async () => {
    /**
     *   artPipId: number;
  projectId: string;
  name: string;
  category: string;
  config: string;
  fatherId: number;
     */
    // const result = await apiEditPip({
    //   projectId,
    //   name: newPipName,
    //   category: '',
    //   config: '',
    // });
    // if (result?.artPipId) {
    //   setNewPipName('');
    //   fetchPips();
    // }
  };

  useEffect(() => {
    if (artPip) {
      fetchTasks(artPip.artPipId);
      fetchStory(artPip.artPipId);
    }
  }, [artPip, artPip?.artPipId]);

  useEffect(() => {
    fetchPips();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div
        style={{
          width: 300,
          padding: 10,
          flexShrink: 0,
          background: '##2f2f2f',
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <input
          value={newPipName}
          onChange={(event) => setNewPipName(event.target.value)}
        />
        <button onClick={() => onCreate()}>创建美术看板</button>
        <div className='pip-list'>
          {pipList.map((pip) => {
            return (
              <div
                key={pip.artPipId}
                style={{ display: 'flex', justifyContent: 'space-between' }}
                onClick={() => setArtPip(pip)}
              >
                <span>{pip.name}</span>
                <span>{pip.count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ minWidth: 400, flex: 'auto' }}>
        <div>
          <input
            value={groupStr}
            onChange={(event) => setGroupStr(event.target.value)}
          />
          <button onClick={() => setIsGroupView((pre) => !pre)}>
            {isGroupView ? '取消分组' : '确定分组'}
          </button>
        </div>
        <GanttExpandProvider>
          <ArtPipGantt
            isGroupView={isGroupView}
            tasks={tasks}
            stories={stories}
            artPip={artPip}
            setTasks={setTasks}
            onListChange={() => {
              if (artPip) {
                fetchTasks(artPip.artPipId);
                fetchStory(artPip.artPipId);
              }
            }}
            grouping={groupStr.split(',') as (keyof IApiArtTask)[]}
          />
        </GanttExpandProvider>
      </div>
    </div>
  );
};

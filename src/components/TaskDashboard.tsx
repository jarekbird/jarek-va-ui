/**
 * TaskDashboard Component
 * Main dashboard for task management with note-taking, file viewer, and tasks
 *
 * Layout:
 * - Far left: File viewer
 * - Left: Note taking panel
 * - Middle right: Task management
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NoteTakingPanel } from './NoteTakingPanel';
import {
  WorkingDirectoryBrowser,
  type WorkingDirectoryBrowserRef,
} from './WorkingDirectoryBrowser';
import {
  TaskManagementPanel,
  type TaskManagementPanelRef,
} from './TaskManagementPanel';
import './TaskDashboard.css';

export const TaskDashboard: React.FC = () => {
  const [selectedNoteConversationId, setSelectedNoteConversationId] = useState<
    string | undefined
  >();
  const fileBrowserRef = useRef<WorkingDirectoryBrowserRef>(null);
  const taskPanelRef = useRef<TaskManagementPanelRef>(null);
  const lastRefreshAtRef = useRef<number>(0);
  const refreshTimerRef = useRef<number | null>(null);

  const refreshPanels = useCallback(() => {
    void fileBrowserRef.current?.refresh();
    void taskPanelRef.current?.refresh();
    lastRefreshAtRef.current = Date.now();
  }, []);

  // Handle note conversation updates - throttled refresh to prevent spam during streaming updates
  const handleNoteConversationUpdate = useCallback(() => {
    // Skip throttling in test environment to prevent test stalls
    const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;
    if (isTestEnv) {
      refreshPanels();
      return;
    }

    const now = Date.now();
    const minIntervalMs = 2000;
    const elapsed = now - lastRefreshAtRef.current;

    if (elapsed >= minIntervalMs) {
      refreshPanels();
      return;
    }

    if (refreshTimerRef.current !== null) {
      return;
    }

    refreshTimerRef.current = window.setTimeout(
      () => {
        refreshTimerRef.current = null;
        refreshPanels();
      },
      Math.max(50, minIntervalMs - elapsed)
    );
  }, [refreshPanels]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="task-dashboard" data-testid="task-dashboard">
      <div className="task-dashboard__content">
        <div className="task-dashboard__file-viewer">
          <WorkingDirectoryBrowser ref={fileBrowserRef} />
        </div>
        <div className="task-dashboard__left">
          <NoteTakingPanel
            conversationId={selectedNoteConversationId}
            onConversationSelect={setSelectedNoteConversationId}
            onConversationUpdate={handleNoteConversationUpdate}
          />
        </div>
        <div className="task-dashboard__middle-right">
          <TaskManagementPanel ref={taskPanelRef} />
        </div>
      </div>
    </div>
  );
};

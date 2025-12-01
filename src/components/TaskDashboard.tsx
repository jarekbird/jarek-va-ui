/**
 * TaskDashboard Component
 * Main dashboard for task management with note-taking, file viewer, tasks, and Bull MQ view
 *
 * Layout:
 * - Far left: File viewer
 * - Left: Note taking panel
 * - Middle right: Task management
 * - Right: Bull MQ queue view
 */

import React, { useState, useRef } from 'react';
import { NoteTakingPanel } from './NoteTakingPanel';
import {
  WorkingDirectoryBrowser,
  type WorkingDirectoryBrowserRef,
} from './WorkingDirectoryBrowser';
import {
  TaskManagementPanel,
  type TaskManagementPanelRef,
} from './TaskManagementPanel';
import { BullMQQueueView } from './BullMQQueueView';
import './TaskDashboard.css';

export const TaskDashboard: React.FC = () => {
  const [selectedNoteConversationId, setSelectedNoteConversationId] = useState<
    string | undefined
  >();
  const fileBrowserRef = useRef<WorkingDirectoryBrowserRef>(null);
  const taskPanelRef = useRef<TaskManagementPanelRef>(null);

  // Handle note conversation updates - refresh file browser and task panel
  const handleNoteConversationUpdate = () => {
    // Refresh file browser when note conversation is updated
    if (fileBrowserRef.current) {
      fileBrowserRef.current.refresh();
    }
    // Refresh task panel when note conversation is updated
    if (taskPanelRef.current) {
      taskPanelRef.current.refresh();
    }
  };

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
        <div className="task-dashboard__right">
          <BullMQQueueView />
        </div>
      </div>
    </div>
  );
};

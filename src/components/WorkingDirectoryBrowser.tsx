/**
 * WorkingDirectoryBrowser Component
 * Displays a file tree view of the cursor working directory
 */

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { getWorkingDirectoryFiles } from '../api/repositories';
import type { FileNode } from '../types/file-tree';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import './WorkingDirectoryBrowser.css';

export interface WorkingDirectoryBrowserRef {
  refresh: () => Promise<void>;
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level = 0,
  expandedPaths,
  onToggleExpand,
}) => {
  const isExpanded = expandedPaths.has(node.path);
  const hasChildren =
    node.type === 'directory' && node.children && node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(node.path);
    }
  };

  const icon = node.type === 'directory' ? '📁' : '📄';

  return (
    <div className="file-tree-node" style={{ paddingLeft: `${level * 12}px` }}>
      <div
        className="file-tree-node__row"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
      >
        <span className="file-tree-node__expand">
          {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
        </span>
        <span className="file-tree-node__icon">{icon}</span>
        <span className="file-tree-node__name" title={node.path}>
          {node.name}
        </span>
      </div>
      {isExpanded && hasChildren && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode 
              key={`${child.path}-${index}`} 
              node={child} 
              level={level + 1}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WorkingDirectoryBrowser = forwardRef<WorkingDirectoryBrowserRef>(
  (_props, ref) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Track expanded paths to preserve state on refresh
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFiles();
  }, []);

  // Initialize with first level expanded
  useEffect(() => {
    if (files.length > 0 && expandedPaths.size === 0) {
      const initialExpanded = new Set<string>();
        files.forEach((node) => {
        if (node.type === 'directory') {
          initialExpanded.add(node.path);
        }
      });
      setExpandedPaths(initialExpanded);
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileTree = await getWorkingDirectoryFiles();
      setFiles(fileTree);
    } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load file tree';
      setError(errorMessage);
      console.error('Failed to load working directory files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (path: string) => {
      setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadFiles();
    },
  }));

  return (
    <div className="working-directory-browser">
      <div className="working-directory-browser__header">
        <h3>Working Directory</h3>
        <button
          className="working-directory-browser__refresh"
          onClick={loadFiles}
          title="Refresh"
          aria-label="Refresh file tree"
        >
          ↻
        </button>
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && files.length === 0 && (
        <div className="working-directory-browser__empty">
          <p>No files found</p>
        </div>
      )}
      {!loading && !error && files.length > 0 && (
        <div className="working-directory-browser__tree">
          {files.map((node, index) => (
            <FileTreeNode 
              key={`${node.path}-${index}`} 
              node={node}
              expandedPaths={expandedPaths}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
  }
);

WorkingDirectoryBrowser.displayName = 'WorkingDirectoryBrowser';

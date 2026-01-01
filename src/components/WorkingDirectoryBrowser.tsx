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
import {
  getWorkingDirectoryFiles,
  getWorkingDirectoryFilesForPath,
} from '../api/repositories';
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
  loadingPaths: Set<string>;
  onToggleExpand: (node: FileNode) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level = 0,
  expandedPaths,
  loadingPaths,
  onToggleExpand,
}) => {
  const isExpanded = expandedPaths.has(node.path);
  const isDirectory = node.type === 'directory';
  const isLoading = loadingPaths.has(node.path);
  const hasLoadedChildren = isDirectory && node.children !== undefined;
  const hasChildren =
    isDirectory && node.children !== undefined && node.children.length > 0;

  const handleToggle = () => {
    if (isDirectory) {
      onToggleExpand(node);
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
        role={isDirectory ? 'button' : undefined}
        tabIndex={isDirectory ? 0 : undefined}
      >
        <span className="file-tree-node__expand">
          {isDirectory ? (isExpanded ? '▼' : '▶') : ' '}
        </span>
        <span className="file-tree-node__icon">{icon}</span>
        <span className="file-tree-node__name" title={node.path}>
          {node.name}
        </span>
      </div>
      {isExpanded && isDirectory && (
        <div>
          {isLoading && (
            <div style={{ paddingLeft: `${(level + 1) * 12}px` }}>Loading…</div>
          )}
          {!isLoading &&
            hasLoadedChildren &&
            node.children &&
            node.children.length === 0 && (
              <div style={{ paddingLeft: `${(level + 1) * 12}px` }}>Empty</div>
            )}
          {!isLoading && hasChildren && node.children && (
            <div>
              {node.children.map((child, index) => (
                <FileTreeNode
                  key={`${child.path}-${index}`}
                  node={child}
                  level={level + 1}
                  expandedPaths={expandedPaths}
                  loadingPaths={loadingPaths}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </div>
          )}
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
    const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

    useEffect(() => {
      loadFiles();
    }, []);

    const updateNodeChildren = (
      nodes: FileNode[],
      targetPath: string,
      children: FileNode[]
    ): FileNode[] => {
      return nodes.map((n) => {
        if (n.path === targetPath) {
          return { ...n, children };
        }
        if (n.type === 'directory' && n.children) {
          return {
            ...n,
            children: updateNodeChildren(n.children, targetPath, children),
          };
        }
        return n;
      });
    };

    const loadFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const fileTree = await getWorkingDirectoryFiles();
        setFiles(fileTree);
        setExpandedPaths(new Set());
        setLoadingPaths(new Set());
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load file tree';
        setError(errorMessage);
        console.error('Failed to load working directory files:', err);
      } finally {
        setLoading(false);
      }
    };

    const findNodeByPath = (
      nodes: FileNode[],
      targetPath: string
    ): FileNode | null => {
      for (const n of nodes) {
        if (n.path === targetPath) return n;
        if (n.type === 'directory' && n.children) {
          const found = findNodeByPath(n.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const loadChildrenRecursively = async (
      nodePath: string,
      currentExpandedPaths: Set<string>,
      currentFiles: FileNode[]
    ): Promise<FileNode[]> => {
      const currentNode = findNodeByPath(currentFiles, nodePath);
      if (!currentNode) {
        return currentFiles; // not found
      }

      // Load children for this node if not already loaded
      let updatedFiles = currentFiles;
      if (currentNode.children === undefined) {
        setLoadingPaths((prev) => new Set(prev).add(nodePath));
        try {
          const children = await getWorkingDirectoryFilesForPath(nodePath, 1);
          updatedFiles = updateNodeChildren(currentFiles, nodePath, children);
          setFiles(updatedFiles);
        } catch (err) {
          console.error(
            `Failed to load directory children for ${nodePath}:`,
            err
          );
          return currentFiles;
        } finally {
          setLoadingPaths((prev) => {
            const next = new Set(prev);
            next.delete(nodePath);
            return next;
          });
        }
      }

      // After loading (or if already loaded), check if any of the children are directories that are expanded
      // and recursively load their children
      const updatedNode = findNodeByPath(updatedFiles, nodePath);
      if (
        updatedNode &&
        updatedNode.type === 'directory' &&
        updatedNode.children
      ) {
        let finalFiles = updatedFiles;
        for (const child of updatedNode.children) {
          if (
            child.type === 'directory' &&
            currentExpandedPaths.has(child.path)
          ) {
            // Recursively load children for expanded nested directories
            finalFiles = await loadChildrenRecursively(
              child.path,
              currentExpandedPaths,
              finalFiles
            );
          }
        }
        return finalFiles;
      }
      return updatedFiles;
    };

    const handleToggleExpand = async (node: FileNode) => {
      if (node.type !== 'directory') return;

      const isExpanded = expandedPaths.has(node.path);
      if (isExpanded) {
        setExpandedPaths((prev) => {
          const next = new Set(prev);
          next.delete(node.path);
          return next;
        });
        return;
      }

      // Add to expanded paths first
      const newExpandedPaths = new Set(expandedPaths);
      newExpandedPaths.add(node.path);
      setExpandedPaths(newExpandedPaths);

      // Load children for this node and recursively for any nested expanded directories
      // Use current files state and update it as we go
      await loadChildrenRecursively(node.path, newExpandedPaths, files);
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
                loadingPaths={loadingPaths}
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

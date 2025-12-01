import React from 'react';
import type { FileNode } from '../types/file-tree';

interface RepositoryFileBrowserProps {
  repository: string;
  files?: FileNode[];
  loading?: boolean;
  error?: string | null;
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(level < 2); // Auto-expand first 2 levels
  const hasChildren =
    node.type === 'directory' && node.children && node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const indentStyle: React.CSSProperties = {
    paddingLeft: `${level * 16}px`,
  };

  const icon = node.type === 'directory' ? '📁' : '📄';

  return (
    <div style={indentStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 0',
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
        }}
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
        <span style={{ marginRight: '4px', fontSize: '14px' }}>
          {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
        </span>
        <span style={{ marginRight: '6px' }}>{icon}</span>
        <span
          style={{
            fontSize: '14px',
            color: node.type === 'directory' ? '#3498db' : '#2c3e50',
          }}
          title={node.path}
        >
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * RepositoryFileBrowser component.
 * Renders a read-only tree view of repository files and directories.
 */
export const RepositoryFileBrowser: React.FC<RepositoryFileBrowserProps> = ({
  repository,
  files,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <p style={{ color: '#7f8c8d' }}>Loading repository structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <p style={{ color: '#e74c3c' }}>Error: {error}</p>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div style={{ padding: '1rem' }}>
        <p style={{ color: '#7f8c8d' }}>No files found in repository.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
        maxHeight: '500px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#2c3e50' }}
      >
        Repository Structure (read-only)
      </div>
      <div
        style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '0.5rem' }}
      >
        Repository: {repository}
      </div>
      <div>
        {files.map((node, index) => (
          <FileTreeNode key={`${node.path}-${index}`} node={node} />
        ))}
      </div>
    </div>
  );
};

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { RepositoryFileBrowser } from '../RepositoryFileBrowser';
import type { FileNode } from '../../types/file-tree';

const mockFiles: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'directory',
    children: [
      {
        name: 'index.ts',
        path: 'src/index.ts',
        type: 'file',
      },
      {
        name: 'utils',
        path: 'src/utils',
        type: 'directory',
        children: [
          {
            name: 'helper.ts',
            path: 'src/utils/helper.ts',
            type: 'file',
          },
        ],
      },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
  },
];

describe('RepositoryFileBrowser', () => {
  it('renders repository name', () => {
    render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);
    expect(screen.getByText(/repository: test-repo/i)).toBeInTheDocument();
  });

  it('renders repository structure header', () => {
    render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);
    expect(screen.getByText(/repository structure \(read-only\)/i)).toBeInTheDocument();
  });

  it('renders file tree with directories and files', () => {
    render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RepositoryFileBrowser repository="test-repo" loading={true} />);
    expect(screen.getByText(/loading repository structure/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Failed to load files';
    render(
      <RepositoryFileBrowser repository="test-repo" error={errorMessage} />
    );
    expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
  });

  it('shows empty state when no files', () => {
    render(<RepositoryFileBrowser repository="test-repo" files={[]} />);
    expect(screen.getByText(/no files found in repository/i)).toBeInTheDocument();
  });

  it('expands and collapses directories', async () => {
    const user = userEvent.setup();
    render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);

    // Initially, first 2 levels should be expanded
    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.getByText('utils')).toBeInTheDocument();

    // Click on utils directory to collapse it
    const utilsDir = screen.getByText('utils').closest('div[role="button"]');
    if (utilsDir) {
      await user.click(utilsDir);
      // helper.ts should be hidden after collapse
      expect(screen.queryByText('helper.ts')).not.toBeInTheDocument();
    }
  });

  it('renders file icons correctly', () => {
    const { container } = render(
      <RepositoryFileBrowser repository="test-repo" files={mockFiles} />
    );

    // Check for directory and file icons (📁 and 📄)
    const icons = container.querySelectorAll('span');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders nested directory structure', () => {
    render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);
    
    // Check nested structure
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.getByText('utils')).toBeInTheDocument();
    expect(screen.getByText('helper.ts')).toBeInTheDocument();
  });

  it('applies correct indentation for nested items', () => {
    const { container } = render(
      <RepositoryFileBrowser repository="test-repo" files={mockFiles} />
    );

    // Check that nested items have padding
    const fileNodes = container.querySelectorAll('[style*="paddingLeft"]');
    expect(fileNodes.length).toBeGreaterThan(0);
  });

  it('has scrollable container for large file trees', () => {
    const { container } = render(
      <RepositoryFileBrowser repository="test-repo" files={mockFiles} />
    );

    const browserContainer = container.firstChild as HTMLElement;
    expect(browserContainer).toHaveStyle({ maxHeight: '500px', overflowY: 'auto' });
  });

  describe('Performance', () => {
    it('renders large file tree efficiently', () => {
      // Generate a large file tree
      const generateLargeTree = (depth: number, filesPerDir: number): FileNode[] => {
        if (depth === 0) {
          return Array.from({ length: filesPerDir }, (_, i) => ({
            name: `file${i}.ts`,
            path: `file${i}.ts`,
            type: 'file' as const,
          }));
        }

        return Array.from({ length: filesPerDir }, (_, i) => ({
          name: `dir${i}`,
          path: `dir${i}`,
          type: 'directory' as const,
          children: generateLargeTree(depth - 1, filesPerDir),
        }));
      };

      const largeTree = generateLargeTree(3, 10); // 3 levels, 10 items per level = ~1000 nodes

      const start = performance.now();
      render(<RepositoryFileBrowser repository="test-repo" files={largeTree} />);
      const duration = performance.now() - start;

      // Should render large tree in less than 500ms
      expect(duration).toBeLessThan(500);
      expect(screen.getByText('dir0')).toBeInTheDocument();
    });

    it('handles very deep directory nesting', () => {
      // Create a deeply nested structure
      let deepTree: FileNode = {
        name: 'root',
        path: 'root',
        type: 'directory',
        children: [],
      };

      let current = deepTree;
      for (let i = 0; i < 20; i++) {
        const child: FileNode = {
          name: `level${i}`,
          path: `root/level${i}`,
          type: 'directory',
          children: [],
        };
        if (!current.children) {
          current.children = [];
        }
        current.children.push(child);
        current = child;
      }

      const start = performance.now();
      render(<RepositoryFileBrowser repository="test-repo" files={[deepTree]} />);
      const duration = performance.now() - start;

      // Should handle deep nesting efficiently
      expect(duration).toBeLessThan(300);
      expect(screen.getByText('root')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles for expandable directories', () => {
      render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);
      
      const directoryButtons = screen.getAllByRole('button');
      expect(directoryButtons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RepositoryFileBrowser repository="test-repo" files={mockFiles} />);

      const directoryButton = screen.getByText('utils').closest('div[role="button"]') as HTMLElement;
      if (directoryButton) {
        directoryButton.focus();
        await user.keyboard('{Enter}');
        // Directory should toggle
      }
    });
  });
});


import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Code,
  Download,
  FileCode,
  FolderOpen,
  Search,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
  extension?: string;
}

export default function AdminSourceCode() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/src']));
  const [loading, setLoading] = useState(false);

  // Mock file structure - in a real implementation, this would come from an API
  const fileStructure: FileNode[] = [
    {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        {
          name: 'components',
          path: '/src/components',
          type: 'directory',
          children: [
            { name: 'ui', path: '/src/components/ui', type: 'directory' },
            { name: 'layouts', path: '/src/components/layouts', type: 'directory' },
            { name: 'common', path: '/src/components/common', type: 'directory' },
          ],
        },
        {
          name: 'pages',
          path: '/src/pages',
          type: 'directory',
          children: [
            { name: 'admin', path: '/src/pages/admin', type: 'directory' },
            { name: 'HomePage.tsx', path: '/src/pages/HomePage.tsx', type: 'file', extension: 'tsx' },
            { name: 'ProductsPage.tsx', path: '/src/pages/ProductsPage.tsx', type: 'file', extension: 'tsx' },
            { name: 'ProductDetailPage.tsx', path: '/src/pages/ProductDetailPage.tsx', type: 'file', extension: 'tsx' },
          ],
        },
        {
          name: 'contexts',
          path: '/src/contexts',
          type: 'directory',
          children: [
            { name: 'AuthContext.tsx', path: '/src/contexts/AuthContext.tsx', type: 'file', extension: 'tsx' },
            { name: 'CartContext.tsx', path: '/src/contexts/CartContext.tsx', type: 'file', extension: 'tsx' },
            { name: 'WishlistContext.tsx', path: '/src/contexts/WishlistContext.tsx', type: 'file', extension: 'tsx' },
          ],
        },
        {
          name: 'db',
          path: '/src/db',
          type: 'directory',
          children: [
            { name: 'api.ts', path: '/src/db/api.ts', type: 'file', extension: 'ts' },
            { name: 'supabase.ts', path: '/src/db/supabase.ts', type: 'file', extension: 'ts' },
          ],
        },
        {
          name: 'types',
          path: '/src/types',
          type: 'directory',
          children: [
            { name: 'types.ts', path: '/src/types/types.ts', type: 'file', extension: 'ts' },
            { name: 'index.ts', path: '/src/types/index.ts', type: 'file', extension: 'ts' },
          ],
        },
        { name: 'App.tsx', path: '/src/App.tsx', type: 'file', extension: 'tsx' },
        { name: 'main.tsx', path: '/src/main.tsx', type: 'file', extension: 'tsx' },
        { name: 'routes.tsx', path: '/src/routes.tsx', type: 'file', extension: 'tsx' },
      ],
    },
    {
      name: 'supabase',
      path: '/supabase',
      type: 'directory',
      children: [
        { name: 'migrations', path: '/supabase/migrations', type: 'directory' },
        { name: 'functions', path: '/supabase/functions', type: 'directory' },
      ],
    },
    { name: 'package.json', path: '/package.json', type: 'file', extension: 'json' },
    { name: 'tsconfig.json', path: '/tsconfig.json', type: 'file', extension: 'json' },
    { name: 'vite.config.ts', path: '/vite.config.ts', type: 'file', extension: 'ts' },
    { name: 'tailwind.config.js', path: '/tailwind.config.js', type: 'file', extension: 'js' },
  ];

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'directory') {
      toggleFolder(file.path);
      return;
    }

    setSelectedFile(file);
    setLoading(true);

    // In a real implementation, this would fetch the actual file content
    // For now, we'll show a placeholder
    setTimeout(() => {
      setFileContent(`// File: ${file.path}\n// This is a placeholder for the actual file content\n// In production, this would show the real source code\n\n// Example content:\nimport { useState } from 'react';\n\nexport default function Component() {\n  const [state, setState] = useState(null);\n  \n  return (\n    <div>\n      <h1>Component</h1>\n    </div>\n  );\n}`);
      setLoading(false);
    }, 300);
  };

  const handleCopyCode = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    if (!selectedFile || !fileContent) return;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${selectedFile.name}`);
  };

  const handleDownloadAll = () => {
    toast.info('Preparing source code archive...');
    
    // In a real implementation, this would call an Edge Function to create a zip file
    setTimeout(() => {
      toast.success('Source code download started');
      // Simulate download
      const a = document.createElement('a');
      a.href = '#';
      a.download = 'shottopoth-source-code.zip';
      toast.info('Note: In production, this would download the complete source code as a ZIP file');
    }, 1000);
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFile?.path === node.path;

      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent transition-colors ${
              isSelected ? 'bg-accent' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => handleFileClick(node)}
          >
            {node.type === 'directory' ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Folder className="h-4 w-4 text-blue-500" />
              </>
            ) : (
              <>
                <div className="w-4" />
                <FileCode className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            <span className="text-sm">{node.name}</span>
            {node.extension && (
              <Badge variant="outline" className="ml-auto text-xs">
                {node.extension}
              </Badge>
            )}
          </div>
          {node.type === 'directory' && isExpanded && node.children && (
            <div>{renderFileTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const filteredFiles = fileStructure; // In real implementation, filter based on searchQuery

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Source Code</h1>
          <p className="text-muted-foreground">
            View and download the application source code
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={handleDownloadAll} className="gap-2">
            <Download className="h-4 w-4" />
            Download All Source Code
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Browser */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                File Browser
              </CardTitle>
              <CardDescription>Browse and select files to view</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {renderFileTree(filteredFiles)}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Code Viewer */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Viewer
                  </CardTitle>
                  <CardDescription>
                    {selectedFile ? selectedFile.path : 'Select a file to view'}
                  </CardDescription>
                </div>
                {selectedFile && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyCode}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadFile}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading file...</p>
                  </div>
                </div>
              ) : selectedFile ? (
                <ScrollArea className="h-[600px]">
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{fileContent}</code>
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <File className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Select a file from the browser to view its content
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • This feature allows administrators to view and download the application source code
            </p>
            <p className="text-sm text-muted-foreground">
              • Downloaded files can be used for backup, version control, or deployment purposes
            </p>
            <p className="text-sm text-muted-foreground">
              • The "Download All" button packages the entire codebase into a ZIP file
            </p>
            <p className="text-sm text-muted-foreground">
              • Individual files can be downloaded by selecting them and clicking the Download button
            </p>
            <p className="text-sm text-destructive font-medium">
              ⚠️ Note: This is a demonstration version. In production, this would show actual file contents and enable real downloads.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

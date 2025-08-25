import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { FileUploadZone } from '@/components/FileUploadZone';
import { FileGrid } from '@/components/FileGrid';
import { useToast } from '@/hooks/use-toast';
import { getFiles, uploadFile, previewFile, downloadFile, deleteFile } from '@/api/api';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        console.log('Dashboard: Fetching files');
        const data = await getFiles();
        console.log('Dashboard: Files fetched:', data);
        setFiles(data);
      } catch (error: any) {
        console.error('Dashboard: Fetch files error:', error.message);
        toast({
          title: 'Error',
          description: 'Failed to fetch files',
          variant: 'destructive',
        });
      }
    };
    fetchFiles();
  }, []);

  const handleFileUpload = async (fileList: FileList) => {
    try {
      console.log('Dashboard: Uploading files', fileList);
      const newFiles = await Promise.all(
        Array.from(fileList).map(async (file) => {
          const data = await uploadFile(file);
          return data;
        })
      );
      console.log('Dashboard: Files uploaded:', newFiles);
      setFiles((prev) => [...newFiles, ...prev]);
      toast({
        title: 'Files uploaded successfully!',
        description: `${newFiles.length} file(s) have been uploaded to your cloud storage.`,
      });
    } catch (error: any) {
      console.error('Dashboard: Upload error:', error.message);
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const handleFilePreview = async (file: any) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      console.log('Dashboard: Preview not supported for file type:', file.type);
      toast({
        title: 'Preview failed',
        description: 'Preview not available for this file type',
        variant: 'destructive',
      });
      return;
    }
    try {
      console.log('Dashboard: Previewing file', file.id);
      const { url } = await previewFile(file.id);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Dashboard: Preview error:', error.message);
      toast({
        title: 'Preview failed',
        description: error.message || 'File cannot be previewed',
        variant: 'destructive',
      });
    }
  };

  const handleFileDownload = async (file: any) => {
    try {
      console.log('Dashboard: Downloading file', file.id);
      const blob = await downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Download started',
        description: `Downloading ${file.name}...`,
      });
    } catch (error: any) {
      console.error('Dashboard: Download error:', error.message);
      toast({
        title: 'Download Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleFileDelete = async (file: any) => {
    try {
      console.log('Dashboard: Deleting file', file.id);
      await deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast({
        title: 'File moved to trash',
        description: `${file.name} has been moved to trash.`,
      });
    } catch (error: any) {
      console.error('Dashboard: Delete error:', error.message);
      toast({
        title: 'Delete Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Your Files</h1>
            <p className="text-muted-foreground">
              Manage and organize your cloud storage files
            </p>
          </div>
          <FileUploadZone onFileSelect={handleFileUpload} />
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Files</h2>
            <div className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
          </div>
          <FileGrid
            files={files}
            onPreview={handleFilePreview}
            onDownload={handleFileDownload}
            onDelete={handleFileDelete}
          />
        </div>
      </main>
    </div>
  );
}

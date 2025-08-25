// src/components/FileUploadZone.tsx
import { Upload, Cloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFileSelect?: (files: FileList) => void;
}

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && onFileSelect) {
      console.log('FileUploadZone: Files dropped', e.dataTransfer.files);
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onFileSelect) {
      console.log('FileUploadZone: Files selected', e.target.files);
      onFileSelect(e.target.files);
    }
  };

  return (
    <Card
      className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-300 bg-gradient-card"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 rounded-full bg-cloud-blue-light p-4">
          <Cloud className="h-8 w-8 text-primary animate-float" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Drop files here</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Drag and drop your files here, or click to browse and select files from your device
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-4 w-4" />
            Choose Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Support for all file types • Max 100MB per file
        </p>
      </div>
      </Card>
  )}

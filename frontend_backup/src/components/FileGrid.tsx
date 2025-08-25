import { File, Image, Video, Music, Archive, FileText, MoreVertical, Download, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  thumbnail?: string;
}

interface FileGridProps {
  files: FileItem[];
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('zip') || type.includes('archive')) return Archive;
  if (type.includes('text') || type.includes('document')) return FileText;
  return File;
};

const getFileColor = (type: string) => {
  if (type.startsWith('image/')) return 'text-green-500';
  if (type.startsWith('video/')) return 'text-purple-500';
  if (type.startsWith('audio/')) return 'text-blue-500';
  if (type.includes('zip') || type.includes('archive')) return 'text-orange-500';
  if (type.includes('text') || type.includes('document')) return 'text-red-500';
  return 'text-muted-foreground';
};

export function FileGrid({ files, onPreview, onDownload, onDelete }: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <File className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No files yet</h3>
        <p className="text-muted-foreground">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => {
        const IconComponent = getFileIcon(file.type);
        const iconColor = getFileColor(file.type);
        
        return (
          <Card key={file.id} className="group hover:shadow-card transition-all duration-300 animate-fade-in">
            <div className="p-4">
              {/* File Preview/Icon */}
              <div className="aspect-square mb-3 rounded-lg bg-muted/50 flex items-center justify-center relative overflow-hidden">
                {file.thumbnail ? (
                  <img 
                    src={file.thumbnail} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconComponent className={`h-12 w-12 ${iconColor}`} />
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => onPreview?.(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDownload?.(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(file)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* File Info */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>{file.uploadDate}</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
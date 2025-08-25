import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FileGrid } from "@/components/FileGrid";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTrashFiles, restoreFile, emptyTrash, deleteFile, permanentDeleteFile } from "@/api/api";

export default function Trash() {
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [pendingDeletion, setPendingDeletion] = useState<Set<number>>(new Set()); 
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrash = async () => {
      try{
        const data = await getTrashFiles();
        setDeletedFiles(data); 
      } catch(error){
        toast({
          title: "Error",
          description: "File can't be fetched",
          variant: "destructive",
        });
      }
    };
    fetchTrash();
  }, []);

  const handleRestore = async (file: any) => {
  try {
    await restoreFile(file.id);
    setDeletedFiles(prev => prev.filter(f => f.id !== file.id));
    toast({
      title: "File restored",
      description: `${file.name} has been restored to your files.`,
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    if (error.message.includes('File not found')) {
      // File was already deleted, remove it from the UI
      setDeletedFiles(prev => prev.filter(f => f.id !== file.id));
      toast({
        title: "File already gone",
        description: `${file.name} was already permanently deleted.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Restoration Error",
        description: "File can't be restored",
        variant: "destructive",
      });
    }
  }
};

  const handlePermanentDelete = async (file: any) => {
    setPendingDeletion(prev => new Set(prev).add(file.id));
    try{
      await permanentDeleteFile(file.id);
      setDeletedFiles(prev => prev.filter(f => f.id !== file.id));
      setPendingDeletion(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      toast({
        title: "File permanently deleted",
        description: `${file.name} has been permanently deleted.`,
        variant: "destructive",
      });
    } catch(error){
      setPendingDeletion(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      toast({
        title: "Delete Failed",
        description: "file not deleted permanently",
        variant: "destructive",
      })
    }
  };

  const handleEmptyTrash = async () => {
    try{
      await emptyTrash();
      setDeletedFiles([]);
      toast({
        title: "Trash emptied",
        description: "All files have been permanently deleted.",
        variant: "destructive",
      });
    } catch(error){
      toast({
        title: "Empty trash failed",
        description: "Failed to empty trash",
        variant: "destructive",
      });
    }
  };

  const isFileBeingDeleted = (fileId: number) => pendingDeletion.has(fileId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Trash</h1>
              <p className="text-muted-foreground">
                Files in trash will be automatically deleted after 30 days
              </p>
            </div>
            
            {deletedFiles.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleEmptyTrash}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Empty Trash
              </Button>
            )}
          </div>
        </div>

        {deletedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Trash is empty</h3>
            <p className="text-muted-foreground">Deleted files will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Deleted Files</h2>
              <div className="text-sm text-muted-foreground">
                {deletedFiles.length} file{deletedFiles.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Custom FileGrid for trash with restore functionality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {deletedFiles.map((file) => (
                <div key={file.id} className="group">
                  <div className="p-4 border rounded-lg hover:shadow-card transition-all duration-300 bg-card">
                    <div className="aspect-square mb-3 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Trash2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{file.size}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{file.uploadDate}</p>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRestore(file)}
                          className="flex-1 gap-1"
                          disabled={isFileBeingDeleted(file.id)} 
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handlePermanentDelete(file)}
                          className="flex-1 gap-1"
                          disabled={isFileBeingDeleted(file.id)} 
                        >
                          {isFileBeingDeleted(file.id) ? (
                            "Deleting..."
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
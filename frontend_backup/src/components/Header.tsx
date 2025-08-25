import { Cloud, Files, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NavLink } from "react-router-dom";

interface HeaderProps {
  onFileSelect?: (files: FileList) => void;
}

export function Header({ onFileSelect }: HeaderProps) {

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onFileSelect) {
      console.log('HeaderZone: Files selected', e.target.files);
      onFileSelect(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <NavLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
              CloudStack
            </span>
          </NavLink>
          
          <nav className="flex items-center space-x-1">
            <NavLink to="/">
              {({ isActive }) => (
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  size="sm" 
                  className="gap-2"
                >
                  <Files className="h-4 w-4" />
                  Files
                </Button>
              )}
            </NavLink>
            <NavLink to="/trash">
              {({ isActive }) => (
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  size="sm" 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Trash
                </Button>
              )}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="default" size="sm" className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
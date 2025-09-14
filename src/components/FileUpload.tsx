import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onFileUpload, isProcessing }: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
    disabled: isProcessing,
  });

  return (
    <Card className="p-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
          "hover:border-primary hover:bg-accent/50",
          isDragActive && "border-primary bg-accent",
          isProcessing && "opacity-50 cursor-not-allowed",
          "border-border"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          {isProcessing ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-primary" />
          )}
          
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              {isProcessing ? "Processing your files..." : "Upload your credit card extracts"}
            </h3>
            <p className="text-foreground/70 font-medium">
              {isDragActive
                ? "Drop the files here"
                : "Drag & drop your files here, or click to select"}
            </p>
            <p className="text-sm text-foreground/60 font-medium">
              Supports CSV, XLS, XLSX, and TXT files (multiple files allowed)
            </p>
          </div>

          {!isProcessing && (
          <Button variant="default" className="mt-2">
            <FileText className="mr-2 h-4 w-4" />
            Select Files
          </Button>
          )}
        </div>
      </div>

      {acceptedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-success-light rounded-lg">
          <p className="text-sm text-success font-medium">
            {acceptedFiles.length === 1 
              ? `File selected: ${acceptedFiles[0].name}`
              : `${acceptedFiles.length} files selected: ${acceptedFiles.map(f => f.name).join(', ')}`
            }
          </p>
        </div>
      )}
    </Card>
  );
};
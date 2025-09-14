import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onFileUpload, isProcessing }: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
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
    maxFiles: 1,
    disabled: isProcessing,
  });

  return (
    <Card className="p-8">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          "hover:border-primary hover:bg-accent/50",
          isDragActive && "border-primary bg-accent",
          isProcessing && "opacity-50 cursor-not-allowed",
          "border-border"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : (
            <Upload className="h-12 w-12 text-primary" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isProcessing ? "Processing your file..." : "Upload your credit card extract"}
            </h3>
            <p className="text-muted-foreground">
              {isDragActive
                ? "Drop the file here"
                : "Drag & drop your file here, or click to select"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports CSV, XLS, XLSX, and TXT files
            </p>
          </div>

          {!isProcessing && (
            <Button variant="default" className="mt-2">
              <FileText className="mr-2 h-4 w-4" />
              Select File
            </Button>
          )}
        </div>
      </div>

      {acceptedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-success-light rounded-lg">
          <p className="text-sm text-success font-medium">
            File selected: {acceptedFiles[0].name}
          </p>
        </div>
      )}
    </Card>
  );
};
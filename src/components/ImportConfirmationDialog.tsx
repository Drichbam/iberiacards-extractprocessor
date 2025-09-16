import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImportConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  currentShopCount: number;
}

export function ImportConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  currentShopCount,
}: ImportConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace All Shop Entries?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to import <strong>{fileName}</strong>.
            </p>
            <p className="text-destructive font-medium">
              This will permanently delete all {currentShopCount} existing shop entries and replace them with the data from the CSV file.
            </p>
            <p>This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Replace All Entries
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
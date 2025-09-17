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
  importType?: 'shops' | 'categories';
}

export function ImportConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  currentShopCount,
  importType = 'shops',
}: ImportConfirmationDialogProps) {
  const isCategories = importType === 'categories';
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCategories ? 'Import Categories & Subcategories?' : 'Replace All Shop Entries?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to import <strong>{fileName}</strong>.
            </p>
            {isCategories ? (
              <p className="text-orange-600 font-medium">
                ⚠️ This will COMPLETELY REPLACE all existing categories and subcategories with {currentShopCount} new entries from the CSV file.
                All existing data will be permanently deleted. This action cannot be undone.
              </p>
            ) : (
              <>
                <p className="text-destructive font-medium">
                  This will permanently delete all {currentShopCount} existing shop entries and replace them with the data from the CSV file.
                </p>
                <p>This action cannot be undone.</p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={isCategories ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
          >
            {isCategories ? 'Replace All Data' : 'Replace All Entries'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
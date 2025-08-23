'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditListDialog({ open, onOpenChange }: EditListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Edit list</h2>
        </div>

        <div className="py-4">
          <p className="text-sm mb-6">
            Customize your list of fundraisers and organizations you'd like to support.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Manage list</h3>
              <p className="text-xs text-muted-foreground mb-4">
                You can add, hide, pin, and reorder links in your list.
              </p>

              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add links
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Pin</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Highlight a fundraiser or nonprofit by pinning it here.
              </p>

              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add pin
              </Button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

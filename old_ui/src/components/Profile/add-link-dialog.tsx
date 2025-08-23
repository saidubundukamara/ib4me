'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (url: string) => void;
}

export default function AddLinkDialog({ open, onOpenChange, onAddLink }: AddLinkDialogProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    if (url.trim()) {
      onAddLink(url.trim());
      setUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a GoFundMe link</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Visit a fundraiser or nonprofit page, copy the URL, and paste it below in order to pin
            it.
          </p>

          <div className="space-y-4">
            <Input
              placeholder="GoFundMe URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!url.trim()}>
                Add link
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

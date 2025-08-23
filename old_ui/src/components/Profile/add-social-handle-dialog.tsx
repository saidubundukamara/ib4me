'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddSocialHandleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  onSave: (platform: string, handle: string) => void;
}

export default function AddSocialHandleDialog({
  open,
  onOpenChange,
  platform,
  onSave,
}: AddSocialHandleDialogProps) {
  const [handle, setHandle] = useState('');

  const getPlatformDetails = () => {
    const platforms: Record<string, { name: string; icon: string }> = {
      instagram: { name: 'Instagram', icon: '📸' },
      tiktok: { name: 'TikTok', icon: '🎵' },
      x: { name: 'X', icon: '🐦' },
      facebook: { name: 'Facebook', icon: '👤' },
      linktree: { name: 'Linktree', icon: '🔗' },
      youtube: { name: 'YouTube', icon: '📺' },
      linkedin: { name: 'LinkedIn', icon: '💼' },
      twitch: { name: 'Twitch', icon: '🎮' },
    };

    return platforms[platform] || { name: platform, icon: '🔗' };
  };

  const platformDetails = getPlatformDetails();
  const baseUrl = `https://www.${platform}.com/`;

  const handleSubmit = () => {
    if (handle.trim()) {
      onSave(platform, handle.trim());
      setHandle('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>Add {platformDetails.name}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Username"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="mb-1"
              />
              <p className="text-xs text-muted-foreground">{baseUrl}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!handle.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

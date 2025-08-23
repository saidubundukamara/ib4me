'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditSocialHandlesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddHandle: (platform: string) => void;
}

export default function EditSocialHandlesDialog({
  open,
  onOpenChange,
  onAddHandle,
}: EditSocialHandlesDialogProps) {
  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: '📸' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'x', name: 'X', icon: '🐦' },
    { id: 'facebook', name: 'Facebook', icon: '👤' },
    { id: 'linktree', name: 'Linktree', icon: '🔗' },
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'twitch', name: 'Twitch', icon: '🎮' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit social handles</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enter usernames for the social media accounts you want to display on your profile.
          </p>

          <div className="space-y-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{platform.icon}</span>
                  <span>{platform.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => onAddHandle(platform.id)}>
                  Add
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

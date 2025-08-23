'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditCausesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCauses: string[];
  onSave: (causes: string[]) => void;
}

export default function EditCausesDialog({
  open,
  onOpenChange,
  selectedCauses,
  onSave,
}: EditCausesDialogProps) {
  const [selected, setSelected] = useState<string[]>(selectedCauses);

  const causes = [
    { id: 'animals', name: 'Animals', icon: '🐾' },
    { id: 'arts', name: 'Arts & Culture', icon: '🎨' },
    { id: 'community', name: 'Community', icon: '👥' },
    { id: 'crisis', name: 'Crisis relief', icon: '🆘' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'environment', name: 'Environment', icon: '🌱' },
    { id: 'faith', name: 'Faith', icon: '✝️' },
    { id: 'medical', name: 'Medical', icon: '⚕️' },
    { id: 'social', name: 'Social advocacy', icon: '✊' },
  ];

  const toggleCause = (causeName: string) => {
    if (selected.includes(causeName)) {
      setSelected(selected.filter((c) => c !== causeName));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, causeName]);
      }
    }
  };

  const handleSave = () => {
    onSave(selected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit top causes</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Pick 3 causes you care about to showcase on your profile.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {causes.map((cause) => (
              <div
                key={cause.id}
                className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-colors ${
                  selected.includes(cause.name)
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
                onClick={() => toggleCause(cause.name)}
              >
                <div className="text-2xl mb-2">{cause.icon}</div>
                <span className="text-xs text-center">{cause.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <span className="text-sm">{selected.length}/3 Selected</span>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

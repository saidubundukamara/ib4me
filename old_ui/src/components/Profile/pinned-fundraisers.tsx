import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PinnedFundraisersProps {
  pinnedFundraiser: { image?: string; title: string; description: string } | null;
  isOwnProfile: boolean;
  onAddPin: () => void;
}

export default function PinnedFundraisers({
  pinnedFundraiser,
  isOwnProfile,
  onAddPin,
}: PinnedFundraisersProps) {
  if (!pinnedFundraiser) {
    return (
      <div className="text-center mb-8">
        <div className="bg-[#F0F9EB] w-32 h-20 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">
          Highlight a fundraiser or nonprofit by pinning it here.
        </h3>

        {isOwnProfile && (
          <Button variant="outline" size="sm" onClick={onAddPin} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Add pin
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      <div className="bg-white border rounded-lg p-4 mb-4">
        <img
          src={pinnedFundraiser.image || '/placeholder.svg?height=100&width=200'}
          alt={pinnedFundraiser.title}
          width={200}
          height={100}
          className="rounded-md mx-auto mb-2"
        />
        <h3 className="text-sm font-medium">{pinnedFundraiser.title}</h3>
        <p className="text-xs text-muted-foreground">{pinnedFundraiser.description}</p>
      </div>

      {isOwnProfile && (
        <Button variant="outline" size="sm" onClick={onAddPin}>
          Change pin
        </Button>
      )}
    </div>
  );
}

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FundraiserLink {
  url: string;
  title: string;
  image: string;
}

interface FundraiserLinksProps {
  links: FundraiserLink[];
  isOwnProfile: boolean;
  onAddLinks: () => void;
}

export default function FundraiserLinks({ links, isOwnProfile, onAddLinks }: FundraiserLinksProps) {
  if (links.length === 0) {
    return (
      <div className="text-center">
        <div className="bg-white border rounded-lg p-4 mb-4 flex items-center justify-center h-20">
          <div className="w-3/4 h-2 bg-muted rounded-full"></div>
        </div>
        <h3 className="text-sm font-medium mb-1">
          Start adding fundraisers and nonprofits that matter to you.
        </h3>

        {isOwnProfile && (
          <Button variant="outline" size="sm" onClick={onAddLinks} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Add links
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="space-y-3">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border rounded-lg p-3 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                src={link.image || '/placeholder.svg?height=40&width=40'}
                alt={link.title}
                width={40}
                height={40}
                className="rounded-md"
              />
              <div>
                <h4 className="text-sm font-medium">{link.title}</h4>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {isOwnProfile && (
        <div className="text-center mt-4">
          <Button variant="outline" size="sm" onClick={onAddLinks}>
            <Plus className="h-4 w-4 mr-1" />
            Add more links
          </Button>
        </div>
      )}
    </div>
  );
}

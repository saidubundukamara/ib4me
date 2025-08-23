interface CausesBadgesProps {
  causes: string[];
}

export default function CausesBadges({ causes }: CausesBadgesProps) {
  // If no causes, show placeholder
  if (causes.length === 0) {
    return (
      <div className="flex justify-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[#F0F9EB]"></div>
        <div className="w-12 h-12 rounded-full bg-[#E8F5E9]"></div>
        <div className="w-12 h-12 rounded-full bg-[#E0F2F1]"></div>
      </div>
    );
  }

  // Map cause names to colors and icons
  const causeColors: Record<string, string> = {
    Animals: '#F0F9EB',
    'Arts & Culture': '#E8F5E9',
    Community: '#E0F2F1',
    'Crisis relief': '#E0F7FA',
    Education: '#E1F5FE',
    Environment: '#E3F2FD',
    Faith: '#EDE7F6',
    Medical: '#F3E5F5',
    'Social advocacy': '#FCE4EC',
  };

  return (
    <div className="flex justify-center gap-2">
      {causes.map((cause, index) => (
        <div
          key={index}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: causeColors[cause] || '#F0F9EB' }}
        >
          {getCauseIcon(cause)}
        </div>
      ))}
    </div>
  );
}

function getCauseIcon(cause: string) {
  // In a real app, you would have proper SVG icons for each cause
  // For this example, we'll use simple text abbreviations
  const abbreviations: Record<string, string> = {
    Animals: '🐾',
    'Arts & Culture': '🎨',
    Community: '👥',
    'Crisis relief': '🆘',
    Education: '📚',
    Environment: '🌱',
    Faith: '✝️',
    Medical: '⚕️',
    'Social advocacy': '✊',
  };

  return abbreviations[cause] || '•';
}

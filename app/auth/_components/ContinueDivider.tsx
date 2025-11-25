type ContinueDividerProps = {
  label: string;
};

export function ContinueDivider({ label }: ContinueDividerProps) {
  return (
    <div className="relative my-6 flex items-center gap-4 text-xs font-medium text-muted-foreground sm:my-8 sm:text-sm">
      <span className="h-px flex-1 bg-border" />
      <span className="whitespace-nowrap rounded-full bg-card px-4 py-1 text-center text-xs shadow-sm sm:px-6 sm:text-sm">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

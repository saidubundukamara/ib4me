type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 rounded-full bg-gray-200 overflow-hidden ${className}`}>
      <div
        className={`h-full ${safe < 100 ? "animate-progress" : ""}`}
        style={{
          width: `${safe}%`,
          background: `linear-gradient(to right, var(--color-primary), var(--color-chartereuse-dark))`,
        }}
      />
    </div>
  );
}

export default ProgressBar;

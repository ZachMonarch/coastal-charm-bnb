interface BidAmountDisplayProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BidAmountDisplay({ amount, currency = 'USD', size = 'md' }: BidAmountDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span className={`font-semibold text-primary ${sizeClasses[size]}`}>
      {formatted}
    </span>
  );
}

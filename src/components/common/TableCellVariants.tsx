import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle, Clock } from 'lucide-react';

// Компонент для відображення статусу
interface StatusCellProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | string;
  label?: string;
}

export const StatusCell: React.FC<StatusCellProps> = ({ status, label }) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800 border-green-200', icon: <Check className="w-3 h-3" /> },
    inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <X className="w-3 h-3" /> },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-3 h-3" /> },
    error: { color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

  return (
    <Badge variant="secondary" className={cn(config.color, 'flex items-center gap-1 w-fit')}>
      {config.icon}
      {label || status}
    </Badge>
  );
};

// Компонент для відображення дати
interface DateCellProps {
  date: string | Date | null | undefined;
  format?: 'short' | 'long' | 'datetime';
  fallback?: string;
}

export const DateCell: React.FC<DateCellProps> = ({ date, format = 'short', fallback = '—' }) => {
  if (!date) return <span className="text-muted-foreground">{fallback}</span>;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    datetime: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return (
    <span className="whitespace-nowrap">
      {dateObj.toLocaleDateString('uk-UA', formatOptions[format])}
    </span>
  );
};

// Компонент для відображення посилання
interface LinkCellProps {
  href: string;
  label?: string;
  external?: boolean;
  truncate?: boolean;
  maxLength?: number;
}

export const LinkCell: React.FC<LinkCellProps> = ({
  href,
  label,
  external = true,
  truncate = false,
  maxLength = 50,
}) => {
  const displayText = label || href;
  const truncatedText = truncate && displayText.length > maxLength
    ? `${displayText.substring(0, maxLength)}...`
    : displayText;

  return (
    <a
      href={href}
      className="text-primary underline hover:text-primary/80 break-all"
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      {truncatedText}
    </a>
  );
};

// Компонент для відображення числових значень
interface NumberCellProps {
  value: number | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fallback?: string;
  className?: string;
}

export const NumberCell: React.FC<NumberCellProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  fallback = '—',
  className,
}) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">{fallback}</span>;
  }

  const formatted = value.toFixed(decimals);

  return (
    <span className={cn('font-medium', className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

// Компонент для відображення списку тегів
interface TagsCellProps {
  tags: string[];
  maxVisible?: number;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
}

export const TagsCell: React.FC<TagsCellProps> = ({
  tags,
  maxVisible = 3,
  colorScheme = 'blue',
}) => {
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className={cn('text-xs', colorClasses[colorScheme])}
        >
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

// Компонент для відображення тексту з обмеженням довжини
interface TruncatedCellProps {
  text: string | null | undefined;
  maxLength?: number;
  fallback?: string;
  showTooltip?: boolean;
}

export const TruncatedCell: React.FC<TruncatedCellProps> = ({
  text,
  maxLength = 100,
  fallback = '—',
  showTooltip = true,
}) => {
  if (!text) return <span className="text-muted-foreground">{fallback}</span>;

  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? `${text.substring(0, maxLength)}...` : text;

  return (
    <span
      className="block max-w-[300px]"
      title={showTooltip && isTruncated ? text : undefined}
    >
      {displayText}
    </span>
  );
};

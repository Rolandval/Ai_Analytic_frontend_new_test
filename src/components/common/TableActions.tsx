import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Eye, MoreHorizontal, Play, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

interface TableActionsProps {
  actions?: Action[];
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  compact?: boolean;
  showMore?: boolean;
}

export const TableActions: React.FC<TableActionsProps> = ({
  actions,
  onEdit,
  onDelete,
  onView,
  compact = false,
  showMore = false,
}) => {
  const defaultActions: Action[] = [];

  if (onView) {
    defaultActions.push({
      label: 'Переглянути',
      icon: <Eye className="w-4 h-4" />,
      onClick: onView,
      variant: 'ghost',
    });
  }

  if (onEdit) {
    defaultActions.push({
      label: 'Редагувати',
      icon: <Edit className="w-4 h-4" />,
      onClick: onEdit,
      variant: 'outline',
    });
  }

  if (onDelete) {
    defaultActions.push({
      label: 'Видалити',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  const allActions = [...defaultActions, ...(actions || [])];

  if (allActions.length === 0) {
    return null;
  }

  // Якщо дуже багато дій або потрібен компактний вигляд
  if (showMore || allActions.length > 3) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allActions.map((action, index) => (
            <React.Fragment key={index}>
              {action.variant === 'destructive' && index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                disabled={action.disabled || action.loading}
                className={action.variant === 'destructive' ? 'text-destructive' : ''}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Звичайний вигляд з кнопками
  return (
    <div className="flex items-center gap-2">
      {allActions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outline'}
          size={compact ? 'sm' : 'default'}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          disabled={action.disabled || action.loading}
          className={compact ? 'h-8 px-2' : ''}
        >
          {action.icon && <span className={action.label ? 'mr-2' : ''}>{action.icon}</span>}
          {!compact && action.label}
        </Button>
      ))}
    </div>
  );
};

// Предефінов іконки для різних типів дій
export const ActionIcons = {
  Edit: <Edit className="w-4 h-4" />,
  Delete: <Trash2 className="w-4 h-4" />,
  View: <Eye className="w-4 h-4" />,
  Run: <Play className="w-4 h-4" />,
  Download: <Download className="w-4 h-4" />,
};

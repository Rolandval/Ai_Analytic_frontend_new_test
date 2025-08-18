import React, { useState } from 'react';
import { Button } from './Button';
import { Zap, Loader2 } from 'lucide-react';
import { UploadTask } from '@/types/task';

interface LightningButtonProps {
  task: UploadTask;
  onStart: (taskId: number) => void;
  isRunning: boolean;
  disabled?: boolean;
}

const LightningButton: React.FC<LightningButtonProps> = ({
  task,
  onStart,
  isRunning,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!isRunning && !disabled) {
      onStart(task.id);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isRunning}
      className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 hover:text-yellow-800"
      title="Швидкий запуск через WebSocket"
    >
      {isRunning ? (
        <Loader2 className="animate-spin w-4 h-4" />
      ) : (
        <Zap className="w-4 h-4" />
      )}
      {isRunning ? 'Виконується...' : 'Швидкий запуск'}
    </Button>
  );
};

export default LightningButton;

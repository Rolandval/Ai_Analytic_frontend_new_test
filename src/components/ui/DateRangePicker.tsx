import React, { useState, useRef, useEffect } from 'react';
import { DateRangePicker as ReactDateRangePicker } from 'react-date-range';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
  placeholder?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = "Оберіть діапазон дат",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    key: 'selection'
  });
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSelection({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      key: 'selection'
    });
  }, [startDate, endDate]);

  const handleSelect = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setSelection(ranges.selection);
    
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
    
    onChange(startDateStr, endDateStr);
  };

  const getDisplayText = () => {
    if (selection.startDate && selection.endDate) {
      return `${format(selection.startDate, 'dd.MM.yyyy', { locale: uk })} - ${format(selection.endDate, 'dd.MM.yyyy', { locale: uk })}`;
    } else if (selection.startDate) {
      return `${format(selection.startDate, 'dd.MM.yyyy', { locale: uk })} - ...`;
    }
    return placeholder;
  };

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection({
      startDate: undefined,
      endDate: undefined,
      key: 'selection'
    });
    onChange(undefined, undefined);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className="h-8 px-3 py-1 text-sm border border-gray-300 rounded-md cursor-pointer bg-white flex items-center justify-between hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selection.startDate ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          {(selection.startDate || selection.endDate) && (
            <button
              onClick={clearDates}
              className="text-gray-400 hover:text-gray-600 text-xs"
              title="Очистити"
            >
              ✕
            </button>
          )}
          <span className="text-gray-400 text-xs">📅</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-w-[95vw] overflow-hidden">
          <ReactDateRangePicker
            ranges={[selection]}
            onChange={handleSelect}
            locale={uk}
            showSelectionPreview={true}
            showDateDisplay={false}
            months={2}
            direction="horizontal"
            rangeColors={['#3b82f6']}
            className="border-0"
          />
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BatteryListRequest } from '@/types/battery';

interface BatteryFiltersProps {
  initialFilters: Omit<BatteryListRequest, 'page' | 'page_size'>;
  onFilterChange: (filters: Omit<BatteryListRequest, 'page' | 'page_size'>) => void;
}

export const BatteryFilters: React.FC<BatteryFiltersProps> = ({ initialFilters, onFilterChange }) => {
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = { full_name: '', volume_min: undefined, volume_max: undefined };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          name="full_name"
          placeholder="Назва акумулятора..."
          value={filters.full_name || ''}
          onChange={handleChange}
        />
        <Input
          name="volume_min"
          type="number"
          placeholder="Об'єм (від)"
          value={filters.volume_min || ''}
          onChange={handleChange}
        />
        <Input
          name="volume_max"
          type="number"
          placeholder="Об'єм (до)"
          value={filters.volume_max || ''}
          onChange={handleChange}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={handleReset}>Скинути</Button>
        <Button onClick={handleApply}>Застосувати</Button>
      </div>
    </div>
  );
};

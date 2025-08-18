import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { InverterListRequest } from '@/types/inverter';

interface InverterFiltersProps {
  initialFilters: Omit<InverterListRequest, 'page' | 'page_size'>;
  onFilterChange: (filters: Omit<InverterListRequest, 'page' | 'page_size'>) => void;
}

export const InverterFilters: React.FC<InverterFiltersProps> = ({ initialFilters, onFilterChange }) => {
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value ? Number(value) : undefined }));
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = { full_name: '', power_w_min: undefined, power_w_max: undefined };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          name="full_name"
          placeholder="Назва інвертора..."
          value={filters.full_name || ''}
          onChange={handleNameChange}
        />
        <Input
          name="power_w_min"
          type="number"
          placeholder="Потужність (від, Вт)"
          value={filters.power_w_min || ''}
          onChange={handleChange}
        />
        <Input
          name="power_w_max"
          type="number"
          placeholder="Потужність (до, Вт)"
          value={filters.power_w_max || ''}
          onChange={handleChange}
        />
        <Input
          name="phases"
          type="number"
          placeholder="Кількість фаз"
          value={filters.phases || ''}
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

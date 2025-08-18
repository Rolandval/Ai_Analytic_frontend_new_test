import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SolarPanelListRequest } from '@/types/solarPanel';

interface SolarPanelFiltersProps {
  initialFilters: Omit<SolarPanelListRequest, 'page' | 'page_size'>;
  onFilterChange: (filters: Omit<SolarPanelListRequest, 'page' | 'page_size'>) => void;
}

export const SolarPanelFilters: React.FC<SolarPanelFiltersProps> = ({ initialFilters, onFilterChange }) => {
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
        const resetFilters = { full_name: '', power_min: undefined, power_max: undefined };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          name="full_name"
          placeholder="Назва панелі..."
          value={filters.full_name || ''}
          onChange={handleNameChange}
        />
        <Input
          name="power_min"
          type="number"
          placeholder="Потужність (від, Вт)"
          value={filters.power_min || ''}
          onChange={handleChange}
        />
        <Input
          name="power_max"
          type="number"
          placeholder="Потужність (до, Вт)"
          value={filters.power_max || ''}
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

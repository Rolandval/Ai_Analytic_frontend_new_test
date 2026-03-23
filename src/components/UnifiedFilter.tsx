import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select, SelectItem } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/Button';

interface FilterProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  filterOptions: {
    regions: string[];
    polarities: string[];
    electrolytes: string[];
    brands: string[];
  };
}

const UnifiedFilter: React.FC<FilterProps> = ({ filters, onFilterChange, filterOptions }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLocalFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name: string, value: string[]) => {
    setLocalFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  return (
    <div className="filter-container">
      <Input
        name="full_name"
        placeholder="Full Name"
        value={localFilters.full_name || ''}
        onChange={handleInputChange}
      />
      <Select
        name="region"
        value={localFilters.region || ''}
        onValueChange={value => handleSelectChange('region', value)}
      >
        {filterOptions.regions.map(region => (
          <SelectItem key={region} value={region}>{region}</SelectItem>
        ))}
      </Select>
      <Select
        name="polarity"
        value={localFilters.polarity || ''}
        onValueChange={value => handleSelectChange('polarity', value)}
      >
        {filterOptions.polarities.map(polarity => (
          <SelectItem key={polarity} value={polarity}>{polarity}</SelectItem>
        ))}
      </Select>
      <MultiSelect
        options={filterOptions.electrolytes.map(v => ({ value: v, label: v }))}
        onValueChange={(value: string[]) => handleMultiSelectChange('electrolyte', value)}
      />
      <MultiSelect
        options={filterOptions.brands.map(v => ({ value: v, label: v }))}
        onValueChange={(value: string[]) => handleMultiSelectChange('brands', value)}
      />
      <Button onClick={applyFilters}>Apply Filters</Button>
    </div>
  );
};

export default UnifiedFilter;

const fs = require('fs');
const path = 'src/types/solarPanel.ts';

let content = fs.readFileSync(path, 'utf8');

const oldInterface = `export interface SolarPanelPriceSchema {
  id: number;
  full_name: string;
  brand: string;
  supplier: string;
  supplier_status: SupplierStatusEnum;
  supplier_cities?: string[] | null;
  price: number;
  date: string;
}`;

const newInterface = `export interface SolarPanelPriceSchema {
  id: number;
  full_name: string;
  brand: string;
  supplier: string;
  supplier_status: SupplierStatusEnum;
  supplier_cities?: string[] | null;
  price: number;
  date: string;
  datasheet_url?: string | null;
  power?: number | null;
  panel_type?: string | null;
  cell_type?: string | null;
  panel_color?: string | null;
  frame_color?: string | null;
  supplier_url?: string | null;
  supplier_contact?: string | null;
  price_per_w?: number | null;
  panel_id?: number | null;
  cells_count?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  impp?: number | null;
}`;

content = content.replace(oldInterface, newInterface);
fs.writeFileSync(path, content, 'utf8');
console.log('Updated solarPanel.ts');

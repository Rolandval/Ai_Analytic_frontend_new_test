// Define the Extension interface to match backend API
export interface Extension {
  id: number;
  table_name: string;
  db_name: string;
  descriptions: string; // Changed from description to descriptions to match backend
}

// Create extension request payload
export interface CreateExtensionDto {
  table_name: string;
  db_name: string;
  descriptions: string; // Changed from description to descriptions to match backend
}

// Update extension request payload
export interface UpdateExtensionDto {
  id: number;
  table_name?: string;
  db_name?: string;
  descriptions?: string; // Changed from description to descriptions to match backend
}

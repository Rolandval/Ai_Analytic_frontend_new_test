// Task related enums coming from backend
export enum UploadTasksIntervalEnum {
  DAILY = 'daily', // щодня
  EOD = 'eod', // через день (every other day)
  I2D = 'i2d', // раз на 2 дні
}

export enum ProductTypeEnum {
  BATTERIES = 'batteries',
  SOLAR_PANELS = 'solar_panels',
  INVERTERS = 'inverters',
}

export enum TaskTypeEnum {
  COMPETITORS = 'competitors',
  SUPPLIERS = 'suppliers',
}

// --- NEW SCHEMA ---
export interface UploadTask {
  id: number;
  name: string;
  interval: UploadTasksIntervalEnum;
  start_time: string; // ISO string from backend
  product_type: ProductTypeEnum;
  is_active: boolean;
  task_type: TaskTypeEnum;
  last_run: string | null;
}

export interface PaginatedUploadTasksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UploadTask[];
}

// --- LEGACY COMPATIBILITY ---
// Temporary aliases to keep older code compiling until fully migrated
export type Task = UploadTask;
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}
export type PaginatedTasksResponse = PaginatedUploadTasksResponse;

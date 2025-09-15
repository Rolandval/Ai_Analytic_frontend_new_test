import axios from 'axios';

// Base URL proxied by Vite to backend
// Endpoints example provided assume baseUrl, we'll use "/content" per existing proxy in vite.config.ts
const BASE = '/content';

// Use lowercase sql types in payloads as per UI and requested JSON
export type SqlType = 'postgresql' | 'mysql' | 'mssql' | 'sqlite';

export interface DatabaseItem {
  id: number;
  name: string;
  // Backend may return either capitalized (e.g., 'Postgres') or lowercase (e.g., 'postgres').
  // We'll type it broadly here, UI will normalize when needed.
  sql_type: SqlType | 'Postgres' | 'MySQL' | 'MSSQL';
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export async function getDatabases() {
  const { data } = await axios.get<DatabaseItem[]>(`${BASE}/get_databases`);
  return data;
}

export interface CreateDatabasePayload {
  name: string;
  sql_type: SqlType; // lowercase
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export async function createDatabase(payload: CreateDatabasePayload) {
  const { data } = await axios.post<DatabaseItem>(`${BASE}/create_database`, payload);
  return data;
}

export interface UpdateDatabasePayload extends CreateDatabasePayload {
  id: number;
}

export async function updateDatabase(payload: UpdateDatabasePayload) {
  const { data } = await axios.post<DatabaseItem>(`${BASE}/update_database`, payload);
  return data;
}

export async function deleteDatabase(id: number) {
  const { data } = await axios.delete<{ success: boolean }>(`${BASE}/delete_database/${id}`);
  return data;
}

export async function checkDatabaseConnection(id: number) {
  const { data } = await axios.get<{ ok: boolean; message?: string } | null>(
    `${BASE}/check_database_connection/${id}`
  );
  // Some backends may return 200 with empty body; normalize it
  if (!data) {
    return { ok: false, message: 'Сервер повернув порожню відповідь' };
  }
  return data;
}

// Extentions (table descriptions)
export interface CreateExtentionPayload {
  table_name: string;
  db_name: string;
  descriptions: string;
}

export async function createExtention(payload: CreateExtentionPayload) {
  const { data } = await axios.post(`${BASE}/extentions/create`, payload);
  return data;
}

export interface UpdateExtentionPayload {
  id: number;
  descriptions: string;
}

export async function updateExtention(payload: UpdateExtentionPayload) {
  const { data } = await axios.patch(`${BASE}/extentions/update`, payload);
  return data;
}

export async function deleteExtention(id: number) {
  const { data } = await axios.delete(`${BASE}/extentions/delete/${id}`);
  return data;
}

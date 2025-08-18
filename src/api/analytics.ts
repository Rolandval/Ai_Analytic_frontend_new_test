import axios from 'axios';
import { GenerateCSVRequest, ProductType, SQLQuery, SQLQueryCreateRequest, CSVDataItem } from '../types/forecasting';

// Endpoint для роботи з SQL запитами
export const getSqlQueries = async (productType?: ProductType): Promise<SQLQuery[]> => {
  const params = productType ? { product_type: productType } : {};
  const response = await axios.get('/analytics/sql-queries', { params });
  return response.data;
};

export const getSqlQuery = async (queryId: number): Promise<SQLQuery> => {
  const response = await axios.get(`/analytics/sql-queries/${queryId}`);
  return response.data;
};

export const createSqlQuery = async (data: SQLQueryCreateRequest): Promise<SQLQuery> => {
  const response = await axios.post('/analytics/sql-queries', data);
  return response.data;
};

export const updateSqlQuery = async (queryId: number, data: SQLQueryCreateRequest): Promise<SQLQuery> => {
  const response = await axios.put(`/analytics/sql-queries/${queryId}`, data);
  return response.data;
};

export const deleteSqlQuery = async (queryId: number): Promise<void> => {
  await axios.delete(`/analytics/sql-queries/${queryId}`);
};

// Endpoint для генерації CSV даних
export const generateCsv = async (data: GenerateCSVRequest): Promise<CSVDataItem[]> => {
  const response = await axios.post('/analytics/generate_csv', data);
  return response.data;
};

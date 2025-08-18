import api from './api';

export const getInverterCompetitorsAnalytic = async (comment?: string): Promise<string> => {
  const response = await api.get('/inverters/analytics/competitors-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

export const getInverterSuppliersAnalytic = async (comment?: string): Promise<string> => {
  const response = await api.get('/inverters/analytics/suppliers-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

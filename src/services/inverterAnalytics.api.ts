import analyticsApi from './analyticsApi';

export const getInverterCompetitorsAnalytic = async (comment?: string): Promise<string> => {
  const response = await analyticsApi.get('/inverters/analytics/competitors-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

export const getInverterSuppliersAnalytic = async (comment?: string): Promise<string> => {
  const response = await analyticsApi.get('/inverters/analytics/suppliers-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

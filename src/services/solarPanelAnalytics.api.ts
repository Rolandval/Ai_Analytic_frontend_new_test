import analyticsApi from './analyticsApi';

export const getSolarPanelCompetitorsAnalytic = async (comment?: string): Promise<string> => {
  const response = await analyticsApi.get('/solar-panels/analytics/competitors-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

export const getSolarPanelSuppliersAnalytic = async (comment?: string): Promise<string> => {
  const response = await analyticsApi.get('/solar-panels/analytics/suppliers-analytic', {
    params: comment ? { comment } : undefined,
  });
  return response.data;
};

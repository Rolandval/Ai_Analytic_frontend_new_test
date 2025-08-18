import axios from 'axios';

export const getLostSolarPanels = async (page: number, pageSize: number) => {
  try {
    const response = await axios.get(`/api/solar-panels/lost`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching lost solar panels:', error);
    throw error;
  }
};

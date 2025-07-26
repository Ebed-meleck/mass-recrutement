import axios from 'axios';

export const getFromTest = async () => {
  const response = await axios.get('/api/submissions');
  return response.data;
};

export const getStat = async (dashId: number) => {
  const response = await axios.get(`/api/stats/${dashId}`);
  return response.data;
};
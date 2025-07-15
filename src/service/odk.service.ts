import axios from 'axios';

export const getFromTest = async () => {
  const url = `http://localhost:8092/api/submissions`;

  const response = await axios.get(url);
  return response.data;
};
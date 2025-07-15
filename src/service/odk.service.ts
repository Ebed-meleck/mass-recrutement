import axios from 'axios';

export const getFromTest = async () => {
  const url = `https://odk.ebedmeleck.com/api/submissions`;

  const response = await axios.get(url);
  return response.data;
};
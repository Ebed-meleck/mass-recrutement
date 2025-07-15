import axios from 'axios';

const formId = 'fm_gc7_eq_form_test_sup_independant.svc';
const projectId = 3;

const odkUrl = `https://central.ima-data.com/v1/projects/${projectId}/forms/${formId}/Submissions`;

const odkUser = 'emakoso@corusinternational.org';
const odkPass = 'Makoso@720';

export const getSubmission = async () => {
  const response = await axios.get(odkUrl, {
    auth: {
      username: odkUser,
      password: odkPass
    }
  });
  return response.data?.value;
};
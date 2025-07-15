/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/submissions.ts
import type { NextApiRequest, NextApiResponse } from 'next'
// Adaptation pour Next.js app router (app/api)

type Submission = {
  instanceId: string;
  submitterId: number;
  submittedAt: string;
  updatedAt: string;
  reviewState: string | null;
  data: Record<string, any>;
  [key: string]: any;
};



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const formId = 'fm_gc7_eq_form_test_sup_independant';
  const projectId = 3;

  const odkUrl = `https://central.ima-data.com/v1/projects/${projectId}/forms/${formId}/draft/submissions.json?splitSelectMultiples=false&groupPaths=true&deletedFields=false`;

  const odkUser = 'emakoso@corusinternational.org';
  const odkPass = 'Makoso@720';

  if (!odkUser || !odkPass) {
    return res.status(500).json({ error: 'credential error' });
  }

  const auth = Buffer.from(`${odkUser}:${odkPass}`).toString('base64');

  try {
    const response = await fetch(odkUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'ODK Central error', details: text });
    }

    const data: Submission[] = await response.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

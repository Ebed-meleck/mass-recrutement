import { getSubmission } from "../lib/odkData";

export const listSubmission = async (req, res, next) => {
  try {
    const data = await getSubmission();
    return res.json(data);
  } catch (error) {
    console.log(error);
    next(error);
  }
}
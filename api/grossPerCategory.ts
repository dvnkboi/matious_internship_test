import { getGrossPerCategory } from "../src/helpers/salesDataHelpers";

export default async function handler(request: any, response: any) {
  try {
    response.status(200).json(await getGrossPerCategory());
  }
  catch (err) {
    response.status(500).send({
      err: err
    });
  }
}
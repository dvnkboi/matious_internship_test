import { getSalesPerClientType } from "../src/helpers/salesDataHelpers";

export default async function handler(request: any, response: any) {
  try {
    response.status(200).json(await getSalesPerClientType());
  }
  catch (err) {
    response.status(500).send({
      err: err
    });
  }
}
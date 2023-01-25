import { getRatingPerSex } from "../src/helpers/salesDataHelpers";
import allowCors from "../src/helpers/allowcors";


const handler = async (request: any, response: any) => {
  try {
    response.status(200).json(await getRatingPerSex());
  }
  catch (err) {
    response.status(500).send({
      err: err
    });
  }
};

export default allowCors(handler);
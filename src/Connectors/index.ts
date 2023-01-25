import { MongoDriver } from "./MongoRealm";
import * as dfd from "danfojs-node";

const mongoRealm = new MongoDriver();

export const getData = async (path: string = "./src/data/supermarket_sales - Sheet1.csv") => {
  const df = await dfd.readCSV(path);
  return dfd.toJSON(df);
};

export const migrate = async (data: any) => {
  await mongoRealm.deleteAll("supermarket_sales");
  await mongoRealm.insert("supermarket_sales", data, false);
};

export const getDriver = () => {
  return mongoRealm;
};
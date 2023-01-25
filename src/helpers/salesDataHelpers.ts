import { getDriver } from '../Connectors';
import { MongoDriver } from '../Connectors/MongoRealm';

let driver: MongoDriver = getDriver();


export const getGrossPerCategory = async () => {
  const data = await driver.get("supermarket_sales", {}, { "gross income": -1 }, Infinity);
  const prodLineGrossVolume: { [key: string]: number; } = {};
  for (const row of data) {
    if (!prodLineGrossVolume[row["Product line"]]) prodLineGrossVolume[row["Product line"]] = 0;
    prodLineGrossVolume[row["Product line"]] += row["gross income"];
  };

  const result = [];
  for (const row of Object.keys(prodLineGrossVolume)) {
    result.push({
      name: row,
      value: prodLineGrossVolume[row]
    });
  };

  return result;
};

export const getSalesPerClientType = async () => {
  const data: any = await driver.get("supermarket_sales", {}, { "gross income": -1 }, Infinity);
  const clientTypeGrossVolume: any = {
    Member: {
      Male: 0,
      Female: 0
    },
    Normal: {
      Male: 0,
      Female: 0
    },
  };
  for (const row of data) {
    clientTypeGrossVolume[row["Customer type"]][row["Gender"]] += row["gross income"];
  }

  const result = [];

  // transform to datapoints
  for (const clientType of Object.keys(clientTypeGrossVolume)) {
    for (const gender of Object.keys(clientTypeGrossVolume[clientType])) {
      result.push({
        name: clientType,
        gender,
        value: clientTypeGrossVolume[clientType][gender]
      });
    }
  }

  return result;
};

export const getRatingPerSex = async () => {
  const data = await driver.get("supermarket_sales", {}, null, Infinity);
  const ratingPerSex: any = {
    Male: 0,
    Female: 0
  };
  const counters: any = {
    Male: 0,
    Female: 0
  };
  for (const row of data) {
    ratingPerSex[row["Gender"]] += row["Rating"];
    counters[row["Gender"]]++;
  }
  for (const gender of Object.keys(ratingPerSex)) ratingPerSex[gender] /= counters[gender];

  const result = [];
  for (const row of Object.keys(ratingPerSex)) {
    result.push({
      name: row,
      value: ratingPerSex[row]
    });
  };
  return result;
};
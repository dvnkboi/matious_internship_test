import { config } from 'dotenv';
config();
import Realm from 'realm';
import assert from 'assert';
import EventEmitter from 'events';


export class MongoDriver {

  public connected = false;
  private realmApp: globalThis.Realm.App = null;
  private client: Realm.Services.MongoDB;
  private _collections: { [key: string]: Realm.Services.MongoDB.MongoDBCollection<any>; } = {};
  private _watchers: { [key: string]: number; } = {};
  private _events = new EventEmitter();
  private user: Realm.User<Realm.DefaultFunctionsFactory, SimpleObject, Realm.DefaultUserProfileData> = null;
  private schemaObj: { [key: string]: Realm.ObjectSchema; } = {};


  constructor () {
    this.realmApp = new Realm.App({ id: process.env.MONGO_REALM_APP_ID });
  }

  // stuff for new realm 
  public createSchema(schemaName: string, schema: Realm.ObjectSchema) {
    this.schemaObj[schemaName] = schema;
  }

  public openSchema(schema: string) {
    if (this.schemaObj[schema]) return Realm.open({
      schema: [this.schemaObj[schema]],
      sync: {
        user: this.user,
        partitionValue: schema
      }
    });
  }
  // end stuff for new realm

  async connect() {
    const credentials = Realm.Credentials.apiKey(process.env.MONGO_REALM_API_KEY);
    try {
      this.user = await this.realmApp.logIn(credentials);
      assert(this.user.id === this.realmApp.currentUser.id);
      this.client = this.realmApp.currentUser.mongoClient(process.env.MONGO_REALM_SERVICE_NAME);
      this.connected = true;
      // console.log('connected to db');
    } catch (e) {
      console.error('Failed to log in', e);
      this.connected = false;
    }
  }

  async init(collectionName: string) {
    if (!this.connected) await this.connect();
    if (!this._collections[collectionName]) this._collections[collectionName] = this.client.db(process.env.MONGO_REALM_DB_NAME).collection(collectionName);
    // console.log(col, 'connected');
    return this._collections[collectionName];
  }

  /**
   *
   * @param {string} collectionName - collection to query
   * @param {Object} filterObject - (optional) filter object example: {pid: x, title: y}
   * @param {string} sort - (optional) sort object example: {pid: 1} to sort pid asc or {pid: -1} for desc, can also be multiple keys
   * @param {integer} limit  - (optional) number of elements to get
   * @param {object} last - (optional) the last object to start after
   * @returns array of elements that match query
   */
  async get(collectionName: string, filterObject?: { [key: string]: any; }, sortObject?: { [key: string]: number; }, limit: number = 100, last?: any) {
    if (!this._collections[collectionName]) await this.init(collectionName);
    if (filterObject)
      for (let f of Object.keys(filterObject)) {
        if (typeof filterObject[f] == 'string') filterObject[f] = { $regex: filterObject[f], $options: 'i' };
      }

    if (last) {
      if (sortObject) {
        for (const key of Object.keys(sortObject)) {
          if (Object.keys(filterObject).includes(key)) {
            if (sortObject[key] == 1) {
              filterObject[key]['$gt'] = last[key];
            } else {
              filterObject[key]['$lt'] = last[key];
            }
          } else {
            sortObject[key] == 1 ? (filterObject[key] = { $gt: last[key] }) : (filterObject[key] = { $lt: last[key] });
          }
        }
      } else {
        filterObject['_id'] = { $gt: last['_id'] };
      }
    }

    const options: { [key: string]: any; } = {};
    if (sortObject) options['sort'] = sortObject;
    if (limit != Infinity) options['limit'] = limit;

    return await this._collections[collectionName].find(filterObject, options);
  }

  /**
   *
   * @param {string} collectionName - collection to insert one item into
   * @param {Object} data - data to insert
   * @returns null
   */
  async insert(collectionName: string, data: any, one: boolean = true) {
    if (!this._collections[collectionName]) await this.init(collectionName);
    if (one) return await this._collections[collectionName].insertOne(data);
    else return await this._collections[collectionName].insertMany(data);
  }

  /**
   *
   * @param {string} collectionName - collection to update one item in
   * @param {Object} filter - filter object example: {pid: x, title: y}
   * @param {Object} data - data to update
   * @returns null
   */
  async update(collectionName: string, filter: { [key: string]: any; }, data: any) {
    if (!this._collections[collectionName]) await this.init(collectionName);
    await this._collections[collectionName].updateOne(filter, { $set: data });
  }

  /**
   *
   * @param {string} collectionName - collection to delete one item from
   * @param {Object} filter - filter object example: {pid: x, title: y}
   * @returns null
   */
  async delete(collectionName: string, filter: { [key: string]: any; }) {
    if (!this._collections[collectionName]) await this.init(collectionName);
    await this._collections[collectionName].deleteOne(filter);
  }

  /**
 *
 * @param {string} collectionName - collection to drop
 * @returns null
 */
  async deleteAll(collectionName: string) {
    if (!this._collections[collectionName]) await this.init(collectionName);
    await this._collections[collectionName].deleteMany({});
  }

  /**
   *
   * @param {string} collectionName - collection to start watching
   * @returns null
   */
  async _watch(collectionName: string) {
    if (!this._collections[collectionName]) await this.init(collectionName);

    this._watchers[collectionName] = Date.now();
    for await (const change of this._collections[collectionName].watch()) {
      this._events.emit(collectionName, change.operationType, change);
    }
  }

  /**
   *
   * @param {string} collectionName - collection to watch
   * @param {Object} fn - callback function to run on event
   * @returns null
   */
  async on(collectionName: string, fn: (args: any[]) => void) {
    if (!this._watchers[collectionName]) this._watch(collectionName);
    this._events.on(collectionName, fn);
  }

  /**
   *
   * @param {string} collectionName - collection to watch once
   * @param {Object} fn - callback function to run on event once
   * @returns null
   */
  async once(collectionName: string, fn: (args: any[]) => void) {
    if (!this._watchers[collectionName]) this._watch(collectionName);
    this._events.once(collectionName, fn);
  }

  /**
   *
   * @param {string} collectionName - collection to remove watchers from
   * @returns null
   */
  off(collectionName: string, fn: (args: any[]) => void) {
    this._events.removeListener(collectionName, fn);
  }
}
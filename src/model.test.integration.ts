/* tslint:disable max-classes-per-file */
import SchematicDatabaseModel from './model';
import { ConvinienceAttributes } from './types.d';
import promiseToCreateADatabasePool from './_test_utils/databasePool';
import ManagedDatabaseConnection from './utils/managedDatabaseConnection';

const managedDatabasePoolConnection = new ManagedDatabaseConnection({ createConnectionOrPool: promiseToCreateADatabasePool });

class Person extends SchematicDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static managedDatabaseConnection = managedDatabasePoolConnection;

  public static tableName = 'incremental_person';
  public static primaryKey = 'person_id';
  public static primaryKeyType = 'auto_increment';
  public static CREATE_QUERY = 'INSERT INTO :table_name (:primary_key, name) VALUES (:primary_key_value, :name)';
  public static UPDATE_QUERY = 'INSERT ...';
  public static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
  public static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
  protected static attributes: ConvinienceAttributes = {
    person_id: 'int',
    name: {
      type: 'string',
      required: true,
    },
    middleName: 'string',
  };
}

describe('SchematicDatabaseModel', () => {
  beforeAll(async () => {
    await managedDatabasePoolConnection.start();
  });
  afterAll(async () => {
    await managedDatabasePoolConnection.end();
  });
  describe('create', () => {
    it('should be possible to create and save a new instance', async () => {
      const person = new Person({ name: 'test' });
      await person.save();
      expect(typeof person.person_id).toEqual('number');
    });
  });
});

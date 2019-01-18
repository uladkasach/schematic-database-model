/* tslint:disable max-classes-per-file */
import FundementalDatabaseModel from './fundementalDatabaseModel';
import promiseToCreateADatabaseConnection from './_test_utils/databaseConnection';
import promiseToCreateADatabasePool from './_test_utils/databasePool';
import ManagedDatabaseConnection from './utils/managedDatabaseConnection';

const managedDatabaseConnection = new ManagedDatabaseConnection({ createConnectionOrPool: promiseToCreateADatabaseConnection });
const managedDatabasePoolConnection = new ManagedDatabaseConnection({ createConnectionOrPool: promiseToCreateADatabasePool });

class Person extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static createDatabaseConnection = promiseToCreateADatabaseConnection;
  protected static tableName = 'person';
  protected static primaryKey = 'person_uuid';
  protected static primaryKeyType = 'uuid';
  protected get primaryKeyValue() { return this.person_uuid; }
  protected static CREATE_QUERY = 'INSERT INTO :table_name (:primary_key, name) VALUES (:primary_key_value, :name)';
  protected static UPSERT_QUERY = 'INSERT INTO :table_name (:primary_key, name) VALUES (:primary_key_value, :name)';
  protected static UPDATE_QUERY = 'INSERT ...';
  protected static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
  protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
  protected get databaseValues() {
    return {
      primary_key_value: this.person_uuid,
      name: this.name,
    };
  }
  public static findAllTest() {
    return this.findAll({ querybase: 'test', values: { } });
  }
  public name: string;
  public person_uuid: string; // tslint:disable-line
  constructor(props: any) {
    super();
    this.person_uuid = props.person_uuid;
    this.name = props.name;
  }
}
class IncrementalPerson extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static createDatabaseConnection = promiseToCreateADatabaseConnection;
  protected static tableName = 'incremental_person';
  protected static primaryKey = 'person_id';
  protected static primaryKeyType = 'auto_increment';
  protected get primaryKeyValue() { return null; }
  protected static CREATE_QUERY = 'INSERT INTO :table_name (:primary_key, name) VALUES (:primary_key_value, :name)';
  protected static UPDATE_QUERY = 'INSERT ...';
  protected static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
  protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
  protected get databaseValues() {
    return {
      primary_key_value: null,
      name: this.name,
    };
  }
  public static findAllTest() {
    return this.findAll({ querybase: 'test', values: { } });
  }
  public name: string;
  public person_uuid: string; // tslint:disable-line
  constructor(props: any) {
    super();
    this.person_uuid = props.person_uuid;
    this.name = props.name;
  }
}
class PersonWithConnectionDefined extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static managedDatabaseConnection = managedDatabaseConnection;
  protected static tableName = 'person';
  protected static primaryKey = 'pk';
  protected static primaryKeyType = 'auto_increment';
  protected get primaryKeyValue() { return 'pk_val'; }
  protected get databaseValues() {
    return {
      primary_key_value: this.pk,
      name: this.name,
    };
  }
  public static findAllTest() {
    return this.findAll({ querybase: 'test', values: { } });
  }
  public name: string;
  public pk: string;
  constructor(props: any) {
    super();
    this.pk = props.pk;
    this.name = props.name;
  }
}
class PersonWithPoolDefined extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static managedDatabaseConnection = managedDatabasePoolConnection;
  protected static tableName = 'person';
  protected static primaryKey = 'pk';
  protected static primaryKeyType = 'auto_increment';
  protected get primaryKeyValue() { return 'pk_val'; }
  protected get databaseValues() {
    return {
      primary_key_value: this.pk,
      name: this.name,
    };
  }
  public static findAllTest() {
    return this.findAll({ querybase: 'test', values: { } });
  }
  public name: string;
  public pk: string;
  constructor(props: any) {
    super();
    this.pk = props.pk;
    this.name = props.name;
  }
}
class Color extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static createDatabaseConnection = promiseToCreateADatabaseConnection;
  protected static tableName = 'colors';
  protected static primaryKey = 'color_id';
  protected static primaryKeyType = 'auto_increment';
  protected get primaryKeyValue() { return null; }
  protected static UPSERT_QUERY = 'INSERT IGNORE INTO :table_name (:primary_key, name) VALUES (:primary_key_value, :name)';
  protected get databaseValues() {
    return {
      primary_key_value: null,
      name: this.name,
    };
  }
  public name: string;
  constructor(props: any) {
    super();
    this.name = props.name;
  }
}

beforeAll(async () => {
  await managedDatabaseConnection.start();
  await managedDatabasePoolConnection.start();
});
afterAll(async () => {
  await managedDatabaseConnection.end();
  await managedDatabasePoolConnection.end();
});

describe('FundementalDatabaseModel', () => {
  describe('database connections', () => {
    it('should be able to execute when creating a database with createDatabaseConnection', async () => {
      await Person.execute({ querybase: 'show table status' });
    });
    it('should be able to execute when given a database connection with promiseDatabaseConnectionOrPool', async () => {
      await PersonWithConnectionDefined.execute({ querybase: 'show table status' });
    });
    it('should be able to execute when given a database connection pool with promiseDatabaseConnectionOrPool', async () => {
      await PersonWithPoolDefined.execute({ querybase: 'show table status' });
    });
    it('should not throw an error when we request 2000+ requests at the same time', async () => {
      // proof of concept - user should define a pool or a single connection.

      // create 2500 queries
      const createQuery = async () => PersonWithPoolDefined.execute({ querybase: 'show table status' });
      const promises = [];
      while (promises.length < 2500) {
        promises.push(createQuery());
      }
      await Promise.all(promises);
    });
  });
  describe('create', () => {
    it('should be able to create with a uuid value', async () => {
      const person = new Person({ name: 'bessy' });
      const id = await person.create();
      expect(typeof id).toEqual('string');
    });
    it('should be able to create with a auto increment value', async () => {
      const person = new IncrementalPerson({ name: 'bessy' });
      const id = await person.create();
      expect(typeof id).toEqual('number'); // expect the auto increment value id to not equal 0
    });
  });
  describe('upsert', () => {
    it('should be able to upsert a unique color', async () => {
      const name = 'turquoise';
      const color = new Color({ name });
      await color.upsert();
      const [colors] = await Color.execute({ querybase: 'select * from :table_name where name=:name', values: { name } });
      expect(colors.length).toEqual(1);
      expect(typeof colors[0].color_id).toEqual('number');
    });
    it('should be able to upsert a unique color twise, with an id too', async () => {
      const name = 'brown';
      const color = new Color({ name, color_id: 4 });
      await color.upsert();
      await color.upsert();
      const [colors] = await Color.execute({ querybase: 'select * from :table_name where name=:name', values: { name } });
      expect(colors.length).toEqual(1);
      expect(typeof colors[0].color_id).toEqual('number');
    });
  });
});

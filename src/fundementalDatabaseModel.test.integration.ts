/* tslint:disable max-classes-per-file */
import FundementalDatabaseModel from './fundementalDatabaseModel';
import promiseToCreateADatabaseConnection from './_test_utils/databaseConnection';
import promiseToCreateADatabasePool from './_test_utils/databasePool';
import ManagedDatabaseConnection from './utils/managedDatabaseConnection';

const managedDatabaseConnection = new ManagedDatabaseConnection({ createConnectionOrPool: promiseToCreateADatabaseConnection });
const managedDatabasePoolConnection = new ManagedDatabaseConnection({ createConnectionOrPool: promiseToCreateADatabasePool });

class Person extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static createDatabaseConnection = promiseToCreateADatabaseConnection;
  protected static tableName = 'test_table';
  protected static primaryKey = 'pk';
  protected get primaryKeyValue() { return 'pk_val'; }
  protected static CREATE_QUERY = 'INSERT ...';
  protected static UPDATE_QUERY = 'INSERT ...';
  protected static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
  protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
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
class PersonWithConnectionDefined extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
  protected static managedDatabaseConnection = managedDatabaseConnection;
  protected static tableName = 'person';
  protected static primaryKey = 'pk';
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
  });
  it('should not throw an error when we request 2000+ requests at the same time', async () => {
    // proof of concept - user should define a pool or a single connection. having the tool create connections for each is out of scope of this tool.
    // really, its debatable whether we should enable the user to offload managing connections onto the tool since its not ideal in the first place.

    // create 2500 queries
    const createQuery = async () => PersonWithPoolDefined.execute({ querybase: 'show table status' });
    const promises = [];
    while (promises.length < 2500) {
      promises.push(createQuery());
    }
    await Promise.all(promises);
  });
});

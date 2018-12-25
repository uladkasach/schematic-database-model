import yesql from 'yesql';
import uuidv4 from 'uuid/v4';
import { DatabaseValues, ValidConnectionType } from './types.d';
import { ConnectionDefinitionMethodAmbiguousError } from './errors';
import ManagedDatabaseConnection from './utils/managedDatabaseConnection';

const named = yesql.mysql; // to be used as named(querybase)(params)

abstract class FundementalDatabaseModel {
  /**
    -- To Be Defined In Implementatino -----------------------------------------------------------
  */
  // schema constants
  protected static tableName: string; // expects to be defined in implementation
  protected static primaryKey: string; // expects to be defined in implementation
  protected static primaryKeyType: string; // expects to be defined in implementation

  // connection logic - define either createDatabaseConnection OR promiseConnection
  protected static createDatabaseConnection: () => Promise<ValidConnectionType>; // in this case, the user defined a way to create the database connection. the model will handle opening and closing the connection.
  protected static managedDatabaseConnection: ManagedDatabaseConnection; // in this case, the user defined the database connection or pool. the model will use whatever connection or pool is provided. the user will have to close the connection once they are finished.

  /**
    -- Data Extraction -----------------------------------------------------------
  */
  protected abstract get databaseValues(): DatabaseValues;

  /**
    -- Static Queries -----------------------------------------------------------
  */
  /**
    findAll (e.g., read)
  */
  public static async findAll({ querybase, values }: { querybase: string, values: any }) {
    const [results] = await this.execute({ querybase, values });
    const instances = results.map((result: any) => new (this as any)(result)); // this as any, since the extended class will not be abstract but because this one is typescript throws error
    return instances;
  }

  /**
    findById (e.g., read)
  */
  protected static FIND_BY_PRIMARY_KEY_QUERY: string = 'SELECT * FROM :table_name WHERE :primary_key=:primary_key_value;';
  public static async findByPrimaryKey(value: string | number) {
    const querybase = this.FIND_BY_PRIMARY_KEY_QUERY;
    const values = {
      primary_key_value: value,
    };
    const [results] = await this.execute({ querybase, values });
    if (!results[0]) return null;
    const instances = results.map((result: any) => new (this as any)(result)); // this as any, since the extended class will not be abstract but because this one is typescript throws error
    return instances[0];
  }

  /**
    findByUniqueAttributes (e.g., read)
  */
  protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY: string;
  public static async findByUniqueAttributes(values: any) {
    if (!this.FIND_BY_UNIQUE_ATTRIBUTES_QUERY) throw new Error('FIND_BY_UNIQUE_ATTRIBUTES_QUERY must be defined');
    const querybase = this.FIND_BY_UNIQUE_ATTRIBUTES_QUERY;
    const [results] = await this.execute({ querybase, values });
    if (!results[0]) return null;
    const instances = results.map((result: any) => new (this as any)(result)); // this as any, since the extended class will not be abstract but because this one is typescript throws error
    return instances[0];
  }

  /**
    -- Fundemental CRUD ----------------------------------------------------------
  */

  /**
    Create:
      - abstracts the recurring elements of create and createIfDoesNotExist
      - considers and handles three types of primary keys:
        - auto increment
        - uuid
        - custom

    Create Types:
      - regular
      - create if not defined:
        - create only if the object does not exist based on the unique keys of the object
      - upsert
        - create an entry with the static data only if it does not exist, based on the unique keys of the object
        - update the dynamic data of the entry, specified by the unique static data

    Logic:
      0. validate the request
        - ensure query is defined
      1. validate the primary key
        - ensure its null at first
        - if its a uuid, generate the uuid value
      2. run the query
      3. return the key
        - if its a uuid, return the value defined
        - return the lastInsertedId otherwise
  */
  protected static CREATE_QUERY: string; // user must define query, knowing data contract availible
  protected static CREATE_IF_DNE_QUERY: string; // user must define query, knowing data contract availible
  protected static UPSERT_QUERY: string; // user must define query, knowing data contract availible
  public async create(choice: 'CREATE_QUERY' | 'CREATE_IF_DNE_QUERY' | 'UPSERT_QUERY' = 'CREATE_QUERY'): Promise<string | number> {
    const values = this.databaseValues;
    const primaryKeyType = (this.constructor as typeof FundementalDatabaseModel).primaryKeyType;

    // 0. validate the request
    const requestedQuery = (this.constructor as typeof FundementalDatabaseModel)[choice];
    if (!requestedQuery) throw new Error(`${choice} must be defined`); // throw error if the query choice was not instantiated

    // 1. validate the primary key
    switch (primaryKeyType) {
      case 'auto_increment':
        if (values.primary_key_value) throw new Error('primary key value is already defined'); // throw error if value defined already, should be null
        break;
      case 'uuid':
        if (values.primary_key_value) throw new Error('primary key value is already defined'); // throw error if value defined already, should be null
        values.primary_key_value = uuidv4(); // assign a new uuid
        break;
      case 'custom':
        if (typeof values.primary_key_value === 'undefined') throw new Error('primary key value must be defined'); // throw error if value not defined already, should be defined by user
        break;
      default:
        throw new Error('invalid primary key type found');
    }

    // 2. run the query
    const querybase = (this.constructor as typeof FundementalDatabaseModel)[choice];
    const result = await (this.constructor as typeof FundementalDatabaseModel).execute({ querybase, values });
    if (!result) throw new Error('unexpected result error');

    // 3. return the recorded primary key value
    let primaryKeyValueRecorded;
    switch (primaryKeyType) {
      case 'auto_increment':
        primaryKeyValueRecorded = result[0].insertId;
        break;
      case 'uuid':
        primaryKeyValueRecorded = values.primary_key_value;
        break;
      case 'custom':
        primaryKeyValueRecorded = values.primary_key_value;
        break;
      default:
        throw new Error('invalid primary key type found');
    }
    return primaryKeyValueRecorded; // return the uuid
  }

  /**
    update object
  */
  protected static UPDATE_QUERY: string; // user must define update query, knowing data contract availible
  public async update(): Promise<string> {
    const values = this.databaseValues;
    if (!(this.constructor as typeof FundementalDatabaseModel).UPDATE_QUERY) throw new Error('UPDATE_QUERY must be defined');
    if (!values.primary_key_value) throw new Error('primary key value must be defined in order to update');
    const querybase = (this.constructor as typeof FundementalDatabaseModel).UPDATE_QUERY;
    const result = await (this.constructor as typeof FundementalDatabaseModel).execute({ querybase, values });
    if (!result) throw new Error('unexpected result error');
    return values.primary_key_value; // return id of this object
  }

  /**
    delete (by id)
  */
  protected static DELETE_QUERY: string = 'DELETE FROM :table_name WHERE :primary_key=:primary_key_value;';
  public async delete(): Promise<boolean> {
    const values = this.databaseValues;
    if (!values.primary_key_value) throw new Error('primary key value must be defined in order to delete');
    const querybase = (this.constructor as typeof FundementalDatabaseModel).DELETE_QUERY;
    const result = await (this.constructor as typeof FundementalDatabaseModel).execute({ querybase, values });
    return (result === true);
  }

  /**
    -- Query Execution ----------------------------------------------------------
  */
  /**
    execute
    - expects database connection creation method to have been defined as a static property of the class
    - creates database connection each time; TODO - reuse connections
  */
  public static async execute({ querybase, values = {} }: { querybase: string, values?: any }) {
    // 0.1.
    const cleanedQuerybase = querybase
      .replace(/:table_name/g, this.tableName) // replace :table_name with table_name value in string, since MySQL can not support parameteriazed table names
      .replace(/:primary_key(?!_)/g, this.primaryKey); // replace :primary_key (but not :primary_key_value's :primary_key) with table_name value in string, since MySQL can not support parameteriazed table names

    // 0.2 replace all parameters user asked to explicitly insert into statement, not as prepared statement parameters
    let specifiedQueryBase = cleanedQuerybase;
    const parameters = Object.keys(values);
    parameters.forEach((parameter) => { // for each parameter, check if it was requested in its "constant" form
      const value = values[parameter];
      const pattern = `x:${parameter}(?!_)`; // any string that starts with x:${parameterName} and does not continue with a _
      const regex = new RegExp(pattern, 'g');
      const stringRepresentationOfValue = (typeof value === 'number') ? `${value}` : `'${value}'`; // TODO - find cases where this breaks
      specifiedQueryBase = specifiedQueryBase.replace(regex, stringRepresentationOfValue);
    });

    // 1. create { query, values } pair
    const query = named(specifiedQueryBase)(values);

    // 2. retreive the database connection or pool && what to run after completing execution
    let databaseConnectionOrPool: ValidConnectionType; // something that can execute a query
    let postExecutionCleanupMethod: () => Promise<any>; // what to run after executing the query
    if (this.createDatabaseConnection && this.managedDatabaseConnection) throw new ConnectionDefinitionMethodAmbiguousError(); // check that state is not ambiguous
    if (this.createDatabaseConnection) { // if user has defined the createDatabaseConnection method, we must both create the connection and close it afterwards
      databaseConnectionOrPool = await this.createDatabaseConnection(); // the user has asked the model to create the connection
      postExecutionCleanupMethod = async () => databaseConnectionOrPool.end(); // if user asked the model to create the connection, the model must be sure to close it
    } else {
      databaseConnectionOrPool = this.managedDatabaseConnection; // the user has provided the model with a way to retrieve a connection or a pool
      postExecutionCleanupMethod = async () => {}; // the user must manage the connection or pool they are providing the model on their own.
    }

    // 2. call databaseConnection.execute with query
    let result: any; // can be a number of different result formats depending on the query
    let foundError;
    try {
      result = await (databaseConnectionOrPool as any).execute(query.sql, query.values); // as any as for some reason when merging Connection and ManagedDatabaseConnection we get a type error, although they work on their own
    } catch (error) {
      console.log(error);
      console.log(query);
      foundError = error;
    } finally {
      await postExecutionCleanupMethod();
    }

    // 2.5 if error was found, continue throwing it now that we've closed db connection
    if (foundError) throw foundError;

    // 3. return the result
    return result;
  }
}
export default FundementalDatabaseModel;

import yesql from 'yesql';
import uuidv4 from 'uuid/v4';
import { DatabaseValues, CreateDatabaseConnectionMethod } from './types.d';

const named = yesql.mysql; // to be used as named(querybase)(params)

abstract class FundementalDatabaseModel {
  /**
    -- To Be Defined In Implementatino -----------------------------------------------------------
  */
  protected static createDatabaseConnection: CreateDatabaseConnectionMethod; // expects to be defined in implementation
  protected static tableName: string; // expects to be defined in implementation
  protected static primaryKey: string; // expects to be defined in implementation
  // protected static createSemaphore: Semaphore; // exectes to be defined in implementation

  /**
    -- Data Extraction -----------------------------------------------------------
  */
  protected abstract get primaryKeyValue(): any;
  protected abstract get databaseValues(): DatabaseValues;

  /**
    -- Static Queries -----------------------------------------------------------
  */
  /**
    findAll (e.g., read)
  */
  protected static async findAll({ querybase, values }: { querybase: string, values: any }) {
    const [results] = await this.execute({ querybase, values });
    const instances = results.map((result: any) => new (this as any)(result)); // this as any, since the extended class will not be abstract but because this one is typescript throws error
    return instances;
  }

  /**
    findById (e.g., read)
  */
  protected static FIND_BY_ID_QUERY: string = 'SELECT * FROM :table_name WHERE :primary_key=:id;';
  public static async findById(id: string | number) {
    const querybase = this.FIND_BY_ID_QUERY;
    const values = {
      id,
    };
    const [results] = await this.execute({ querybase, values });
    if (!results[0]) return null;
    const instances = results.map((result: any) => new (this as any)(result)); // this as any, since the extended class will not be abstract but because this one is typescript throws error
    return instances[0];
  }

  /**
    -- Fundemental CRUD ----------------------------------------------------------
  */
  /**
    create new object
    - checks if object id is defined on object already
  */
  protected static CREATE_QUERY: string; // user must define update query, knowing data contract availible
  public async create(): Promise<string> {
    const values = this.databaseValues;

    // validate request
    if (!(this.constructor as typeof FundementalDatabaseModel).CREATE_QUERY) throw new Error('CREATE_QUERY must be defined');
    if (values.primary_key_value) throw new Error('primary key value is already defined');

    // add primary key value (uuid)
    const uuid = uuidv4();
    values.primary_key_value = uuid;

    // get request
    const querybase = (this.constructor as typeof FundementalDatabaseModel).CREATE_QUERY;
    const result = await (this.constructor as typeof FundementalDatabaseModel).execute({ querybase, values });
    if (!result) throw new Error('unexpected result error');

    // return the uuid
    return uuid; // return the uuid
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
    findOrCreate object
  */
  protected static FIND_OR_CREATE_QUERY: string; // user must define FIND query, knowing data contract availible
  public async findOrCreate(): Promise<string> {
    const values = this.databaseValues;
    if (!values.primary_key_value) values.primary_key_value = uuidv4(); // if not already provided, provide it
    if (!(this.constructor as typeof FundementalDatabaseModel).FIND_OR_CREATE_QUERY) throw new Error('FIND_OR_CREATE_QUERY must be defined');
    const querybase = (this.constructor as typeof FundementalDatabaseModel).FIND_OR_CREATE_QUERY;
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

    // 2. call databaseConnection.execute with query
    const databaseConnection = await this.createDatabaseConnection(); // as any, since the createDatabaseConnection will be implemented in class extension
    let result;
    let foundError;
    try {
      result = await databaseConnection.execute(query.sql, query.values);
    } catch (error) {
      console.log(error);
      console.log(query);
      foundError = error;
    } finally {
      await databaseConnection.end();
    }

    // 2.5 if error was found, continue throwing it now that we've closed db connection
    if (foundError) throw foundError;

    // 3. return the result
    return result;
  }
}
export default FundementalDatabaseModel;

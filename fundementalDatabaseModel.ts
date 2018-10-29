import yesql from 'yesql';

const named = yesql.mysql; // to be used as named(querybase)(params)

interface StaticCRUDArguments {
  querybase: string;
  values: any;
}

/**
  note, the fundemental model expects almost all methods to be overwritten so that the sql can be defined in the subclasses
  e.g.,
  ChildClass extends FundementalDatabaseModel {
    create() {
      const querybase = `INSERT ... INTO ...`;
      return super.create(querybase);
    }
  }
*/
type CreateDatabaseConnectionMethod = () => { execute: (sql: string, values: any[]) => Promise<any> };
abstract class FundementalDatabaseModel {
  protected static createDatabaseConnection: CreateDatabaseConnectionMethod; // expects classes to be defined with a createDatabaseConnection as a private property

  /**
    -- Convinience CRUD ----------------------------------------------------------
  */
  /**
    save
    - creates if id is set, updates if not
  */
  public save() {
    const method = (this.primaryKeyColumn)
  }

  /**
    findOrCreate
    - sees if one exists, if not creates.
    - use semaphore to ensure creation and findOrCreate happen exclusively (e.g., cant findOrCreate untill create is completed)
    @returns { object, bool_created }
  */
  public static async findOrCreate({ querybase, values }: StaticCRUDArguments) {
    const results = await this.findAll({ querybase, values });
    if (results.length) return results[0]; // return found result, best match
    const instance = new (this as any)(values);
    await instance.save();
    return instance;
  }

  /**
    -- Fundemental CRUD ----------------------------------------------------------
  */
  /**
    create new object
    - checks if object id is defined on object already
    - use semaphore to ensure creation and findOrCreate happen exclusively (e.g., cant create untill findOrcreate is completed)
  */
  public create(querybase: string) {

  }

  /**
    update object
  */
  public update(querybase: string) {

  }

  /**
    delete (by id)
  */
  public delete(querybase: string) {

  }

  /**
    findAll (e.g., read)
  */
  public static async findAll({ querybase, values }: StaticCRUDArguments) {
    const results = await this.execute({ querybase, values });
    const instances = results.map((result: any) => new (this as any)(result)); // this as any, since the extended class will not be abstract but because this one is typescript throws error
    return instances;
  }

  /**
    -- Execution ----------------------------------------------------------
  */
  /**
    execute
    - expects database connection creation method to have been defined as a static property of the class
    - creates database connection each time; TODO - reuse connections
  */
  public static async execute({ querybase, values }: { querybase: string, values?: any }) {
    // 1. create { query, values } pair
    const query = named(querybase)(values);

    // 2. call databaseConnection.execute with query
    const databaseConnection = await this.createDatabaseConnection(); // as any, since the createDatabaseConnection will be implemented in class extension
    const result = await databaseConnection.execute(query.sql, query.values);

    // 3. return the result
    return result;
  }
}
export default FundementalDatabaseModel;

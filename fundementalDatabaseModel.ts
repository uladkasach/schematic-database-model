import SchematicDatabaseModel from './index';

interface StaticCRUDArguments {
  queryBase: string;
  Constructor: SchematicDatabaseModel;
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
class FundementalDatabaseModel {
  protected createDatabaseConnection: () => any; // expects classes to be defined with a createDatabaseConnection as a private property

  /**
    -- Convinience CRUD ----------------------------------------------------------
  */
  /**
    save
    - creates if id is set, updates if not
  */
  public save() {

  }

  /**
    findOrCreate
    - sees if one exists, if not creates.
    - use semaphore to ensure creation and findOrCreate happen exclusively (e.g., cant findOrCreate untill create is completed)
    @returns { object, bool_created }
  */
  public static findOrCreate({ querybase, Constructor }: StaticCRUDArguments) {

  }

  /**
    -- Fundemental CRUD ----------------------------------------------------------
  */
  /**
    create new object
    - checks if object id is defined on object already
    - use semaphore to ensure creation and findOrCreate happen exclusively (e.g., cant create untill findOrcreate is completed)
  */
  public create(querybase) {

  }

  /**
    update object
  */
  public update(querybase) {

  }

  /**
    delete (by id)
  */
  public delete(querybase) {

  }

  /**
    findAll (e.g., read)
  */
  public static findAll({ querybase, Constructor }: StaticCRUDArguments) {

  }

  /**
    -- Execution ----------------------------------------------------------
  */
  /**
    execute
    - expects database connection creation method to have been defined as a static property of the class
    - creates database connection each time; TODO - reuse connections
  */
}
export default FundementalDatabaseModel;

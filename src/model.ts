import { StrictAttributes, ConvinienceAttributes, InvalidPropertyMap, DatabaseValues } from './types.d';
import noramlizeSchemaAttributes from './normalizeSchemaAttributes';
import addValidationToAttributes from './addValidationToAttributes';
import FundementalDatabaseModel from './fundementalDatabaseModel';
import { ValidationError } from './errors';

export default abstract class SchematicDatabaseModel extends FundementalDatabaseModel {
  [index: string]: any; // defines that we can have any property defined dynamically

  // defined by user
  protected static tableName: string;
  protected static primaryKey: string;
  protected static primaryKeyType: string;
  protected static attributes: ConvinienceAttributes;

  // defined by getParsedAttributes
  protected static parsedAttributes: StrictAttributes;

  /**
    -- initialization ----------------------------------------------------------
  */
  constructor(props: any) {
    super(); // pass no params, as FundementalDatabaseModel expects its required params to be passed to it by overwriting the function and calling the super version

    // validate the props
    const errors = (this.constructor as typeof SchematicDatabaseModel).validate(props);
    if (Object.keys(errors).length !== 0) {
      throw new ValidationError({
        errors,
        props,
        modelName: this.constructor.name,
      });
    }

    // assign model props to self
    this.databaseValues = props; // set the database values, with parsing
  }

  /**
    -- schema validation ----------------------------------------------------------
  */
  /**
    validate the props passed based on schema
  */
  public static validate(props: any) {
    const attributes: StrictAttributes = this.getParsedAttributes();
    const attributeKeys = Object.keys(attributes);
    const errors: InvalidPropertyMap = {}; // collect all errors
    attributeKeys.forEach((attributeKey) => {
      const attribute = attributes[attributeKey];
      const value = props[attributeKey];
      const attributeErrors = attribute.validation(value);
      if (attributeErrors.length) errors[attributeKey] = attributeErrors;
    });
    return errors;
  }

  /**
    convert the defined schema into a validated and actionable schema object
    - caches the schema results
  */
  protected static getParsedAttributes() {
    if (!this.parsedAttributes) { // if parsed schema is not defined, define it for the constructor
      const { attributes } = this; // extract form the class static properties

      // 1. normalize schema attributes
      const normalizedAttributes = noramlizeSchemaAttributes({ attributes });

      // 2. attach validation methods to each field
      const attributesWithValidation = addValidationToAttributes({ attributes: normalizedAttributes });

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedAttributes = attributesWithValidation;
    }
    return this.parsedAttributes;
  }

  /**
    -- Convinience CRUD  -------------------------------------------------------
  */
  /**
    save
    - creates if primaryKeyValue is set, updates if not
  */
  public async save(): Promise<string | number> {
    return (this.databaseValues.primary_key_value)
      ? await this.update()
      : await this.create();
  }

  /**
    find or create
    - uses the createIfDoesNotExist query to ensure that the object is created without breaking uniqueness constraints
    - uses the findByUniqueAttributes to find the object now that we guarenteed it exists
    @returns {boolean} - was the object created or not; //TODO
  */
  public async findOrCreate(): Promise<void> {
    // 1. ensure that the object is created (while not violating unique constraints)
    await super.create('CREATE_IF_DNE_QUERY');

    // 2. find the rest of the details for the object by its unique values
    const values = this.databaseValues;
    const instance = await (this.constructor as typeof FundementalDatabaseModel).findByUniqueAttributes(values);

    // 3. update the state of this object based on what was found in the database
    this.databaseValues = instance;
  }

  /**
    upsert
    - uses the upsert query to ensure that
      1. the object, identified by its unique static fields, is created
      2. any dynamic data of the object is updated to the newly passed most recent state
    - uses the findByUniqueAttributes to find the object details now that we guarenteed it exists and is up to date
    @returns {boolean} - was the object created or not; //TODO
  */
  public async upsert(): Promise<void> {
    // 1. ensure that the object is created (while not violating unique constraints)
    await super.create('UPSERT_QUERY');

    // 2. find the rest of the details for the object by its unique values
    const values = this.databaseValues;
    const instance = await (this.constructor as typeof FundementalDatabaseModel).findByUniqueAttributes(values);

    // 3. update the state of this object based on what was found in the database
    this.databaseValues = instance;
  }

  /**
    -- CRUD Implementation -------------------------------------------------------
  */
  public async create(): Promise<string | number> {
    const primaryKeyValue = await super.create('CREATE_QUERY');
    this[(this.constructor as typeof SchematicDatabaseModel).primaryKey] = primaryKeyValue; // update the primaryKey to the new primaryKeyValue
    return primaryKeyValue;
  }

  /**
    -- data manipulation ----------------------------------------------------------
  */
  get databaseValues(): DatabaseValues {
    const primaryKey = (this.constructor as typeof SchematicDatabaseModel).primaryKey;
    const databaseValues: any = {};
    const attributes = (this.constructor as typeof SchematicDatabaseModel).getParsedAttributes();
    const attributeKeys = Object.keys(attributes);
    attributeKeys.forEach((key) => {
      const value = this[key];
      const recordedValue = (typeof value === 'undefined') ? null : value; // if undefined, cast to null - since databases only have null
      databaseValues[key] = recordedValue;
      if (key === primaryKey) databaseValues.primary_key_value = recordedValue;
    });
    return databaseValues;
  }

  set databaseValues(values: DatabaseValues) {
    const attributes = (this.constructor as typeof SchematicDatabaseModel).getParsedAttributes();
    const attributeKeys = Object.keys(attributes);
    attributeKeys.forEach((key) => {
      const value = values[key];
      this[key] = value;
    });
  }
}

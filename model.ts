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
    const attributes = (this.constructor as typeof SchematicDatabaseModel).getParsedAttributes();
    const attributeKeys = Object.keys(attributes);
    attributeKeys.forEach((key) => {
      const value = props[key];
      this[key] = value;
    });
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
  public async save(): Promise<string> {
    return (this.primaryKeyValue)
      ? await this.update()
      : await this.create();
  }

  /**
    -- CRUD Implementation -------------------------------------------------------
  */
  public async create(): Promise<string> {
    const uuid = await super.create();
    this[(this.constructor as typeof SchematicDatabaseModel).primaryKey] = uuid; // update the primaryKey to the new uuid
    return uuid;
  }

  /**
    -- data extraction ----------------------------------------------------------
  */
  get primaryKeyValue(): any {
    const primaryKey = (this.constructor as typeof SchematicDatabaseModel).primaryKey;
    const primaryKeyValue = (this as SchematicDatabaseModel)[primaryKey]; // we expect
    return primaryKeyValue;
  }

  get databaseValues(): DatabaseValues {
    const databaseValues: any = {
      primary_key_value: this.primaryKeyValue,
    };
    const attributes = (this.constructor as typeof SchematicDatabaseModel).getParsedAttributes();
    const attributeKeys = Object.keys(attributes);
    attributeKeys.forEach((key) => {
      const value = this[key];
      const recordedValue = (typeof value === 'undefined') ? value : null; // if undefined, cast to null - since databases only have null
      databaseValues[key] = recordedValue;
    });
    return databaseValues;
  }

}

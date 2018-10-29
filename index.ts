import { ConvinienceSchema, StrictSchema, StrictAttributes, InvalidPropertyMap } from './types.d';
import noramlizeSchemaAttributes from './normalizeSchemaAttributes';
import addValidationToAttributes from './addValidationToAttributes';
import FundementalDatabaseModel from './fundementalDatabaseModel';
import { ValidationError } from './errors';

export default abstract class SchematicDatabaseModel extends FundementalDatabaseModel {
  [index: string]: any; // defines that we can have any property defined dynamically

  protected static schema: ConvinienceSchema; // defined by implementation
  protected static parsedSchema: StrictSchema; // any type, since we dont know the keys in advance

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
    const { attributes } = (this.constructor as typeof SchematicDatabaseModel).getParsedSchema();
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
    const { attributes }: { attributes: StrictAttributes } = this.getParsedSchema();
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
  protected static getParsedSchema() {
    if (!this.parsedSchema) { // if parsed schema is not defined, define it for the constructor
      const { schema: { tableName, attributes, primaryKey } } = this; // extract form the class static properties

      // 1. normalize schema attributes
      const normalizedAttributes = noramlizeSchemaAttributes({ attributes });

      // 2. attach validation methods to each field
      const attributesWithValidation = addValidationToAttributes({ attributes: normalizedAttributes });

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedSchema = {
        tableName,
        primaryKey,
        attributes: attributesWithValidation,
      };
    }
    return this.parsedSchema;
  }

  /**
    -- Database Convinience Methods -------------------------------------------------------
  */
  get primaryKeyValue(): any {
    const primaryKey = (this.constructor as typeof SchematicDatabaseModel).schema.primaryKey;
    const primaryKeyValue = (this as SchematicDatabaseModel)[primaryKey]; // we expect
    return primaryKeyValue;
  }

  /**
    define that create, update, and delete must all be custom implemented
  */
  public abstract create(): Promise<extends SchematicDatabaseModel>;
  public abstract update(): Promise<SchematicDatabaseModel>;
  public abstract delete(): Promise<boolean>;

  /**
    save
    - creates if primaryKeyValue is set, updates if not
    @param primaryKeyValue - since the FundementalDatabaseModel knows nothing about schema
  */
  public save() {
    const method = (this.primaryKeyValue)
      ? this.update
      : this.save;
    method();
  }
}

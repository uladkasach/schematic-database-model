import { ConvinienceSchema, StrictSchema, StrictAttributes, InvalidPropertyMap } from './types.d';
import noramlizeSchemaAttributes from './normalizeSchemaAttributes';
import addValidationToAttributes from './addValidationToAttributes';
import { ValidationError } from './errors';

export default class SchematicDatabaseModel {
  [index: string]: any; // defines that we can have any property defined dynamically

  protected static schema: ConvinienceSchema; // defined by implementation
  protected static parsedSchema: StrictSchema; // any type, since we dont know the keys in advance

  /**
    -- initialization ----------------------------------------------------------
  */
  constructor(props: any) {
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
      const { schema: { tableName, attributes } } = this; // extract form the class static properties

      // 1. normalize schema attributes
      const normalizedAttributes = noramlizeSchemaAttributes({ attributes });

      // 2. attach validation methods to each field
      const attributesWithValidation = addValidationToAttributes({ attributes: normalizedAttributes });

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedSchema = {
        tableName,
        attributes: attributesWithValidation,
      };
    }
    return this.parsedSchema;
  }

}

import { Attributes, StrictAttributes } from './types.d';
import noramlizeSchemaAttributes from './normalizeSchemaAttributes';
import addValidationToAttributes from './addValidationToAttributes';

export default class SchematicDatabaseModel {
  protected static schema: { tableName: string, attributes: StrictAttributes }; // defined by implementation
  protected static parsedSchema: { tableName: string, attributes: Attributes }; // any type, since we dont know the keys in advance

  /**
    -- schema validation --------------------------------------------------------------
  */
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

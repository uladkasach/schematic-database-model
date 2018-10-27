export const addValidationToSchema = ({ attributes }: { attributes: any }) => {

};

interface Schema {
  tableName: string;
  attributes: any;
}
export default class SchematicDatabaseModel {
  protected static schema: Schema; // defined by implementation
  protected static parsedSchema: Schema; // any type, since we dont know the keys in advance

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

      // attach validation methods to each field
      const attributesWithValidation = addValidationToSchema({ attributes });

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedSchema = {
        tableName,
        attributes: attributesWithValidation,
      };
    }
    return this.parsedSchema;
  }
}

/* tslint:disable max-classes-per-file */
import { Attribute, InvalidPropertyMap } from './types.d';

export class ValidationError extends Error {
  public errors: InvalidPropertyMap;
  public props: any;
  public modelName: string;
  constructor(
    {
      errors,
      props,
      modelName,
    }:
    {
      errors: InvalidPropertyMap,
      props: any,
      modelName: string,
    },
  ) {
    const message = `Errors on ${Object.keys(errors).length} properties were found while validating properties for model ${modelName}.:
${JSON.stringify(props, null, 2)}
${JSON.stringify(errors, null, 2)}`;
    super(message);

    this.errors = errors;
    this.props = props;
    this.modelName = modelName;
  }
}

export class AttributeTypeError extends Error {
  public attribute: Attribute;
  constructor(attribute: Attribute) {
    const message = `Type ${attribute.type} is not a well defined type`;
    super(message);
    this.attribute = attribute;
  }
}

export class CustomAttributeMissingValidationError extends Error {
  constructor() {
    const message = 'Custom type attribute must define validation method';
    super(message);
  }
}

export class ConnectionDefinitionMethodAmbiguousError extends Error {
  constructor() {
    const message = 'createDatabaseConnection and promiseConnectionOrPool are both defined: this state is ambiguous. please choose ONE method of defining the database connection.';
    super(message);
  }
}

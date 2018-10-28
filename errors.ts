/* tslint:disable max-classes-per-file */

import { Attribute } from './types.d';

export class ValidationError extends Error {
  constructor(
    {
      value,
      attribute,
      errors,
    }:
    {
      value: any,
      attribute: Attribute,
      errors: string[],
    },
  ) {
    const message = `Value ${value} was not valid for attribute ${attribute.name}: ${errors}`;
    super(message);
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

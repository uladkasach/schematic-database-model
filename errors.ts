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
      errors: Error[],
    },
  ) {
    const message = `Value ${value} was not valid for attribute ${attribute.name}: ${errors}`;
    super(message);
  }
}

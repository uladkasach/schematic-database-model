import {
  Attributes,
  StrictAttributes,
} from './types.d';
import {
  AttributeTypeError,
  CustomAttributeMissingValidationError,
} from './errors';
import wellKnownTypes from './wellKnownTypes';

/**
  @method addValidationToAttributes
  for each StrictAttribute,
    a. check that attribute config is valid:
      1. check that type is well known
      2. check if type is custom, validate is defined
    b. build a validation method:
      0. check if required, that it is present
      1. check if type is well known: if it is, check that type passes
      2. check if custom validate method is defined, that it passes
*/
const addValidationToAttributes = ({ attributes }: { attributes: Attributes }) => {
  const attributesWithValidation: StrictAttributes = {}; // define holder for final attributes
  const attributeKeys = Object.keys(attributes);
  attributeKeys.forEach((attributeKey) => {
    const attribute = attributes[attributeKey];

    // a. check that attribute config is valid
    const isWellKnownType = Object.keys(wellKnownTypes).includes(attribute.type);
    if (!isWellKnownType && attribute.type !== 'custom') throw new AttributeTypeError(attribute); // check that attribute is an expected type
    if (attribute.type === 'custom' && !attribute.validation) throw new CustomAttributeMissingValidationError(); // check validation set if custom

    // b. build a validation method
    const validate = (value: any) => {
      const errors: string[] = [];

      // 0. check that it is present if required
      const nullValue = typeof value === 'undefined' || value === null;
      if (attribute.required && nullValue) errors.push('element is required, but not defined');
      if (nullValue) return errors; // no need to evaluate further if not defined; either required error was thrown or no errors exist

      // 1. if type is well known, check that it passes validation
      if (isWellKnownType) {
        const wellKnownTypeErrors = wellKnownTypes[attribute.type](value); // evaluate this value in the requested type validation method
        errors.push(...wellKnownTypeErrors); // record any errors found
      }

      // 2. if a validation method is already defined, run that as well
      if (attribute.validation) {
        const customValidationErrors = attribute.validation(value);
        errors.push(...customValidationErrors);
      }

      // return errors
      return errors;
    };

    // c. append validation method to attributes
    attributesWithValidation[attributeKey] = {
      name: attribute.name!,
      type: attribute.type,
      required: attribute.required!,
      validation: validate,
    };
  });

  // return results
  return attributesWithValidation;
};

export default addValidationToAttributes;

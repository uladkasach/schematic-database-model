import { Attributes, Attribute, ConvinienceAttributes } from './types.d';

/**
  @method normalizeSchemaAttributes
  @description this method is responsible for explicitly setting defaults and casting shorthand notations to long hand notations.
  for each attribute:
    1. convert shorthand to longhand ( attrKey: string -> attrKey: { type: string })
    2. set default value for required
    3. append attribute name
*/
const normalizeSchemaAttributes = ({ attributes }: { attributes: ConvinienceAttributes }) => {
  const normalizedAttributes: Attributes = {}; // place where we will build the normalized attributes
  const attributeKeys = Object.keys(attributes); // define the keys we want to loop over
  attributeKeys.forEach((attributeKey) => {
    const value: Attribute | string = attributes[attributeKey]; // get the user defined value
    const attribute: Attribute = (typeof value === 'string') ? { type: value } : value; // if value is a string, cast from shorthand to longhand
    if (typeof attribute.required !== 'boolean') attribute.required = !!attribute.required; // 2. if required is not set to a boolean, get its "truthy/falsy" state
    attribute.name = attributeKey; // 3. append attribute name
    normalizedAttributes[attributeKey] = attribute; // assign to normalized object
  });
  return normalizedAttributes;
};

export default normalizeSchemaAttributes;

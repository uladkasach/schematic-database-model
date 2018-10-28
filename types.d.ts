import { ValidationError } from './errors';

type ValidateMethod = (value?: any) => string[];

interface Attribute {
  type: string;
  name?: string;
  required?: boolean;
  validation?: ValidateMethod;
}

interface StrictAttribute {
  type: string;
  name: string;
  required: boolean;
  validation: ValidateMethod;
}

interface StrictAttributes {
  [index: string]: StrictAttribute;
}
interface ConvinienceAttributes {
  [index: string]: Attribute | string;
}
interface Attributes {
  [index: string]: Attribute;
}

interface WellKnownTypes {
  [index: string]: ValidateMethod;
}

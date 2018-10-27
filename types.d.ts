import { ValidationError } from './errors';

interface Attribute {
  type: string;
  name?: string;
  required?: boolean;
  validation?: (value: any) => ValidationError[];
}

interface ConvinienceAttributes {
  [index: string]: Attribute | string;
}
interface Attributes {
  [index: string]: Attribute;
}

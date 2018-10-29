export type ValidateMethod = (value?: any) => string[];

export interface Attribute {
  type: string;
  name?: string;
  required?: boolean;
  validation?: ValidateMethod;
}

export interface StrictAttribute {
  type: string;
  name: string;
  required: boolean;
  validation: ValidateMethod;
}

export interface StrictAttributes {
  [index: string]: StrictAttribute;
}
export interface ConvinienceAttributes {
  [index: string]: Attribute | string;
}
export interface Attributes {
  [index: string]: Attribute;
}

export interface WellKnownTypes {
  [index: string]: ValidateMethod;
}

export interface ConvinienceSchema {
  tableName: string;
  primaryKey: string;
  attributes: ConvinienceAttributes;
}

export interface StrictSchema {
  tableName: string;
  primaryKey: string;
  attributes: StrictAttributes;
}

export interface InvalidPropertyMap {
  [index: string]: string[];
}

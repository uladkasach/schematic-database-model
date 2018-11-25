export type ValidateMethod = (value?: any) => string[];
import { Connection, Pool } from 'mysql2/promise'; // NOTE - this module requires usage of mysql2
import ManagedDatabaseConnection from './utils/managedDatabaseConnection';

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

export interface StaticCRUDArguments {
  querybase: string;
  values: any;
}

export interface DatabaseValues {
  primary_key_value: any;
  [index: string]: any;
}

type ValidConnectionType = ManagedDatabaseConnection | Connection | Pool;

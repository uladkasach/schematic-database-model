import {
  WellKnownTypes,
} from './types.d';

const wellKnownTypes: WellKnownTypes = {
  string: (value) => {
    const errors = [];
    if (typeof value !== 'string') errors.push('must be string');
    return errors;
  },
  int: (value) => {
    const errors = [];
    if (typeof value !== 'number') errors.push('must be a number');
    if (!Number.isInteger(value)) errors.push('must be an integer');
    return errors;
  },
  float: (value) => {
    const errors = [];
    if (typeof value !== 'number') errors.push('must be a number');
    return errors;
  },
  boolean: (value) => {
    const errors = [];
    if (typeof value !== 'boolean') errors.push('must be a boolean');
    return errors;
  },
  datetime: (value) => {
    const errors = [];
    if (isNaN(Date.parse(value))) errors.push('must be a parsable date string');
    return errors;
  },
  uuid: (value) => {
    const errors = [];
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const isValidUuid = uuidRegex.test(value);
    if (!isValidUuid) errors.push('must be a valid uuid string');
    return errors;
  },
};

export default wellKnownTypes;
export {
  WellKnownTypes,
};

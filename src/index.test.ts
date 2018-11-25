import SchematicDatabaseModel, { ManagedDatabaseConnection, ConvinienceAttributes, ValidConnectionType } from './index';
import SchematicDatabaseModelExpected from './model';
import ManagedDatabaseConnectionExpected from './utils/managedDatabaseConnection';

describe('index', () => {
  it('should export SchematicDatabaseModel as default', () => {
    expect(SchematicDatabaseModel).toEqual(SchematicDatabaseModelExpected);
  });
  it('should export ManagedDatabaseConnection', () => {
    expect(ManagedDatabaseConnection).toEqual(ManagedDatabaseConnectionExpected);
  });
});

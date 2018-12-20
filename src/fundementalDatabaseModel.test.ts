/* tslint:disable max-classes-per-file */
import FundementalDatabaseModel from './fundementalDatabaseModel';
import { ValidConnectionType } from './types';
import ManagedDatabaseConnection from './utils/managedDatabaseConnection';

const mockExecute = jest.fn().mockImplementation(() => []);
const mockEnd = jest.fn();
const mockedConnectionObject = ({
  execute: mockExecute,
  end: mockEnd,
});
const createDatabaseConnectionMock = () => mockedConnectionObject;
const managedDatabaseConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnectionMock as any });

beforeAll(async () => {
  await managedDatabaseConnection.start();
});
beforeEach(() => {
  mockExecute.mockClear();
  mockEnd.mockClear();
});
describe('FundementalDatabaseModel', () => {
  class Person extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
    protected static createDatabaseConnection = createDatabaseConnectionMock as any as () => Promise<ValidConnectionType>;
    protected static tableName = 'test_table';
    protected static primaryKey = 'pk';
    protected static primaryKeyType = 'uuid';
    protected get primaryKeyValue() { return 'pk_val'; }
    protected static CREATE_QUERY = 'INSERT ... :primary_key_value...';
    protected static UPDATE_QUERY = 'INSERT ...';
    protected static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
    protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
    protected get databaseValues() {
      return {
        primary_key_value: this.pk,
        name: this.name,
      };
    }
    public static findAllTest() {
      return this.findAll({ querybase: 'test', values: { } });
    }
    public name: string;
    public pk: string;
    constructor(props: any) {
      super();
      this.pk = props.pk;
      this.name = props.name;
    }
  }
  class IncrementalPerson extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
    protected static createDatabaseConnection = createDatabaseConnectionMock as any as () => Promise<ValidConnectionType>;
    protected static tableName = 'test_table';
    protected static primaryKey = 'pk';
    protected static primaryKeyType = 'auto_increment';
    protected get primaryKeyValue() { return 'pk_val'; }
    protected static CREATE_QUERY = 'INSERT ... :primary_key_value...';
    protected static UPDATE_QUERY = 'INSERT ...';
    protected static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
    protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
    protected get databaseValues() {
      return {
        primary_key_value: this.pk,
        name: this.name,
      };
    }
    public static findAllTest() {
      return this.findAll({ querybase: 'test', values: { } });
    }
    public name: string;
    public pk: string;
    constructor(props: any) {
      super();
      this.pk = props.pk;
      this.name = props.name;
    }
  }
  class CustomPerson extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
    protected static createDatabaseConnection = createDatabaseConnectionMock as any as () => Promise<ValidConnectionType>;
    protected static tableName = 'test_table';
    protected static primaryKey = 'pk';
    protected static primaryKeyType = 'custom';
    protected get primaryKeyValue() { return 'pk_val'; }
    protected static CREATE_QUERY = 'INSERT ... :primary_key_value...';
    protected static UPDATE_QUERY = 'INSERT ...';
    protected static CREATE_IF_DNE_QUERY = 'INSERT IGNORE... :primary_key_value...';
    protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
    protected get databaseValues() {
      return {
        primary_key_value: this.pk,
        name: this.name,
      };
    }
    public static findAllTest() {
      return this.findAll({ querybase: 'test', values: { } });
    }
    public name: string;
    public pk: string;
    constructor(props: any) {
      super();
      this.pk = props.pk;
      this.name = props.name;
    }
  }
  class PersonWithConnectionDefined extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
    protected static managedDatabaseConnection = managedDatabaseConnection;
    protected static tableName = 'test_table';
    protected static primaryKey = 'pk';
    protected static primaryKeyType = 'uuid';
    protected get primaryKeyValue() { return 'pk_val'; }
    protected get databaseValues() {
      return {
        primary_key_value: this.pk,
        name: this.name,
      };
    }
    public static findAllTest() {
      return this.findAll({ querybase: 'test', values: { } });
    }
    public name: string;
    public pk: string;
    constructor(props: any) {
      super();
      this.pk = props.pk;
      this.name = props.name;
    }
  }
  describe('execute', () => {
    describe('connection methods', () => {
      describe('createDatabaseConnection connection method', () => {
        it('should be possible to execute an abstract query', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await Person.execute({ querybase: 'SELECT * FROM test' });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
        });
        it('should call end connection', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          await Person.execute({ querybase: 'SELECT * FROM :table_name' });
          expect(mockEnd.mock.calls.length).toEqual(1);
        });
        it('should call end connection even if error is thrown', async () => {
          mockExecute.mockRejectedValue(['hello']);
          try {
            await Person.execute({ querybase: 'SELECT * FROM :table_name' });
            throw new Error('should not reach here');
          } catch (error) {
            expect(error).toEqual(['hello']);
          }
          expect(mockEnd.mock.calls.length).toEqual(1);
        });
      });
      describe('promiseConnectionOrPool', () => {
        it('should be able to execute on a connection', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await PersonWithConnectionDefined.execute({ querybase: 'SELECT * FROM test' });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
        });
      });
    });
    describe('specifying constants', () => {
      it('should be possible to specify that a parameter is to be treated as a constant', async () => {
        mockExecute.mockResolvedValueOnce(['hello']);
        const result = await Person.execute({ querybase: 'SELECT x:name', values : { name: 'casey' } });
        expect(result).toEqual(['hello']);
        expect(mockExecute.mock.calls.length).toEqual(1);
        expect(mockExecute.mock.calls[0][0]).toEqual("SELECT 'casey'");
      });
    });
    describe('reserved namespace', () => {
      describe(':table_name', () => {
        it('should replace all :table_name with table_name value - one occurance', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await Person.execute({ querybase: 'SELECT * FROM :table_name' });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0]).toEqual('SELECT * FROM test_table');
        });
        it('should replace all :table_name with table_name value - multiple occurance', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await Person.execute({ querybase: 'SELECT * FROM :table_name join other_table on other_table.id=:table_name.id' });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0].trim()).toEqual('SELECT * FROM test_table join other_table on other_table.id=test_table.id');
        });
      });
      describe(':primary_key', () => {
        it('should replace all :primary_key with primary key name value - one occurance', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await Person.execute({ querybase: 'SELECT :primary_key FROM test_table' });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0]).toEqual('SELECT pk FROM test_table');
        });
        it('should replace all :primary_key with primary key name value - multiple occurance', async () => {
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await Person.execute({ querybase: 'SELECT :primary_key FROM test_table join other_table on other_table.id=:table_name.:primary_key' });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0].trim()).toEqual('SELECT pk FROM test_table join other_table on other_table.id=test_table.pk');
        });
        it('should not disfigure the :primary_key_value key', async () => { // previously :primary_key_value was disfigured into pk_value
          mockExecute.mockResolvedValueOnce(['hello']);
          const result = await Person.execute({ querybase: 'SELECT :primary_key FROM test_table where :primary_key=:primary_key_value', values: { primary_key_value: '12' } });
          expect(result).toEqual(['hello']);
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0].trim()).toEqual('SELECT pk FROM test_table where pk=?');
        });
      });
    });
  });
  describe('static crud', () => {
    describe('find all', () => {
      it('should be able to find and instantiate classes', async () => {
        mockExecute.mockResolvedValueOnce([[{ name: 'casey' }, { name: 'fred' }]]);
        const brookeses = await Person.findAllTest();
        expect(brookeses.length).toEqual(2);
        expect(brookeses[0].name).toEqual('casey');
        expect(brookeses[1].name).toEqual('fred');
        brookeses.forEach((brookes: Person) => expect(brookes.constructor).toEqual(Person));
      });
    });
    describe('find by id', () => {
      it('should be able to find and instantiate a class', async () => {
        mockExecute.mockResolvedValueOnce([[{ name: 'casey' }]]);
        const brookes = await Person.findByPrimaryKey(12);
        expect(brookes.name).toEqual('casey');
        expect(brookes.constructor).toEqual(Person);
      });
    });
    describe('find by unique attributes', async () => {
      it('should be able to find and instantiate a class', async () => {
        mockExecute.mockResolvedValueOnce([[{ name: 'casey', pk: '12' }]]);
        const brookes = await Person.findByUniqueAttributes({ name: 'casey' });
        expect(brookes.name).toEqual('casey');
        expect(brookes.pk).toEqual('12');
        expect(brookes.constructor).toEqual(Person);
      });
    });
  });
  describe('instance crud', () => {
    describe('create', () => {
      it('should be able to create', async () => {
        mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
        const person = new Person({ name: 'bessy' });
        const id = await person.create();
        expect(typeof id).toEqual('string');
      });
      describe('choice', () => {
        it('should default to regular create query', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 821 }]);
          const person = new IncrementalPerson({ name: 'bessy' });
          const id = await person.create();
          expect(typeof id).toEqual('number');
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0].trim()).toEqual('INSERT ... ?...');
        });
        it('should be able to run create if not defined query', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 921 }]);
          const person = new IncrementalPerson({ name: 'bessy' });
          const id = await person.create('CREATE_IF_DNE_QUERY');
          expect(typeof id).toEqual('number');
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][0].trim()).toEqual('INSERT IGNORE... ?...');
        });
      });
      describe('type: auto_increment', () => {
        it('should throw an error if value was defined', async () => {
          try {
            mockExecute.mockResolvedValueOnce([{ insertId: 821 }]);
            const person = new IncrementalPerson({ name: 'bessy', pk: 'test' });
            await person.create();
            throw new Error('should not reach here');
          } catch (error) {
            expect(error.message).toEqual('primary key value is already defined');
          }
        });
        it('should find that undefined was passed as the primary key value', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 821 }]);
          const person = new IncrementalPerson({ name: 'bessy' });
          await person.create();
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][1][0]).toEqual(undefined);
        });
        it('should find that the lastInsertedId was returned', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 821 }]);
          const person = new IncrementalPerson({ name: 'bessy' });
          const id = await person.create();
          expect(typeof id).toEqual('number');
          expect(id).toEqual(821);
        });
      });
      describe('type: uuid', () => {
        it('should throw an error if value was defined', async () => {
          try {
            mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
            const person = new IncrementalPerson({ name: 'bessy', pk: 'test' });
            await person.create();
            throw new Error('should not reach here');
          } catch (error) {
            expect(error.message).toEqual('primary key value is already defined');
          }
        });
        it('should find that undefined was passed as the primary key value', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
          const person = new Person({ name: 'bessy' });
          await person.create();
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(typeof mockExecute.mock.calls[0][1][0]).toEqual('string');
        });
        it('should find that the lastInsertedId was returned', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
          const person = new Person({ name: 'bessy' });
          const id = await person.create();
          expect(typeof id).toEqual('string');
        });
      });
      describe('type: custom', () => {
        it('should throw an error if value was not defined', async () => {
          try {
            mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
            const person = new CustomPerson({ name: 'bessy' });
            await person.create();
            throw new Error('should not reach here');
          } catch (error) {
            expect(error.message).toEqual('primary key value must be defined');
          }
        });
        it('should find that undefined was passed as the primary key value', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
          const person = new CustomPerson({ name: 'bessy', pk: '1234' });
          await person.create();
          expect(mockExecute.mock.calls.length).toEqual(1);
          expect(mockExecute.mock.calls[0][1][0]).toEqual('1234');
        });
        it('should find that the lastInsertedId was returned', async () => {
          mockExecute.mockResolvedValueOnce([{ insertId: 0 }]);
          const person = new CustomPerson({ name: 'bessy', pk: '1234' });
          const id = await person.create();
          expect(id).toEqual('1234');
        });
      });
    });
    describe('createIfDoesNotExist', () => {
      it('should be able to createIfDoesNotExist', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ name: 'bessy' });
        const id = await person.create('CREATE_IF_DNE_QUERY');
        expect(typeof id).toEqual('string');
      });
    });
    describe('update', () => {
      it('should be able to update', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ pk: '12', name: 'bessy' });
        const id = await person.update();
        expect(typeof id).toEqual('string');
      });
    });
    describe('delete', () => {
      it('should be able to delete', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ pk: '12', name: 'bessy' });
        await person.delete();
        expect(mockExecute.mock.calls.length).toEqual(1);
        expect(mockExecute.mock.calls[0]).toMatchObject(['DELETE FROM test_table WHERE pk=?;', ['12']]);
      });
      it('should throw error if pk not defined', async () => {
        const person = new Person({ name: 'bessy' });
        try {
          await person.delete();
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.message).toEqual('primary key value must be defined in order to delete');
        }
      });
    });
  });
});

/* tslint:disable max-classes-per-file */
import FundementalDatabaseModel from './fundementalDatabaseModel';
import { CreateDatabaseConnectionMethod } from './types.d';

const mockExecute = jest.fn().mockImplementation(() => []);
const mockEnd = jest.fn();
const createDatabaseConnectionMock = () => ({
  execute: mockExecute,
  end: mockEnd,
});

beforeEach(() => {
  mockExecute.mockClear();
  mockEnd.mockClear();
});
describe('FundementalDatabaseModel', () => {
  class Person extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
    protected static createDatabaseConnection = (createDatabaseConnectionMock as any as CreateDatabaseConnectionMethod);
    protected static tableName = 'test_table';
    protected static primaryKey = 'pk';
    protected get primaryKeyValue() { return 'pk_val'; }
    protected static CREATE_QUERY = 'INSERT ...';
    protected static UPDATE_QUERY = 'INSERT ...';
    protected static FIND_OR_CREATE_QUERY = 'call sp_find_or_create_example(:primary_key_value)';
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
    it('should be possible to execute an abstract query', async () => {
      mockExecute.mockResolvedValueOnce(['hello']);
      const result = await Person.execute({ querybase: 'SELECT * FROM test' });
      expect(result).toEqual(['hello']);
      expect(mockExecute.mock.calls.length).toEqual(1);
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
        const brookes = await Person.findById(12);
        expect(brookes.name).toEqual('casey');
        expect(brookes.constructor).toEqual(Person);
      });
    });
  });
  describe('instance crud', () => {
    describe('create', () => {
      it('should be able to create', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ name: 'bessy' });
        const id = await person.create();
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
    describe('findOrCreate', () => {
      it('should be able to findOrCreate', async () => {
        mockExecute.mockResolvedValueOnce([[{ pk: '12', name: 'casey' }]]);
        const person = new Person({ name: 'bessy' });
        const brookes = await person.findOrCreate();
        expect(brookes.name).toEqual('casey');
        expect(brookes.constructor).toEqual(Person); // should return a person
        expect(brookes.pk).toEqual('12'); // should find the pk
        mockExecute.mockResolvedValueOnce(true);
        expect(mockExecute.mock.calls[0][1][0]).not.toEqual(undefined); // primary key value we sent in query though should not be undefined, in case we did need to create it
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

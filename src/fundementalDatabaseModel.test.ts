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
    protected static FIND_OR_CREATE_QUERY = 'SELECT... IF... THEN...';
    protected get databaseValues() {
      return {
        primary_key_value: this.pk,
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
    it('should replace all :table_name with table_name value', async () => {
      mockExecute.mockResolvedValueOnce(['hello']);
      const result = await Person.execute({ querybase: 'SELECT * FROM :table_name' });
      expect(result).toEqual(['hello']);
      expect(mockExecute.mock.calls.length).toEqual(1);
      expect(mockExecute.mock.calls[0][0]).toEqual('SELECT * FROM test_table');
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
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ pk: '12', name: 'bessy' });
        const id = await person.findOrCreate();
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

/* tslint:disable max-classes-per-file */

import SchematicDatabaseModel from './model';
import { ConvinienceAttributes, StrictAttributes, ValidConnectionType } from './types.d';

const mockExecute = jest.fn().mockImplementation(() => []);
const mockEnd = jest.fn();
const createDatabaseConnectionMock = () => ({
  execute: (mockExecute as any),
  end: (mockEnd as any),
});

const personAttributes: ConvinienceAttributes = {
  person_id: 'uuid',
  name: {
    type: 'string',
    required: true,
  },
  middleName: 'string',
};

beforeEach(() => {
  mockExecute.mockReset();
  mockEnd.mockClear();
});
describe('SchematicDatabaseModel', () => {
  class Person extends SchematicDatabaseModel {
    protected static createDatabaseConnection = (createDatabaseConnectionMock as any as () => Promise<ValidConnectionType>);
    protected static tableName = 'people';
    protected static primaryKey = 'person_id';
    protected static primaryKeyType = 'uuid';
    protected static attributes = personAttributes;
    protected static CREATE_QUERY = 'INSERT ...';
    protected static UPDATE_QUERY = 'UPDATE ...';
    protected static UPSERT_QUERY = 'INSERT IGNORE... 2 :primary_key_value...';
    protected static FIND_BY_UNIQUE_ATTRIBUTES_QUERY = 'SELECT * ...';
  }
  class Person2 extends SchematicDatabaseModel {
    protected static createDatabaseConnection = (createDatabaseConnectionMock as any as () => Promise<ValidConnectionType>);
    protected static tableName = 'people';
    protected static primaryKey = 'person_id';
    protected static primaryKeyType = 'uuid';
    protected static attributes = personAttributes;
    protected static CREATE_QUERY = 'INSERT ...';
    protected static UPDATE_QUERY = 'UPDATE ...';
  }
  describe('static', () => {
    describe('schema and validation', () => {
      describe('getParsedAttributes', () => {
        it('should be able to parse a schema', () => {
          const parsedAttributes: StrictAttributes = (Person as any).getParsedAttributes(); // note - (x as any) gets around private var constraint
          expect(parsedAttributes).toMatchObject({
            name: {
              name: 'name',
              type: 'string',
              required: true,
            },
            middleName: {
              name: 'middleName',
              type: 'string',
              required: false,
            },
          });
        });
        it('should cache the parsedSchema results', () => {
          expect((Person2 as any).parsedAttributes).toEqual(undefined);
          (Person2 as any).getParsedAttributes(); // note - (x as any) gets around private var constraint
          expect((Person2 as any).parsedAttributes).not.toEqual(undefined);
        });
      });
      describe('validate', () => {
        describe('should be able to validate accurately', () => {
          const errorResults = [
            {
              props: {
                name: 'casey',
                middleName: 'louise',
              },
              errorLength: 0,
            },
            {
              props: {
                middleName: 'louise',
              },
              errorLength: 1,
            },
            {
              props: {
                name: 'casey',
                middleName: 123,
              },
              errorLength: 1,
            },
            {
              props: {
                middleName: 123,
              },
              errorLength: 2,
            },
          ];
          errorResults.forEach(({ props, errorLength }, index) => {
            it(`should find the accurate validation result for props set ${index}`, () => {
              const errors = Person.validate(props);
              expect(Object.keys(errors).length).toEqual(errorLength);
            });
          });
        });
      });
    });
  });
  describe('instantiated', () => {
    describe('should validate the props before initialization', () => {
      it('should throw error if props are invalid', () => {
        try {
          new Person({}); // tslint:disable-line
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('ValidationError');
        }
      });
      it('should validate successfuly for accurate props', () => {
        new Person({ name: 'casey' }); // tslint:disable-line
      });
    });
  });
  describe('data retreival getters', () => {
    describe('databaseValues', () => {
      it('should return valid data from props', () => {
        const person = new Person({ name: 'casey' });
        expect(person.name).toEqual('casey');
        expect(person.databaseValues).toMatchObject({
          name: 'casey',
        });
      });
    });
  });
  describe('database access', () => {
    describe('create', () => {
      it('should be able to update id after creating', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ name: 'bessy' });
        expect(typeof person.person_id).toEqual('undefined');
        await person.create();
        expect(typeof person.person_id).toEqual('string');
      });
    });
    describe('save', () => {
      it('should save if no id is defined', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ name: 'bessy' });
        expect(typeof person.person_id).toEqual('undefined');
        await person.save();
        expect(typeof person.person_id).toEqual('string');
        expect(mockExecute.mock.calls[0][0]).toEqual('INSERT ...');
      });
      it('should update if id is defined', async () => {
        mockExecute.mockResolvedValueOnce(true);
        const person = new Person({ person_id: '1a26c280-050f-11e9-8eb2-f2801f1b9fd1', name: 'bessy' });
        expect(typeof person.person_id).toEqual('string');
        await person.save();
        expect(mockExecute.mock.calls[0][0]).toEqual('UPDATE ...');
      });
    });
    describe('upsert', () => {
      it('should be able to upsert', async () => {
        mockExecute
          .mockResolvedValueOnce([true]) // the upsert
          .mockResolvedValueOnce([[{ person_id: '1a26c280-050f-11e9-8eb2-f2801f1b9fd1', name: 'casey' }]]); // the find
        const person = new Person({ name: 'bessy' });
        await person.upsert();
        expect(person.name).toEqual('casey');
        expect(person.constructor).toEqual(Person); // should return a person
        expect(person.person_id).toEqual('1a26c280-050f-11e9-8eb2-f2801f1b9fd1'); // should find the pk
        expect(mockExecute.mock.calls[0][0]).toEqual('INSERT IGNORE... 2 ?...');
        expect(mockExecute.mock.calls[0][1][0]).not.toEqual(undefined); // primary key value we sent in query though should not be undefined, in case we did need to create it
      });
    });
  });
});

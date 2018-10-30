/* tslint:disable max-classes-per-file */

import SchematicDatabaseModel from './model';
import { ConvinienceAttributes, StrictAttributes } from './types.d';

const mockExecute = jest.fn().mockImplementation(() => []);
const mockEnd = jest.fn();
const createDatabaseConnectionMock = () => ({
  execute: mockExecute,
  end: mockEnd,
});

const personAttributes: ConvinienceAttributes = {
  person_id: 'string',
  name: {
    type: 'string',
    required: true,
  },
  middleName: 'string',
};

beforeEach(() => {
  mockExecute.mockClear();
  mockEnd.mockClear();
});
describe('SchematicDatabaseModel', () => {
  class Person extends SchematicDatabaseModel {
    protected static createDatabaseConnection = createDatabaseConnectionMock;
    protected static tableName = 'people';
    protected static primaryKey = 'person_id';
    protected static attributes = personAttributes;
    protected static CREATE_QUERY = 'INSERT ...';
    protected static UPDATE_QUERY = 'UPDATE ...';
  }
  class Person2 extends SchematicDatabaseModel {
    protected static createDatabaseConnection = createDatabaseConnectionMock;
    protected static tableName = 'people';
    protected static primaryKey = 'person_id';
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
        const person = new Person({ person_id: '12', name: 'bessy' });
        expect(typeof person.person_id).toEqual('string');
        await person.save();
        expect(mockExecute.mock.calls[0][0]).toEqual('UPDATE ...');
      });
    });
  });
});

/* tslint:disable max-classes-per-file */

import SchematicDatabaseModel from './index';
import { ConvinienceSchema, StrictSchema } from './types.d';

const personSchema: ConvinienceSchema = {
  tableName: 'people',
  primaryKey: 'name',
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    middleName: 'string',
  },
};

describe('SchematicDatabaseModel', () => {
  class Person extends SchematicDatabaseModel {
    protected static schema = personSchema;
    public async create() { return new Person({}); }
    public async update() { return new Person({}); }
    public async delete() { return true; }
  }
  describe('static', () => {
    describe('schema and validation', () => {
      describe('getParsedSchema', () => {
        it('should be able to parse a schema', () => {
          const parsedSchema: StrictSchema = (Person as any).getParsedSchema(); // note - (x as any) gets around private var constraint
          expect(parsedSchema.attributes).toMatchObject({
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
          expect((Person as any).parsedSchema).toEqual(undefined);
          (Person as any).getParsedSchema(); // note - (x as any) gets around private var constraint
          expect((Person as any).parsedSchema).not.toEqual(undefined);
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
});

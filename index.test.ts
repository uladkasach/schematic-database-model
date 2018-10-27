import SchematicDatabaseModel from './index';

describe('SchematicDatabaseModel', () => {
  describe('static', () => {
    describe('schema and validation', () => {
      describe('getParsedSchema', () => {
        it('should be able to parse a schema', () => {
          class Person extends SchematicDatabaseModel {
            protected static schema = {
              tableName: 'people',
              attributes: {
                name: {
                  type: 'string',
                  required: true,
                },
                middleName: 'string',
              },
            };
          }
        });
        it('should cache the parsedSchema results', () => {

        });
      });
      describe('validate', () => {
      });
    });
  });
  describe('instantiated', () => {

  });
});

import addValidationToAttributes from './addValidationToAttributes';

describe('addValidationToAttributes', () => {
  describe('validate attribute config', () => {
    describe('wellKnownTypes', () => {
      it('should throw error if not known type is requested', () => {
        try {
          addValidationToAttributes({
            attributes: {
              test: {
                type: 'not-valid',
              },
            },
          });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('AttributeTypeError');
        }
      });

      const validtypes = ['string', 'int', 'float', 'boolean'];
      validtypes.forEach((type) => {
        it(`should not throw errors for attribute with type: ${type}`, () => {
          addValidationToAttributes({ attributes: { test: { type } } });
        });
      });
    });
    describe('customType', () => {
      it('should throw error if custom type defined but validation method not', () => {
        try {
          addValidationToAttributes({
            attributes: {
              test: {
                type: 'custom',
              },
            },
          });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('CustomAttributeMissingValidationError');
        }
      });
      it('should not throw error if custom type and validation methoddefined', () => {
        addValidationToAttributes({
          attributes: {
            test: {
              type: 'custom',
              validation: () => [],
            },
          },
        });
      });
    });
  });

  describe('validation methods', () => {
    describe('wellKnownTypes', () => {
      it('should validate string type accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'string',
            },
          },
        });
        expect(validation('test')).toHaveLength(0);
        expect(validation(12)).not.toHaveLength(0);
        expect(validation(true)).not.toHaveLength(0);
      });
      it('should validate int type accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'int',
            },
          },
        });
        expect(validation(12)).toHaveLength(0);
        expect(validation(12.3)).not.toHaveLength(0);
        expect(validation('test')).not.toHaveLength(0);
        expect(validation(true)).not.toHaveLength(0);
      });
      it('should validate float type accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'float',
            },
          },
        });
        expect(validation(12)).toHaveLength(0);
        expect(validation(12.3)).toHaveLength(0);
        expect(validation('test')).not.toHaveLength(0);
        expect(validation(true)).not.toHaveLength(0);
      });
      it('should validate boolean type accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'boolean',
            },
          },
        });
        expect(validation(true)).toHaveLength(0);
        expect(validation(12)).not.toHaveLength(0);
        expect(validation(12.3)).not.toHaveLength(0);
        expect(validation('test')).not.toHaveLength(0);
      });
      it('should validate datetime type accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'datetime',
            },
          },
        });
        expect(validation(12345)).toHaveLength(0); // dates may be defined as numbers
        expect(validation('2018-10-11')).toHaveLength(0);
        expect(validation(true)).not.toHaveLength(0);
        expect(validation('test')).not.toHaveLength(0);
      });
    });
    describe('required', () => {
      it('should validate not required, undefined value, accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'string',
              required: false,
            },
          },
        });
        expect(validation('test')).toHaveLength(0);
        expect(validation()).toHaveLength(0);
        expect(validation(null)).toHaveLength(0);
      });
      it('should validate required, undefined value, accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'string',
              required: true,
            },
          },
        });
        expect(validation('test')).toHaveLength(0);
        expect(validation()).not.toHaveLength(0);
      });
    });
    describe('custom validation', () => {
      it('should evaluate custom validation method accurately', () => {
        const { test: { validation } } = addValidationToAttributes({
          attributes: {
            test: {
              type: 'string',
              required: true,
              validation: value => (
                (['first', 'second', 'third'].indexOf(value) !== -1) // note: includes does not parse in ts-jest
                ? []
                : ['not valid for enum']
              ),
            },
          },
        });
        expect(validation('first')).toHaveLength(0);
        expect(validation('second')).toHaveLength(0);
        expect(validation('third')).toHaveLength(0);
        expect(validation('fircond')).not.toHaveLength(0);
        expect(validation('test')).not.toHaveLength(0);
      });
    });
  });
});

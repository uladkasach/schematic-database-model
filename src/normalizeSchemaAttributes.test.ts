import normalizeSchemaAttributes from './normalizeSchemaAttributes';

describe('normalizeSchemaAttributes', () => {
  describe('name', () => {
    it('should normalize shorthand notation into longhand', () => {
      const result = normalizeSchemaAttributes({
        attributes: {
          test: 'string',
        },
      });
      expect(result.test).toMatchObject({
        type: 'string',
      });
    });
    it('should append the name of the attribute', () => {
      const result = normalizeSchemaAttributes({
        attributes: {
          test: 'string',
        },
      });
      expect(result.test).toMatchObject({
        name: 'test',
      });
    });
  });
  describe('required', () => {
    it('should assign a default attribute.required = false ', () => {
      const result = normalizeSchemaAttributes({
        attributes: {
          test: 'string',
        },
      });
      expect(result.test).toMatchObject({
        required: false,
      });
    });
    it('should preserve requested boolean value of attribute.required', () => {
      const result = normalizeSchemaAttributes({
        attributes: {
          test: {
            type: 'string',
            required: true,
          },
        },
      });
      expect(result.test).toMatchObject({
        required: true,
      });
    });
  });
});

import normalizeSchemaAttributes from './normalizeSchemaAttributes';

describe('normalizeSchemaAttributes', () => {
  it('should normalize shorthand notation into longhand', () => {
    const result = normalizeSchemaAttributes({
      test: 'string',
    });
    expect(result.test).toMatchObject({
      type: 'string',
    });
  });
  it('should assign a default attribute.required = false ', () => {
    const result = normalizeSchemaAttributes({
      test: {
        type: 'string',
      },
    });
    expect(result.test).toMatchObject({
      required: false,
    });
  });
  it('should append the name of the attribute', () => {
    const result = normalizeSchemaAttributes({
      test: {
        type: 'string',
      },
    });
    expect(result.test).toMatchObject({
      name: 'test',
    });
  });
});

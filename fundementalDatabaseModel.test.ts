/* tslint:disable max-classes-per-file */

import FundementalDatabaseModel from './fundementalDatabaseModel';

const mockExecute = jest.fn().mockImplementation(() => []);
const createDatabaseConnectionMock = () => ({
  execute: mockExecute,
});

beforeEach(() => {
  mockExecute.mockClear();
});
describe('FundementalDatabaseModel', () => {
  class Person extends FundementalDatabaseModel { // tslint:disable-line no-unused -since we just want to check we can extend it
    protected static createDatabaseConnection = createDatabaseConnectionMock;
    public name: string;
    constructor(props: any) {
      super();
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
  });
  describe('static crud', () => {
    describe('find all', () => {
      it('should be able to find and instantiate classes', async () => {
        mockExecute.mockResolvedValueOnce([{ name: 'casey' }, { name: 'fred' }]);
        const brookeses = await Person.findAll({ querybase: 'test', values: { lastName: 'brookes' } });
        expect(brookeses.length).toEqual(2);
        expect(brookeses[0].name).toEqual('casey');
        expect(brookeses[1].name).toEqual('fred');
        brookeses.forEach((brookes: Person) => expect(brookes.constructor).toEqual(Person));
      });
    });
    describe('find or create', () => {
      it('should try to find ')
    });
  });
});

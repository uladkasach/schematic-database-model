import ManagedDatabaseConnection from './managedDatabaseConnection';

const mockExecute = jest.fn().mockImplementation(() => []);
const mockEnd = jest.fn();
const mockedConnectionObject = ({
  execute: mockExecute,
  end: mockEnd,
});
const createDatabaseConnection = jest.fn().mockResolvedValue(mockedConnectionObject);

beforeEach(() => {
  createDatabaseConnection.mockClear();
  mockExecute.mockClear();
  mockEnd.mockClear();
});
describe('ManagedDatabaseConnection', () => {
  it('should be able to start a database connection', async () => {
    const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
    await managedConnection.start();
    expect(createDatabaseConnection.mock.calls.length).toEqual(1);
  });
  it('should throw error if start was called twise', async () => {
    try {
      const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
      await managedConnection.start();
      await managedConnection.start();
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.constructor.name).toEqual('ConnectionStillRunningError');
    }
  });
  it('should throw error if execute was called before connection was started', async () => {
    try {
      const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
      await managedConnection.execute('boo');
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.constructor.name).toEqual('ConnectionNotRunningError');
    }
  });
  it('should be able to execute on a database connection', async () => {
    const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
    await managedConnection.start();
    await managedConnection.execute('boo');
    expect(mockExecute.mock.calls.length).toEqual(1);
  });
  it('should be able to end the connection', async () => {
    const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
    await managedConnection.start();
    await managedConnection.end();
    expect(mockEnd.mock.calls.length).toEqual(1);
  });
  it('should throw an error if end was called before connection was started', async () => {
    try {
      const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
      await managedConnection.end();
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.constructor.name).toEqual('ConnectionNotRunningError');
    }
  });
  it('should throw an error if end was called on an already ended connection', async () => {
    try {
      const managedConnection = new ManagedDatabaseConnection({ createConnectionOrPool: createDatabaseConnection });
      await managedConnection.end();
      await managedConnection.end();
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.constructor.name).toEqual('ConnectionNotRunningError');
    }
  });
});

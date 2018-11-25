import promiseToCreateADatabaseConnection from './databaseConnection';

/**
  define tests
*/
describe('database', () => {
  it('should be able to connect', async () => {
    const connection = await promiseToCreateADatabaseConnection();
    await connection.end();
  });
});

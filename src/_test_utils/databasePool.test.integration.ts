import promiseToCreateADatabasePool from './databasePool';

/**
  define tests
*/
describe('database', () => {
  it('should be able to connect', async () => {
    const connection = await promiseToCreateADatabasePool();
    await connection.end();
  });
});

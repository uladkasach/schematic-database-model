/**
  the purpose is to be able to explicitly manage database connection state and fail fast if our assumptions are wrong.

  the ManagedDatabaseConnection creates a managedConnection which must be explicitly `.start` ed before it can be used.
    - this normalizes the .end() connection requirement and makes the connection managment process much more explicit
*/
import { Connection, Pool } from 'mysql2/promise';
import { ConnectionStillRunningError, ConnectionNotRunningError } from './errors';

export default class ManagedDatabaseConnection {
  protected connectionOrPool: Connection | Pool | null;
  protected createConnectionOrPool: () => Promise<Connection | Pool>;
  constructor({ createConnectionOrPool }: { createConnectionOrPool: () => Promise<Connection | Pool> }) {
    this.connectionOrPool = null; // start off with connection not having been created
    this.createConnectionOrPool = createConnectionOrPool; // define privately the connection pool
  }

  public async start() {
    if (this.connectionOrPool !== null) throw new ConnectionStillRunningError(); // fail fast; we want the user to know that they should only start the connection once
    this.connectionOrPool = await this.createConnectionOrPool();
  }

  public async end() {
    if (this.connectionOrPool === null) throw new ConnectionNotRunningError();
    await this.connectionOrPool.end();
    this.connectionOrPool = null;
  }

  public async execute(sql: string, values: any): Promise<any> {
    if (this.connectionOrPool === null) throw new ConnectionNotRunningError();
    return this.connectionOrPool.execute(sql, values); // forward the connection command
  }
}

// tslint:disable max-classes-per-file

export class ConnectionStillRunningError extends Error {
  constructor() {
    const message = 'connection is still running';
    super(message);
  }
}

export class ConnectionNotRunningError extends Error {
  constructor() {
    const message = 'connection is not running';
    super(message);
  }
}

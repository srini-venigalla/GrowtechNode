import * as oracledb from 'oracledb';
import { isEmpty } from '../utils/functions';

const CONTEXT = process.env.DEPLOY;
const POOLSIZE = Number(process.env['PoolSize_' + CONTEXT] || '4');
const POOLMINSIZE = Number(process.env['PoolMinSize_' + CONTEXT] || Math.min(10, POOLSIZE / 2));

console.log({
  POOLSIZE,
  context: process.env.DEPLOY,
  client: process.env.CLIENT_ID,
  connection: process.env['DBUrl_' + CONTEXT],
  user: process.env['DBUser_' + CONTEXT],
});

const defaultPoolParams = {
  poolMax: POOLSIZE, // maximum size of the pool
  poolMin: POOLMINSIZE,
  poolIncrement: 2, // only grow the pool by one connection at a time
  poolTimeout: 4, // sec
  enableStatistics: true,
  queueTimeout: Number(process.env['queueTimeout_'+CONTEXT] || '10000'),
  stmtCacheSize: Number(process.env['StmtCacheSize_' + CONTEXT] || '50'),
};
class OracleDB {
  public static get Instance(): OracleDB {
    return this._instance || (this._instance = new this());
  }

  public static openCount = 0;

  public static closeInstance(): any {
    return this._instance = null;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static _instance: OracleDB;
  private oracle;
  private pool;
  private oraclePool;

  private constructor() {
    const LIBDIR = process.env.ORADB_INSTA_CLIENT;
    if (LIBDIR) oracledb.initOracleClient({ libDir: LIBDIR });
    this.oracle = null;
    this.oraclePool = null;
  }

  public getConfig = (pooled = null): any =>
    isEmpty(pooled)
      ? {
        user: process.env['DBUser_' + CONTEXT],
        password: Buffer.from(
          process.env['DBPass_' + CONTEXT],
          'base64'
        ).toString('ascii'),
        connectionString: process.env['DBUrl_' + CONTEXT],
      }
      : {
        user: process.env['DBUser_' + CONTEXT],
        password: Buffer.from(
          process.env['DBPass_' + CONTEXT],
          'base64'
        ).toString('ascii'),
        connectionString: process.env['DBUrl_' + CONTEXT],
        ...defaultPoolParams,
      };

  public async open(): Promise<any> {
    if (this.oracle !== null) return this.oracle;
    this.oracle = await oracledb.getConnection(this.getConfig());
    return this.oracle;
  }

  public logStats(): void {
    if (this.oraclePool) {
      this.oraclePool.logStatistics();
    }
  }

  public async openWithPool(dbConnection?: any): Promise<any> {
    if (dbConnection) return dbConnection;
    if (this.oraclePool !== null) {
      if ((OracleDB.openCount += 1) % (POOLSIZE * 10) === 0) {
        if (this.oraclePool) {
          this.oraclePool.logStatistics();
        }
      }
      return this.oraclePool.getConnection();
    }
    this.oraclePool = await oracledb.createPool(
      this.getConfig({ isPool: true })
    );
    return this.oraclePool.getConnection();
  }
  public async closeWithPool(connection): Promise<void> {
    return await connection.close();
  }
  public async close(): Promise<void> {
    this.oracle = null;
  }
  public async closePoolAndExit():Promise<void> {
    try {
      if (this.oraclePool) {
        console.log('closing pool');
        await this.oraclePool.close();
        console.log('closed pool');
        this.oraclePool = null;
      }
      if (oracledb.getPool()) {
        console.log('got default pool');
        await oracledb.getPool().close();
      }
    } catch (err) {
      console.log('error closing pool', err);
    }
  }
}

// tslint:disable-next-line: variable-name
export const OraclDBInstance = OracleDB.Instance;
// tslint:disable-next-line:variable-name
export const OraclDBClose = OracleDB.closeInstance;
export default OracleDB;

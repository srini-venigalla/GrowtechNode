import * as oracledb from 'oracledb';
import { ServicesError } from '../ErrorHandler';
import {
  OraclDBInstance
} from './OracleDB';
import { isEmpty } from '../utils/functions';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;
oracledb.fetchAsString = [oracledb.CLOB];

const MASTER_NODEBUG = false;

export const stmtPrimaryKeys = `SELECT  
user_cons_columns.owner          AS schema_name,  
user_cons_columns.table_name,  
user_cons_columns.column_name    AS COLUMNNAME,  
user_cons_columns.position,  
user_constraints.status  
FROM  
user_constraints,  
user_cons_columns 
WHERE user_constraints.constraint_type = 'P'  

AND user_constraints.constraint_name = user_cons_columns.constraint_name  

AND user_cons_columns.table_name = :tableName 
ORDER BY  
user_cons_columns.table_name,  
user_cons_columns.position`;

export const stmtCols = `SELECT  
  column_id,  
  table_name,  
  column_name  AS COLUMNNAME,  
  data_type    AS columntype,  
  nullable  
  FROM  
  user_tab_cols  
  WHERE  table_name = :tableName  
    AND user_generated = 'YES'
    order by COLUMN_ID`;

export const emptyColumns = `SELECT  t.column_name
FROM    user_tab_columns t
WHERE   t.nullable = 'Y'
        AND t.table_name = :tableName
        AND t.num_distinct = 0`;

export const toOracleTimestamp = (dt:any):any => dt ? `to_timestamp('${dt}', 'YYYY-MM-DD"T"HH24:MI:SS.FF"Z"')` : null;
const logValues = (x:any):any => {
  const { sql, url, duration, count, values, message = 'Success', nodebug = false } = x;
  console.log({ url: url ?? '', count, duration });
  if (nodebug) return;
  console.log(sql);
  console.log({ values, message });
};
const logError = (data):any => {
  const { e, sql, stmt, values, url, duration, body } = data;
  if (url) console.log(url || '');
  console.log(sql ?? stmt);
  logValues({ message: e.message, values, url, duration, requestBody: body ?? 'not available' });
};
export const executeMany = async (params: {
  sql: string,
  url?: string,
  values?: any,
  nodebug?: boolean
}):Promise<any> => {
  const { sql, url, nodebug = MASTER_NODEBUG, values = {} } = params;
  const next: any = new Date();
  return OraclDBInstance.openWithPool()
    .then(conn =>
      conn.executeMany(sql, values, { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT })
        .then(({ rows: success }) => {
          const now: any = new Date();
          if (!nodebug) logValues({ sql, url, nodebug, count: success.length, duration: now - next, values: success });
          OraclDBInstance.closeWithPool(conn);
          return success;
        })
        .catch(e => {
          logError({ e, sql, values, url });
          OraclDBInstance.logStats();
          OraclDBInstance.closeWithPool(conn);
          throw new ServicesError('Invalid Request', 204, e);
        })
    )
    .catch(e => {
      logError({ e, sql, values, url });
      OraclDBInstance.logStats();
      throw new ServicesError('Invalid Request', 204, e);
    });
};

// Promise
export const execute = async (params: { sql?: string, stmt?: string, values?: any, url?: string, body?: any, nodebug?: boolean }): Promise<any> => {
  const { sql, stmt, values = {}, url = null, body = null, nodebug = MASTER_NODEBUG } = params;
  const next: any = new Date();
  try  {
    const conn = await OraclDBInstance.openWithPool();
    try{
      const results = await conn.execute(sql ?? stmt, values);
      const  { rows: success } = results;
      const now: any = new Date();
      console.error('---------log-begin------------->');
      const duration = now - next;
      logValues({ nodebug, count: success?.length, sql: sql ?? stmt, url, duration, values, results: success });
      console.error('<--------log-end--------------');
      await OraclDBInstance.closeWithPool(conn);
      if (duration > 60000) {
        OraclDBInstance.logStats();
      }
      return new Promise((resolve) => {
        resolve(success);
      });

    }catch(e) {
      console.error('---------error-log-begin------------->');
      logError({ e, sql: sql ?? stmt, values, url, body });
      console.error('<--------error-log-end--------------');
      OraclDBInstance.logStats();
      await OraclDBInstance.closeWithPool(conn);
      throw new ServicesError('Invalid Request', 204, e);
    }
  } catch(e) {
    console.error('---------error-log-begin------------->');
    logError({ e, sql: sql ?? stmt, values, url });
    console.error('<--------error-log-end--------------');
    OraclDBInstance.logStats();
    throw new ServicesError('Invalid Request', 204, e);
  }
};

export const createClob = (params: { column: string, value: string }): Promise<any> => {
  const { column, value } = params;
  return OraclDBInstance.openWithPool()
    .then(async conn => {
      const clobVar = await conn.createLob(oracledb.CLOB);
      await clobVar.write(value);
      console.log({ value });
      await OraclDBInstance.closeWithPool(conn);
      return [column,  { dir: oracledb.BIND_IN, type: oracledb.CLOB, val: clobVar }];
    })
    .catch(e => {
      console.error('---------error-log-begin------------->');
      logError({ e });
      OraclDBInstance.logStats();
      throw new ServicesError('Invalid Request', 204, e);
    });
};

export const update = async (params: {
  sql: string;
  values?: any;
  url?: string;
  body?: any;
  nodebug?: boolean;
  commit?: boolean;
  dbConnection?: any;
}): Promise<any> => {
  const { sql, values = {}, url = null, body = null, nodebug = MASTER_NODEBUG, commit = true, dbConnection } = params;
  const next: any = new Date();
  try {
    const conn = await OraclDBInstance.openWithPool(dbConnection);
    try {
      const results = await conn.execute(sql, values, { autoCommit: commit ?? true });
      const { rowsAffected: success } = results;
      const now: any = new Date();
      logValues({ nodebug, sql, url, duration: now - next, values, results: success });
      if (isEmpty(dbConnection)) await OraclDBInstance.closeWithPool(conn); // do not close if external
      return new Promise((resolve) => {
        resolve({ success });
      });
    } catch (e) {
      logError({ e, sql, values, url, body });
      OraclDBInstance.logStats();
      if (isEmpty(dbConnection)) await OraclDBInstance.closeWithPool(conn); // do not close if external
      throw new ServicesError('Invalid Request', 204, e);
    }
  } catch (e) {
    console.error('---------error-log-begin------------->');
    logError({ e, sql, values, url });
    console.error('<--------error-log-end--------------');
    OraclDBInstance.logStats();
    throw new ServicesError('Invalid Request', 204, e);
  }
};

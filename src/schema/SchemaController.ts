import { Body, Controller, Get, Post, Request, Route } from 'tsoa';
import { capitalizedString, defaultValue, isEmpty, isUpperCase } from '../utils/functions';
import memoizee = require('memoizee');
import { execute } from '../oracle/oracleutils';

export interface ITableSchema {
  COLUMN_ID: number;
  COLUMNNAME: string;
  COLUMNTYPE: string;
  PRIMARYKEY: boolean;
  NULLABLE: any;
}

interface IQueryRequest {
  tableName: string;
  servicePoint: string;
}

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
    user_cons_columns.position
  `;

export const emptyColumns = `SELECT  t.column_name
  FROM    user_tab_columns t
  WHERE   t.nullable = 'Y'
          AND t.table_name = :tableName
          AND t.num_distinct = 0`;

@Route('/api/v1/schema')
class SchemaController extends Controller {
  public static getColumnNamesMz  = memoizee(async (tableName) => {
    return await SchemaController.getColumnNames(tableName);
  }, { length: 1, promise: true });

  public static getColumnNames = async (tableName):Promise<any> => {
    // Define the SQL query to select the primary key columns for the given table name
    const sql = `SELECT column_name FROM user_tab_columns 
      WHERE table_name = :tableName
      order by column_id`;

    // Execute the SQL query to get the primary key columns for the given table name
    const rows = await execute({ sql, nodebug: true, values: { tableName } });
    // Map the rows to an array of primary key column names
    return rows.map((row) => row.COLUMN_NAME);
  };
  public static getPrimaryKeyColumns = async (tableName):Promise<any> => {
    // Define the SQL query to select the primary key columns for the given table name
    const sql = `SELECT column_name
    FROM user_constraints indexes, user_cons_columns columns
    WHERE columns.table_name = :tableName
      AND indexes.constraint_type = 'P'
      AND indexes.constraint_name = columns.constraint_name
      AND columns.position is not null
      ORDER BY columns.position`;

    // Execute the SQL query to get the primary key columns for the given table name
    const rows = await execute({ sql, nodebug: true, values: { tableName } });
    // Map the rows to an array of primary key column names
    const primaryKeyColumns = rows.map((row) => row.COLUMN_NAME);

    // Call the callback function with the array of primary key column names
    return primaryKeyColumns;
  };
  public static getPrimaryKeyColumnsMz  = memoizee(async (tableName) => {
    return await SchemaController.getPrimaryKeyColumns(tableName);
  }, { length: 1, promise: true });

  public static async effdtQryComponents({ tableName, prefix='A' } ):Promise<any> {
    const allPrimaryKeys = await SchemaController.getPrimaryKeyColumnsMz(tableName);
    let primaryKeyColumns = allPrimaryKeys;
    console.log({ primaryKeyColumns });
    if (isEmpty(primaryKeyColumns)) throw 'No primary key setup';
    primaryKeyColumns = primaryKeyColumns?.filter?.((name) => !name.startsWith('EFF'));

    let columnList: any = await SchemaController.getColumnNamesMz(tableName);
    columnList = columnList?.filter?.((name) => !name.startsWith('EFF'));

    const effdtQry = `${prefix}.effdt = (SELECT MAX(effdt) FROM ${tableName} WHERE ${primaryKeyColumns
      .map((col) => `${col} = ${prefix}.${col}`)
      .join(' AND ')})`;

    const effseqQry = `${prefix}.effseq = (SELECT MAX(effseq) FROM ${tableName} WHERE ${primaryKeyColumns
      .map((col) => `${col} = ${prefix}.${col}`)
      .join(' AND ')} AND effdt = ${prefix}.effdt)`;

    const effStatusQry = `${prefix}.EFF_STATUS='A'`;

    return { effdtQry, effseqQry, effStatusQry, columnList, allPrimaryKeys, primaryDataColumns: primaryKeyColumns };
  }
  public static async effdtQryHandler({ tableName, prefix='A', values = {} } ):Promise<string> {
    const { effdtQry, effseqQry, columnList } = await SchemaController.effdtQryComponents({ tableName, prefix });
    const qryString = `
      SELECT ${columnList.map((col) => `${values[col] ? `'${values[col]}' ${col}`: `${prefix}.${col}`}`).join(', ')}
      FROM ${tableName} ${prefix}
      WHERE ${effdtQry}
      AND ${effseqQry}
    `;
    console.log(qryString);
    return qryString;
  }
  @Get('/effdtQry/{tableName}/{prefix}')
  public async getEffdtQuery(@Request() req: any, tableName: string, prefix = 'A'): Promise<any> {
    console.log({ tableName, prefix });

    if (!isUpperCase(tableName)) throw 'table name is not in upper case';

    return await SchemaController.effdtQryHandler({ tableName, prefix });
  }

  static async getTableSchemaByName(tableName: string, url= ''): Promise<ITableSchema[]> {
    const allColumns = await execute({
      url,
      sql: stmtCols,
      nodebug: true,
      values: { tableName },
    });

    const primaryKeys = await execute({
      url,
      sql: stmtPrimaryKeys,
      nodebug: true,
      values: { tableName },
    });

    const emptyColumnList = await execute({
      url,
      sql: emptyColumns,
      nodebug: true,
      values: { tableName },
    });

    const primaryColumns = primaryKeys.map((x) => x.COLUMNNAME);
    return allColumns.map((x) => ({
      ...x,
      PRIMARYKEY: primaryColumns.includes(x.COLUMNNAME),
      EMPTY: emptyColumnList.includes(x.COLUMNNAME),
    }));

  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getTableSchemaByNameMz  = memoizee(async (tableName, url) => {
    return await SchemaController.getTableSchemaByName(tableName);
  }, { length: 1, promise: true });

  @Post('/listTemplate')
  public async listTemplate(@Body() body: IQueryRequest): Promise<any> {
    const { tableName, servicePoint = 'servicePointName' } = body;
    if (!isUpperCase(tableName)) throw 'table name is not in upper case';
    const sql = await SchemaController.effdtQryHandler({ tableName });
    console.log(`@Get('/${servicePoint}')
    public async list${capitalizedString(servicePoint)}(@Request() req: any): Promise<any>{
      const { url } = req;
      const sql = ${'`'}${sql}${'`'};
      return await execute({ sql, url, values: {} })
    }`);
  }

  @Post('/upsertTemplate')
  public async getInsUpdRollfwdQuery(
    @Request() req: any,
    @Body() body: IQueryRequest,
  ): Promise<any> {
    const { url } = req;

    const { tableName, servicePoint = 'servicePointName' } = body;

    if (!isUpperCase(tableName)) throw 'table name is not in upper case';

    const tableSchema = await SchemaController.getTableSchemaByNameMz(tableName, url);
    let columnList = tableSchema.map(({ COLUMNNAME }) => COLUMNNAME);
    const nonNullables = tableSchema.filter(({ NULLABLE }) => NULLABLE !== 'Y').map(({ COLUMNNAME }) => COLUMNNAME);
    const columnTypes = Object.fromEntries(tableSchema.map(({ COLUMNNAME, COLUMNTYPE }) => [COLUMNNAME, COLUMNTYPE]));

    const getdefaultValueByType = (name:any):any => defaultValue(columnTypes[name]);

    const effectiveCols = columnList?.filter?.((name) => name.startsWith('EFF'));
    const masterCols = columnList?.filter?.((name) => name.startsWith('MS$') || ['MODIFIED_BY', 'MODIFIED_DT'].includes(name));
    console.log(`// ${servicePoint}`);

    const requiredInputCols = nonNullables
      ?.filter?.((name) => !effectiveCols.includes(name))
      ?.filter((name) => !masterCols.includes(name));

    console.log(`interface I${servicePoint}{
      ${requiredInputCols.map(col => `${col}: string`).join('; ')}
    }`);
    console.log(`@Post('/${servicePoint}')`);
    console.log(` public async ${servicePoint}
        (@Request() req: any, @Header('x-user-id') userId: string, @Body() body: I${servicePoint}): Promise<any>{`);
    console.log(' const { url } = req;');

    console.log(`
      const missingRequiredCols = [${requiredInputCols.map(col => `'${col}'`).join(', ')}].filter(name => isEmpty(body[name]));
      if (isNotEmpty(missingRequiredCols)) {
        throw \`${'Missing non-nullable columns: ${missingRequiredCols.join(\',\')}'}\`
      }`);

    console.log(`   const { ${requiredInputCols.join(', ')} } = body;`);

    columnList = columnList
      ?.filter?.((name) => !effectiveCols.includes(name))
      ?.filter((name) => !masterCols.includes(name));

    let primaryKeyColumns: any = tableSchema.filter(({ PRIMARYKEY }) => PRIMARYKEY).map(({ COLUMNNAME }) => COLUMNNAME);
    primaryKeyColumns = primaryKeyColumns?.filter?.((name) => !name.startsWith('EFF'));

    const getDefaultEffectiveValue = (name:any):any =>
      ({
        EFFDT: 'trunc(SYSDATE)',
        EFFSEQ: `nvl((select max(EFFSEQ)+1 from ${tableName}
          where ${primaryKeyColumns.map(col => `${col} = :${col}`).join(' and ')}
          and EFFDT=trunc(SYSDATE)), 1)`,
        EFF_STATUS: '\'A\'',
      }[name]);

    const getDefaultMasterColValue = (name:any):any =>
      ({
        MS$MODIFIED_BY: ':userId',
        MS$MODIFIED_DT: 'SYSTIMESTAMP',
        MODIFIED_BY: ':userId',
        MODIFIED_DT: 'SYSTIMESTAMP',
        MS$CREATE_DT: 'nvl(b.MS$CREATE_DT, systimestamp)',
      }[name]);

    const sql = `insert into ${tableName}
      (${requiredInputCols
    .concat(columnList.filter((name) => !requiredInputCols.includes(name)))
    .concat(effectiveCols).concat(masterCols).join(', ')})
      with inputdata as (
        select
        ${[
    requiredInputCols.map((name) => `:${name} ${name}`),
    columnList
      ?.filter((name) => !requiredInputCols.includes(name))
      .map((name) => `nvl(:${name}, ${getdefaultValueByType(name)}) ${name}`)].flat().join(', ')}
        from dual
      ),
      currentData as (
        SELECT ${columnList.map((name) => `a.${name}`).join(', ')}
        FROM ${tableName} a
        WHERE a.effdt = (SELECT MAX(effdt) FROM ${tableName} WHERE ${primaryKeyColumns.map((name) => `${name} = A.${name}`).join(' and ')})
        AND a.effseq = (SELECT MAX(effseq) FROM ${tableName} WHERE ${primaryKeyColumns.map((name) => `${name} = A.${name}`).join(' and ')} and effdt = a.effdt)
      )
      SELECT 
      ${[
    ...requiredInputCols.map((name) => `a.${name} ${name}`),
    ...columnList
      .filter((name) => !requiredInputCols.includes(name))
      .map((name) => `${requiredInputCols.includes(name) ? `nvl(a.${name}, b.${name})` : `nvl(nvl(a.${name}, b.${name}), ${getdefaultValueByType(name)})`} ${name}`),
    ...effectiveCols.map((name) => `${getDefaultEffectiveValue(name)} ${name}`),
    ...masterCols.map((name) => `${getDefaultMasterColValue(name)} ${name}`),
  ].join(', ')}
    FROM inputData a
    left Join currentData b on ${primaryKeyColumns.map((name) => `a.${name} = b.${name}`).join(' and ')}`;
    console.log(' ');
    console.log(`   const sql = \`
      ${sql}
    \``);
    console.log(' ');
    console.log(`   const values = { ${columnList.join(', ')}, userId }`);
    console.log('   return await update({ sql, url, values });');
    console.log(' }');
  }
}
export { SchemaController };

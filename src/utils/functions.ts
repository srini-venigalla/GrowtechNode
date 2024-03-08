/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/naming-convention */
const moment = require('moment');
const crypto = require('crypto');
const momentTz = require('moment-timezone');

const { v5: uuidv5 } = require('uuid');

export const stringHash = (input:any):any => {
  let hash = 0;
  let chr;
  if (input.length === 0) return hash;
  for (let i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const findUniqueColumnsWithPrefix = (prefixedColumns): any => {
  const uniqueColumns = [];
  const uniqueNames = [];
  for (const column of prefixedColumns) {
    // Extract the prefix and column name
    const [, columnName] = column.split('.');
    if (!uniqueNames.includes(columnName)){
      uniqueColumns.push(column);
      uniqueNames.push(columnName);
    }
  }
  return uniqueColumns;
};

export const adler32 = (str:any):any => {
  let a = 1, b = 0;
  const MOD_ADLER = 65521;

  for (let i = 0; i < str.length; i++) {
    a = (a + str.charCodeAt(i)) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }
  return b << 16 | a;
};
export const reversedStr = (str:any):any => str.split('').reverse().join('');
export const isUndef = (x:any):any => x === undefined;
export const isNotUndef = (x:any):any => !isUndef(x);

export const isMasterColumn = (a:any):any => a?.startsWith('MS$');
export const isNotMasterColumn = (a:any):any => !isMasterColumn(a);
export const stringHalves = (str:any):any => [str?.slice(0, str?.length / 2), str?.slice(str?.length / 2)];
export const uuidCheckSum = (str:any, seed:any):any => uuidv5(str, uuidv5(seed, uuidv5.DNS));

export const isStrTrue = (a:any):any => String(a).toLowerCase() === 'true';
export const isStrFalse = (a:any):any => !isStrTrue(a);

export const numericString = (str:any):any => str?.replace(/[a-z]/gi, (char) => char.toUpperCase().charCodeAt(0) - 64);
export const escapeQuotes = (str:any):any => str?.replace(/'/g, "''").replace(/\\&/g, '');

export const parenthesize = (str:any):any => isNotEmpty(str) ? `(${str})` : str;
const matchWildCards = (str:any, rule:any):any => {
  // for this solution to work on any string, no matter what characters it has
  const escapeRegex = (x:any):any => x?.replace(/([.*+?^=!:${}()|\\[\]\\/\\])/g, '\\$1');

  // "."  => Find a single character, except newline or line terminator
  // ".*" => Matches any string that contains zero or more characters
  let rewrittenRule = rule.split('*').map(escapeRegex);
  rewrittenRule = Array.isArray(rule) && rule.length > 1 ? rule.join('*') : `${rule}.*`;

  // "^"  => Matches any string with the following at the beginning of it
  // "$"  => Matches any string with that in front at the end of it
  rewrittenRule = `\\b${rewrittenRule}\\b`;
  // Create a regular expression object for matching string
  const regex = new RegExp(rewrittenRule, 'i');

  // Returns true if it finds a match, otherwise it returns false
  return regex.test(str);
};
export const flatten = (a:any):any => Array.isArray(a) ? [].concat(...a.map(flatten)) : a;
export const makeArray = (arrayOrItem:any):any => {
  if (Array.isArray(arrayOrItem)) return arrayOrItem;
  return [arrayOrItem];
};
export const isValidDate = (val:any):any => {
  if (typeof val === 'object') return typeof val.getMonth === 'function';
  return moment(val, [moment.ISO_8601], true).isValid();
};

export const extractFunctionInfo = (str:any):any => {
  const matches = str.match(/^(\w+)(?:\(([^)]*)\))?/);
  if (!matches) return null; // No match found, return null or handle the error accordingly
  const name = matches[1];
  const args = matches[2]?.split(',').map(arg => arg.trim());
  return { name, args };
};

const isMatch = (x:any, expn:any):any =>
  expn
    .split(',')
    .map((y) => matchWildCards(x, y))
    .some((a) => a);
export { isMatch, matchWildCards };
export const isEmpty = (obj:any):any => {
  if (typeof obj === 'number') return false;
  if (typeof obj === 'string') return obj.length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return obj == null || Object.keys(obj).length === 0 && obj.constructor === Object;
  if (typeof obj === 'boolean') return false;
  return !obj;
};
export const promiseCreator = (result:any):any => {
  return new Promise((resolve) => resolve(result));
};
export const executeSequentially = (promiseLikeArray:any):any => {
  let result = Promise.resolve();
  promiseLikeArray.forEach(function (promiseLike) {
    result = result.then(promiseLike).catch(error => {
      console.error(error);
    });
  });
  return result;
};
export const capitalizedString = (str:any):any => str.charAt(0).toUpperCase() + str.slice(1);

export const isDate = (value: any): boolean => value instanceof Date && !isNaN(value.getTime());

export const generateUUID = (size=12): string => {
  return crypto.randomBytes(size).toString('hex');
};

export const isNotEmpty = (obj): boolean => !isEmpty(obj);

export const isNotEmptyArray = (arr: any[]): boolean => arr.some((value: any) => isNotEmpty(value));

export const keys = (obj): any[] => {
  const keyList: any = [];
  for (const index in obj) keyList.push(index);
  return keyList;
};
export const isEffectiveColumn = (column:any):any =>
  ['EFFDT', 'EFFSEQ', 'EFF_STATUS'].includes(column) || column.startsWith('MS$');
export const effdtColumns = ['EFFDT', 'EFFSEQ'];
export const onlyEffdtCols = ({ COLUMN_NAME, COLUMNNAME }): boolean => effdtColumns.includes(COLUMN_NAME ?? COLUMNNAME);
export const values = (obj:any):any => {
  const keyList: any = [];
  for (const index in obj) keyList.push(index);
  return keyList.map(key => obj[key]);
};
export const noChecksumColumns = (colName:any):any => !['MS$CHECKSUM1', 'MS$CHECKSUM2'].includes(colName);
export const toDateChar = (column:any):any => `to_char(trunc(TO_TIMESTAMP(${column} ,'YYYY-MM-DD HH24:MI:SS.FF')),'DD-MON-YY')`;
export const toDateChar2 = (column:any):any =>
  `to_char(trunc(TO_TIMESTAMP(${column} ,'YYYY-MM-DD HH24:MI:SS.FF')),'DD-MON-YYYY')`;

export const isNonUSDateStr = (str:any):any => {
  const regex = /[0-9]{2}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2}/m;
  return regex.exec(str) !== null;
};

export const extractByNameOrAttr = ({ xmlObject, nameOrNames, responseData, debug = true }):any => {
  for (const key of Object.keys(xmlObject)) {
    if (debug) {
      //console.log({ key });
      if (key === 'wd:Document_ID') {
        console.log({ key, xmlObject, keys: Object.keys(xmlObject) });
      }
      if (key === 'wd:File_Name') {
        console.log({ key, xmlObject });
      }
      //console.log({ attr: xmlObject[key]?.['wd:type'] });
    }
    if (makeArray(nameOrNames).includes(key)) {
      if (!responseData[key]) {
        responseData[key] = xmlObject[key];
      } else {
        responseData[key] = [...makeArray(responseData[key]), xmlObject[key]]?.flat?.();
      }
      //console.log({ msg: '1', key, value: xmlObject[key]})
      //return responseData;
    } else if (makeArray(nameOrNames).includes(xmlObject[key]?.['wd:type'])) {
      const newKey = xmlObject[key]?.['wd:type'];
      const value = xmlObject['_'];
      if (!responseData[newKey]) {
        responseData[newKey] = value;
      } else {
        responseData[newKey] = [...makeArray(responseData[newKey]), value]?.flat?.();
      }
      //console.log({ msg: '2', key: xmlObject[key]?.['wd:type'], value: xmlObject['_']})
      //return responseData;
    }
    if (typeof xmlObject[key] === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      extractByNameOrAttr({ xmlObject: xmlObject[key], nameOrNames, responseData });
    }
  }
  return responseData;
};
export const convertStringToDate = (dateString: string): Date => moment(dateString, 'DD-MMM-YY hh.mm.ss.SSSSSSSSS A').toDate();

export const isUSDateStr = (str:any):any => {
  const regex = /^[0-9]{2}\/[0-9]{2}\/[0-9]{2}\s[0-9]{2}:[0-9]{2}$/;
  return regex.exec(str) !== null;
};
export const isUsDateOnlyStr = (str:any):any => {
  const regex = /^[0-9]{2}\/[0-9]{2}\/[0-9]{2}$/;
  return regex.exec(str) !== null;
};

export const isDateOnly = (str:any):any => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.exec(str) !== null;
};
export const isAnyDateStr = (str:any):any => isUSDateStr(str) || isNonUSDateStr(str);

export const isTimeStamp = (str:any):any => {
  const regex = /^\d{4}-\d{2}-[0-3]\d{1}T[0-2]\d{1}:[0-5]\d{1}:[0-5]\d{1}.[0-5]\d{2}Z/g;
  return regex.exec(str) !== null;
};

export const onlyNotEmpty = (cond:any):any => cond ?? false;
export const entries = (obj:any):any => Object.entries(obj);

export default {};
export const isNumeric = (input:any):any =>
  typeof input === 'number' ? true : input.toString().match(/^[-+]?\d*\.?\d*$/) !== null;

export const partitionBySize = (arr:any, size:any):any => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => {
    return arr.slice(i * size, i * size + size);
  });
};

// chatGpt 3.5
export const partitionArrayByColumn = (arr:any, columnName:any):any => {
  return arr.reduce((partitions, item) => {
    const columnValue = item[columnName] ?? 'null';
    if (!partitions[columnValue]) {
      partitions[columnValue] = [];
    }
    partitions[columnValue].push(item);
    return partitions;
  }, {});
};

// chatgpt 3.5
export const fromEntries = <T>(entrys: [string | number | symbol, T][]): { [k: string]: T } => {
  return Object.fromEntries(entrys);
};

export const chunkArray = partitionBySize;

export const defaultValueFromSchema = (column_name:any, schema:any):any => defaultValue(getDataType(column_name, schema));
export const defaultValue = (dataType:any):any => ({
  DATE: null,
  NUMBER: null,
  NVARCHAR2: "''",
  TIMESTAMP: null,
  VARCHAR2: "''",
  CHAR: "''",
}[dataType] ?? null);

export const isTextType = (dataType:any):any => ['CHAR', 'VARCHAR2', 'NCHAR', 'NVARCHAR2'].includes(dataType);

export const nvlValue = (dataType:any):any => ({
  DATE: 'current_date',
  NUMBER: 0,
  NVARCHAR2: "' '",
  CHAR: "' '",
  TIMESTAMP: 'current_date',
  VARCHAR2: "' '",
}[dataType] ?? ' ');

export const getDataType = (columnName:any, schema:any):any => schema.find(({ COLUMNNAME }) => COLUMNNAME === columnName)?.COLUMNTYPE;
const translatedDataType = (columnName:any, schema:any):any => {
  const dataType = getDataType(columnName, schema);
  if (isTextType(dataType)) return 'TEXT_TYPE';
  return dataType;
};
const ORA_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const isOraDateStr = (dateString:any):any => ORA_DATE_REGEX.test(dateString);
export const quoteValueByType = (column_name: any, schema: any, value: any): any => {
  let returnValue;
  let dataType;
  if (isEmpty(value)) {
    returnValue = 'null';
  } else {
    dataType = getDataType(column_name, schema);
    if (dataType.toLowerCase() === 'number') {
      returnValue = String(value);
    }
    else if (dataType.toLowerCase() === 'clob') {
      returnValue = String(escapeQuotes(value));
    }
    else {
      returnValue = `'${escapeQuotes(value)}'`;
    }
  }
  console.log({ column_name, dataType, value, returnValue });
  return returnValue;
};

export const isNullOrUndefined = (value:any):any => value === null || typeof value === 'undefined';
export const regexRegex = /\/(.+?)\//;
export const isUpperCase = (str:any):any => {
  return str === str.toUpperCase();
};
export const formatValueByType = (column_name, schema, value, timeZone = null, rowNo = 1):any => {
  if (isNullOrUndefined(value)) return null;
  const formatters = {
    DATE: (thisValue:any):any => {
      if (isEmpty(thisValue)) return thisValue;
      if (typeof thisValue === 'string' && isOraDateStr(thisValue) && isNotEmpty(timeZone)) {
        return momentTz.tz(thisValue, 'YYYY-MM-DD', timeZone).format('YYYY-MM-DD');
      } else {
        return moment(thisValue).utc().format('YYYY-MM-DD');
      }
    },
    TIMESTAMP: (thisValue:any):any => isNotEmpty(thisValue) ? moment(thisValue).utc().format('YYYY-MM-DD HH:mm:ss'): thisValue,
    'TIMESTAMP(6)': (thisValue:any):any => isNotEmpty(thisValue) ? moment(thisValue).utc().format('YYYY-MM-DD HH:mm:ss'): thisValue,
    TEXT_TYPE: (thisValue:any):any => escapeQuotes(String(thisValue)),
    CLOB: () =>`to_clob(:${column_name}_${rowNo})`
  };
  const formattedValue = (formatters[translatedDataType(column_name, schema)] ?? ((thisValue: any): any => thisValue))(value);
  return quoteValueByType(column_name, schema, formattedValue);
};

export const getBindingVariables = (sql:any):any => {
  const regex = /:[a-zA-Z_]+/g;
  const matches = sql.match(regex);
  return [...new Set(matches)].map((item: any) => item.slice(1));
};

const isDateType = (dataTypes:any, col:any):any => dataTypes?.find(({ column }) => column === col)?.dataType === 'date';

export const selectorCond = (params: { selector?: any, columnsPrefix?:any, dataTypes?: any }):boolean => {
  const { selector, columnsPrefix, dataTypes } = params;
  const prefixed = columnsPrefix?.find(sel => sel.SELECTOR === selector)?.SELECTORPREFIX ?? `A.${selector}`;
  return isDateType(dataTypes, selector) ? `trunc(${prefixed}, 'MI')` : prefixed;
};

export const filterSortCondition = (params: { selector?: any, columnsPrefix?: any, dataTypes?: any }):any => {
  const { selector, columnsPrefix, dataTypes } = params;
  const findDataType = (columnName:any):any => {
    const dataType = dataTypes?.find(({ column }) => columnName === column)?.dataType;
    console.log({ dataTypes, columnName, dataType });
    return dataType;
  };
  const selectorType = (thisSelector:any):any => {
    if (columnsPrefix.find(sel => sel.SELECTOR === thisSelector)) {
      return columnsPrefix?.find(sel => sel.SELECTOR === thisSelector)?.SELECTORTYPE;
    } else {
      return findDataType(thisSelector) ?? thisSelector;
    }
  };
  const selectorName = (thisSelector:any):any => columnsPrefix.find(sel => sel.SELECTOR === thisSelector)?.SELECTORPREFIX ?? `A.${thisSelector}`;
  if (selectorType(selector) === 'date') {
    return `trunc(${selectorName(selector)}, 'MI')`;
  } else if (selectorType(selector) === 'ic' || selectorType(selector) === 'string') {
    return `upper(${selectorName(selector)})`;
  } else if (selectorType(selector) === 'number') {
    return `to_number(${selectorName(selector)})`;
  } else if (selectorType(selector) === 'text') {
    return `to_char(${selectorName(selector)})`;
  }
  else {
    return selectorName(selector) ?? selector;
  }
};
export const trimIfString = (input:any):any => typeof input === 'string' ? input.trim() : input;

export const isDateCharFormat = (str:any):any => {
  const regex = /[0-9]{2}-[A-Z]{3}-[0-9]{2} [0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{6} [AaPp][Mm]/m;
  return regex.exec(str) !== null;
};
export const parseFilterOptions = (p: {
  filterOptions: any, columnNames?: any, defaultPrefix?: string, columnsPrefix?: any,
  dataTypes?: any
}):any => {
  const { filterOptions, columnNames = [], defaultPrefix, columnsPrefix = [], dataTypes } = p;
  const getDatatype = (columnName):any => {
    // columnName as 'A.columnName' need to pass columnName alone
    const extractColumnName = (input):any => {
      const parts = input.split('.');
      if (parts.length === 2) {
        return parts[1]; // Get the second part after splitting by '.'
      } else {
        return input; // If there's no '.', return the original input
      }
    };
    const dataType = dataTypes?.find(({ column }) => extractColumnName(columnName) === column)?.dataType ?? 'string';
    return dataType;
  };

  const fixArray = (optx): any => {
    if (!Array.isArray(optx)) return optx;
    const opt = optx.map((a) => a === '!' ? 'not' : trimIfString(a));
    if (opt.length === 3) {
      if (!Array.isArray(opt[0])) {
        if (columnNames.includes(opt[0])) opt[0] = `A.${opt[0]}`;
        else if (isNotEmpty(defaultPrefix)) opt[0] = `${defaultPrefix}.${opt[0]}`;
        else if (columnsPrefix.find(ele => ele.SELECTOR === opt[0])) opt[0] = columnsPrefix.find(ele => ele.SELECTOR === opt[0]).SELECTORPREFIX;
      }
      if (opt[2] === null) {
        opt[1] = 'is';
        opt[2] = 'null';
      }
      if (typeof opt[2] === 'string' && isDateCharFormat(opt[2])) {
        opt[1] = '=';
      }
      if (typeof opt[2] === 'string' && isAnyDateStr(opt[2])) {
        opt[1] = '=';
        opt[0] = `to_char(${opt[0]}, 'MM/DD/YY HH24:MI')`;
      }
      if (typeof opt[2] === 'string' && isUsDateOnlyStr(opt[2])) {
        opt[1] = '=';
        opt[0] = `to_char(${opt[0]}, 'MM/DD/YY')`;
      }
      if (typeof opt[2] === 'string' && isDateOnly(opt[2])) {
        opt[1] = '=';
        opt[0] = `to_char(${opt[0]}, 'YYYY-MM-DD')`;
      }
      if (typeof opt[2] === 'string' && isTimeStamp(opt[2])) {
        opt[1] = 'to_timestamp';
        //opt[2] = `to_timestamp('${opt[2]}', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')`;
      }
      if (opt[2] === '') {
        if (getDatatype(opt[0]) === 'date' || getDatatype(opt[0]) === 'DATE') {
          opt[1] = 'is';
          opt[2] = 'null';
        } else if (getDatatype(opt[0]) === 'number') {
          opt[1] = '=';
          opt[2] = 0;
        }
        else opt[2] = ' ';
      }
      if (opt[1] === 'contains') {
        opt[0] = `(${opt[0]})`;
        opt[1] = 'like';
        opt[2] = `('%${opt[2]}%')`;
      } else if (opt[1] === 'notcontains') {
        opt[0] = `(${opt[0]})`;
        opt[1] = 'not like';
        opt[2] = `('%${opt[2]}%')`;
      } else if (opt[1] === 'startswith') {
        opt[0] = `(${opt[0]})`;
        opt[1] = 'like';
        opt[2] = `('%${opt[2]}%')`;
      } else if (opt[1] === 'endswith') {
        opt[0] = `(${opt[0]})`;
        opt[1] = 'like';
        opt[2] = `('%${opt[2]}%')`;
      } else if (opt[1] === 'to_timestamp') {
        opt[0] = `TRUNC(${opt[0]} at TIME ZONE 'UTC', 'MI')`;
        opt[1] = '=';
        opt[2] = `to_timestamp('${opt[2]}', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') at TIME ZONE 'UTC'`;
      } else if (opt[1] === 'is') {
        // This condition will fix column is 'null' as column is null to make filter on null rows in data
      } else if (typeof opt[2] === 'string') {
        opt[2] = `'${opt[2]}'`;
      }
    }
    return opt;
  };

  const expandFilterOptions = (opt): any => {
    try {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'number') return opt;
      const optFixed = fixArray(opt);
      return `(${optFixed?.map?.(nextOpt => expandFilterOptions(nextOpt)).join(' ')})`;
    }catch (ex) {
      console.log('expandFilterOptions', { ex });
    }
    return null;
  };
  return parenthesize(
    fixArray(filterOptions)
      .map((opt) => expandFilterOptions(opt))
      .filter(onlyNotEmpty)
      .join(' '),
  );
};

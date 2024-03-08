// import postgreSQLTransport from './postgreSQLTransport';

const { transports, format, createLogger } = require('winston');
// tslint:disable-next-line:no-var-requires

// import config from '../config';

/*
const params = config.settings.pg[process.env.DEPLOY || 'default'];

const connectionString =
  `postgres://${params.user}:\
${params.password}@${params.host}:\
${params.port}/${params.database}`;

export const pgLoggerOptions = {
  connectionString,
  level: 'info',
  schema: 'public',
  table: 'nodelogs',
};
*/
export const winstonLoggerConsole = createLogger({
  format: format.combine(
    format.colorize({ all: true }),
    format.simple()
  ),
  transports: [
    new transports.Console(),
  ],
});
/*
export const winstonLoggerDB = createLogger({
  format: format.combine(
    format.simple()
  ),
  transports: [
    new postgreSQLTransport(pgLoggerOptions),
  ],
});
*/

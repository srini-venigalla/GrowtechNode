import * as debug from 'debug';
import * as http from 'http';
import App from './App';
import config from './config';

debug('ts-express:server');
process.on('exit', () => {
  console.log('exit');
});

export const getPort = (val: number | string): number | string | boolean => {
  const thisPort: number = typeof val === 'string' ? parseInt(val, 10) : val;
  if (isNaN(thisPort)) return val;
  if (thisPort >= 0) return thisPort;
  return false;
};

const port = getPort(config.settings.express[process.env.DEPLOY || 'development'].port);

App.set('port', port);

const server = http.createServer(App);
server.listen(port);
server.timeout = 1000 * 60 * 10;
server.on('error', onError);
server.on('listening', onListening);

console.log(process.memoryUsage());
const v8 = require('v8');
console.log(v8.getHeapStatistics());

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
  case 'EACCES':
    console.error(`${bind} requires elevated privileges`);
    process.exit(1);
    break;
  case 'EADDRINUSE':
    console.error(`${bind} is already in use`);
    process.exit(1);
    break;
  default:
    throw error;
  }
}
function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}
module.exports = App;

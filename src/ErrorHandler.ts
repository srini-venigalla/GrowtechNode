import { RequestHandler } from 'express-serve-static-core';
import { winstonLoggerConsole } from './logUtils';

const errorHandler = (err, req, res, next): RequestHandler => {
  if (res.headersSent) {
    return next(err);
  }
  console.log('errorHandler called: ', { err });

  winstonLoggerConsole.log({
    error: JSON.stringify(err),
    level: 'error',
  });
  /*
  winstonLoggerConsole.log('error',
                      (err.statusCode === undefined) ?
                        '000 - ' + err.name : err.statusCode  +  ' - ' + err.name,
                      { error: err.message }, null);
*/
  const error = new Error(JSON.stringify(err));

  // Return an error response object
  res.status(500).json({
    message: error.message,
    error: error
  });
  return null;
};
export class ServicesError extends Error {
  private statusCode: number;

  constructor(name: string, statusCode: number, message?: any) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

export default errorHandler;

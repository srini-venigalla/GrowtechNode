/* eslint-disable @typescript-eslint/naming-convention */
const basicAuthPassword = Buffer.from(process.env['basicAuthPassword_' + process.env.DEPLOY] || 'IA==', 'base64').toString('ascii');

export const URLS = {
  default: process.env.GTURLS,
  development: process.env['GTURLS_'+process.env.DEPLOY],
  production: process.env['GTURLS_'+process.env.DEPLOY],
  qa: process.env['GTURLS_'+process.env.DEPLOY],
};
export const adminEmail = {
  default: process.env.adminEmail,
  development: process.env['adminEmail_'+process.env.DEPLOY],
  production: process.env['adminEmail_'+process.env.DEPLOY],
  qa: process.env['adminEmail_'+process.env.DEPLOY],
};

export const settings = {
  express: {
    default: {
      port: process.env.BFFPORT || 5000,
    },
    development: {
      port: process.env.BFFPORT || 5000,
    },
    production: {
      port: process.env.BFFPORT || 5000,
    },
    qa: {
      port: process.env.BFFPORT || 5000,
    },
  },
  // tslint:disable-next-line:object-literal-sort-keys
  jwt: {
    secret: '@{t:s88H^q0RuC"oI{V,f}~~fMr^mOM>vh%)D]kRmB9iWT);QJJp1\'KzqD,tVt*',
  },
  mailer: {
    default: {
      host: process.env['GTEmailhost_'+process.env.DEPLOY],
      port: process.env['OCEmailport_'+process.env.DEPLOY],
      auth: {
        pass: Buffer.from(process.env['OCEmailPass_'+process.env.DEPLOY] || 'IA==', 'base64').toString('ascii'),
        user: process.env['OCEmailUser_'+process.env.DEPLOY],
      },
      fromAddress: process.env['OCEmailFrom_'+process.env.DEPLOY],
      secure: false, // true for 465, false for other ports
    },
  }
};

export const jwtConfig = {
  secret: '@{t:s88H^q0RuC"oI{V,f}~~fMr^mOM>vh%)D]kRmB9iWT);QJJp1\'KzqD,tVt*',
  loginExpiryInterval: 86400, // 24 hours in seconds
};

const config = {
  adminEmail: adminEmail[process.env.DEPLOY || 'default'],
  appUrl: URLS[process.env.DEPLOY || 'default'],
  getBasicAuthCredentials: (): any => ({ admin: process.env.BASIC_AUTH_PASSWORD || basicAuthPassword }),
  loginExpiryInterval: 86400, // 24 hours in seconds
  reportShowHistoryNoOfYear: 3,
  resetPasswordURLExpiry: 30, // minutes
  // tslint:disable-next-line:object-shorthand-properties-first
  settings,
};

export const getHeaders = ():any => {
  console.log(process.env.Z_USER_ID);
  return {
    'z-user-id': process.env.Z_USER_ID_SYS || process.env.Z_USER_ID,
    'z-project-id':process.env.Z_PROJECT_ID_SYS || process.env.Z_PROJECT_ID,
  };
};

export default config;
// end of file

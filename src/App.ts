import * as cors from 'cors';
import * as express from 'express';
import * as basicAuth from 'express-basic-auth';
import * as exjwt from 'express-jwt';
import * as swaggerUI from 'swagger-ui-express';
import config from './config';
import { OraclDBInstance } from './oracle/OracleDB';

import { RegisterRoutes } from './routes/routes';
import ErrorHandler from './ErrorHandler';
import { isEmpty } from './utils/functions';
import { JobController } from './batch/JobController';

const cache = require( 'persistent-cache' );

// tslint:disable-next-line:no-var-requires

// Creates and configures an ExpressJS web server.
class App {

  public express;
  public jobs;
  public static persistentCache;
  public static mailTransporter;

  constructor() {
    this.express = express();
    this.express.use(require('express-status-monitor')());
    this.middleware();
    this.startBatchJobs();
    this.routes();
    this.swaggerInit();
    this.staticInit();
    this.handleEvents();
    const CACHE_FILENAME = process.env.CACHE_FILENAME ?? '';
    const homedir = require('os').homedir();
    console.log((CACHE_FILENAME ?? '').replace(/~/g, homedir));
    App.persistentCache = isEmpty(CACHE_FILENAME)
      ? cache()
      : cache({
        base: CACHE_FILENAME.replace(/~/g, homedir),
        name: 'oneconnect',
      });
  }

  public startBatchJobs(): void {
    this.jobs = JobController.batchJobs();
    this.jobs.forEach(job => job.start());
  }
  public stopBatchJobs(): void {
    this.jobs.forEach(job => job.stop());
  }

  private handleEvents(): void {
    const self = this;
    function signalHandler() : void{
      OraclDBInstance.closePoolAndExit();
      self.stopBatchJobs();
      process.exit();
    }
    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);
    process.on('SIGQUIT', signalHandler);
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(cors());
    this.express.options('*', cors()); // include before other routes

    this.express.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    // this.express.use(logger("dev"));
    this.express.use(express.json({ limit: '500mb' }));
    this.express.use(express.urlencoded({ extended: false }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const jwtMW = exjwt({
      secret: config.settings.jwt.secret,
    });

    this.express.use(
      '/api/public',
      basicAuth({
        challenge: true,
        users: config.getBasicAuthCredentials(),
      })
    );
    // this.express.use("/api/v1", jwtMW);
    RegisterRoutes(this.express);
    this.express.use(ErrorHandler);
  }

  private swaggerInit(): any {
    const swaggerJSON = require('./swagger/swagger.json');
    this.express.use('/swagger.json', express.static(`${__dirname}/swagger/swagger.json`));
    this.express.use('/api', swaggerUI.serve, swaggerUI.setup(swaggerJSON));
  }
  private staticInit(): any {
    this.express.use('/images', express.static(`${__dirname}/images`));
  }

  private routes(): void {
    const router = express.Router({ strict: true });

    // placeholder route handler
    router.get('/', (req, res) => {
      res.json({
        message: 'Hello World, This is Node.js!',
      });
    });
    this.express.use('/', router);
  }

}
const app = new App();
export const jobs = app.jobs;
export default app.express;
export const persistentCache = App.persistentCache;

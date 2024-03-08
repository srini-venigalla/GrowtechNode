import { Controller } from 'tsoa';
import * as batchScheduler from 'node-cron';

class JobController extends Controller {
  public static batchJobs = ():any => {
    const jobMap: Map<string, batchScheduler.ScheduledTask> = new Map();
    return jobMap;
  };
}
export { JobController };

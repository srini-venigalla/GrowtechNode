import { Controller, Get, Request } from 'tsoa';
import { Route } from 'tsoa';
import { execute } from '../oracle/oracleutils';

@Route('/api/v1/growtech')
class PlantController extends Controller{
  @Get('/palmplants')
  public async getPalmPlants(@Request() req: any): Promise<any>{
    const { url } = req;
    const sql = `
      SELECT A.ASSET_ID, A.ASSET_TYPE_ID, A.ASSET_NAME, A.LOCATION, A.ACQUISITION_DATE, A.STATUS
      FROM ASSET A
      WHERE A.effdt = (SELECT MAX(effdt) FROM ASSET WHERE ASSET_ID = A.ASSET_ID)
      AND A.effseq = (SELECT MAX(effseq) FROM ASSET WHERE ASSET_ID = A.ASSET_ID AND effdt = A.effdt)
      order by to_number(substr(A.Asset_id, 2))
    `;
    return await execute({ sql, url, values: {} });
  }

}
export { PlantController };

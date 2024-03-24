import { Controller, Get, Request } from 'tsoa';
import { Route } from 'tsoa';
import { execute } from '../oracle/oracleutils';

@Route('/api/v1/growtech')
class PlantController extends Controller{
  @Get('/palmplants')
  public async getPalmPlants(@Request() req: any): Promise<any>{
    const { url } = req;
    const sql = `
    with PlantData as (
      select B.ASSET_ID, B.TRACKING_DT, B.COVERPLANTS, B.CROWNING, B.NOTES, B.STATUS PLANT_STATUS, B.SOIL, B.STEM_COUNT,
      B.CANOPY_WIDTH, B.DIAMETER, B.HEIGHT, 
      B.GRADE, B.FERTILIZER
      from PLANT_DATA B
      where B.effdt = (SELECT MAX(effdt) FROM PLANT_DATA WHERE ASSET_ID = B.ASSET_ID group by ASSET_ID)
      AND B.effseq = (SELECT MAX(effseq) FROM PLANT_DATA WHERE ASSET_ID = B.ASSET_ID AND effdt = B.effdt  group by ASSET_ID, EFFDT)
    )
      SELECT A.ASSET_ID, A.ASSET_TYPE_ID, A.ASSET_NAME, A.LOCATION, A.ACQUISITION_DATE, A.STATUS ASSET_STATUS,
      B.TRACKING_DT, B.COVERPLANTS, B.CROWNING, B.NOTES, B.PLANT_STATUS, B.SOIL, B.STEM_COUNT, B.CANOPY_WIDTH, B.DIAMETER, B.HEIGHT, 
      B.GRADE, B.FERTILIZER
      FROM ASSET A
      left join plantData B on A.ASSET_ID = B.ASSET_ID
      WHERE A.effdt = (SELECT MAX(effdt) FROM ASSET WHERE ASSET_ID = A.ASSET_ID)
      AND A.effseq = (SELECT MAX(effseq) FROM ASSET WHERE ASSET_ID = A.ASSET_ID AND effdt = A.effdt)
      order by nvl(TRACKING_DT, trunc(SYSDATE)), to_number(substr(A.Asset_id, 2))
    `;
    return await execute({ sql, url, values: {} });
  }

}
export { PlantController };

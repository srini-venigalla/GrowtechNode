import { Body, Controller, Get, Header, Post, Request } from 'tsoa';
import { Route } from 'tsoa';
import { execute, update } from '../oracle/oracleutils';
import { isEmpty, isNotEmpty } from '../utils/functions';
interface IupsertPlantdata {
  ASSET_ID: string;
  TRACKING_DT?: string;
  COVERPLANTS?: string;
  CROWNING?: string;
  NOTES?: string;
  STATUS?: string;
  SOIL?: string;
  STEM_COUNT?: number;
  CANOPY_WIDTH?: number;
  DIAMETER?: number;
  HEIGHT?: number;
  GRADE?: string;
  FERTILIZER?: string;
}
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
      order by TRACKING_DT desc nulls last, to_number(substr(A.Asset_id, 2))
    `;
    return await execute({ sql, url, values: {} });
  }

@Post('/upsertPlantdata')
  public async upsertPlantdata
  (@Request() req: any, @Header('x-user-id') userId: string, @Body() body: IupsertPlantdata): Promise<any>{
    const { url } = req;

    const missingRequiredCols = ['ASSET_ID'].filter(name => isEmpty(body[name]));
    if (isNotEmpty(missingRequiredCols)) {
      throw `Missing non-nullable columns: ${missingRequiredCols.join(',')}`;
    }
    const { ASSET_ID, TRACKING_DT, COVERPLANTS, CROWNING, NOTES, STATUS,
      SOIL, STEM_COUNT, CANOPY_WIDTH, DIAMETER, HEIGHT, GRADE, FERTILIZER } = body;

    const sql = `
    insert into PLANT_DATA (ASSET_ID, TRACKING_DT, COVERPLANTS, CROWNING, NOTES, STATUS, SOIL, STEM_COUNT, CANOPY_WIDTH, DIAMETER, 
      HEIGHT, GRADE, FERTILIZER, EFFDT, EFFSEQ, EFF_STATUS)
    with inputdata as (
      select
      :ASSET_ID ASSET_ID, nvl(to_date(:TRACKING_DT,'MM/DD/YY'), trunc(sysdate)) TRACKING_DT, nvl(:COVERPLANTS, '') COVERPLANTS, nvl(:CROWNING, '') CROWNING, 
      nvl(:NOTES, '') NOTES, nvl(:STATUS, '') STATUS, nvl(:SOIL, '') SOIL, nvl(:STEM_COUNT, null) STEM_COUNT,
      nvl(:CANOPY_WIDTH, null) CANOPY_WIDTH, nvl(:DIAMETER, null) DIAMETER, nvl(:HEIGHT, null) HEIGHT, nvl(:GRADE, '') GRADE, 
      nvl(:FERTILIZER, '') FERTILIZER
      from dual
    ),
    currentData as (
      SELECT a.ASSET_ID, a.TRACKING_DT, a.COVERPLANTS, a.CROWNING, a.NOTES, a.STATUS, a.SOIL, a.STEM_COUNT, a.CANOPY_WIDTH, a.DIAMETER, a.HEIGHT, a.GRADE, a.FERTILIZER
      FROM PLANT_DATA a
      WHERE a.effdt = (SELECT MAX(effdt) FROM PLANT_DATA WHERE ASSET_ID = A.ASSET_ID
        group by ASSET_ID)
      AND a.effseq = (SELECT MAX(effseq) FROM PLANT_DATA WHERE ASSET_ID = A.ASSET_ID and effdt = a.effdt
        group by ASSET_ID, EFFDT)
    )
    SELECT 
    a.ASSET_ID ASSET_ID, nvl(nvl(a.TRACKING_DT, b.TRACKING_DT), null) TRACKING_DT, nvl(nvl(a.COVERPLANTS, b.COVERPLANTS), '') COVERPLANTS, nvl(nvl(a.CROWNING, b.CROWNING), '') CROWNING, nvl(nvl(a.NOTES, b.NOTES), '') NOTES, nvl(nvl(a.STATUS, b.STATUS), '') STATUS, nvl(nvl(a.SOIL, b.SOIL), '') SOIL, nvl(nvl(a.STEM_COUNT, b.STEM_COUNT), null) STEM_COUNT, nvl(nvl(a.CANOPY_WIDTH, b.CANOPY_WIDTH), null) CANOPY_WIDTH, nvl(nvl(a.DIAMETER, b.DIAMETER), null) DIAMETER, nvl(nvl(a.HEIGHT, b.HEIGHT), null) HEIGHT, nvl(nvl(a.GRADE, b.GRADE), '') GRADE, nvl(nvl(a.FERTILIZER, b.FERTILIZER), '') FERTILIZER, trunc(SYSDATE) EFFDT, nvl((select max(EFFSEQ)+1 from PLANT_DATA
        where ASSET_ID = :ASSET_ID
        and EFFDT=trunc(SYSDATE)  group by ASSET_ID, EFFDT ), 1) EFFSEQ, 'A' EFF_STATUS
  FROM inputData a
  left Join currentData b on a.ASSET_ID = b.ASSET_ID
  `;

    const values = { ASSET_ID, TRACKING_DT, COVERPLANTS, CROWNING, NOTES, STATUS, SOIL, STEM_COUNT,
      CANOPY_WIDTH, DIAMETER, HEIGHT, GRADE, FERTILIZER };
    return await update({ sql, url, values });
  }

}
export { PlantController };

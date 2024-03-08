import { Body, Controller, Get, Header, Post, Request, Route } from 'tsoa';
import { isEmpty, isNotEmpty } from '../utils/functions';
import { execute, update } from '../oracle/oracleutils';
interface IupsertAsset{
  ASSET_ID: string;
  ASSET_TYPE_ID: string, ASSET_NAME: string, LOCATION: string, ACQUISITION_DATE: Date, STATUS: string
}
@Route('/api/v1/growtech')
class AssetController extends Controller {
  @Get('/assets')
  public async listAssets(@Request() req: any): Promise<any>{
    const { url } = req;
    const sql = `
      SELECT A.ASSET_ID, A.ASSET_TYPE_ID, A.ASSET_NAME, A.LOCATION, A.ACQUISITION_DATE, A.STATUS
      FROM ASSET A
      WHERE A.effdt = (SELECT MAX(effdt) FROM ASSET WHERE ASSET_ID = A.ASSET_ID)
      AND A.effseq = (SELECT MAX(effseq) FROM ASSET WHERE ASSET_ID = A.ASSET_ID AND effdt = A.effdt)
    `;
    return await execute({ sql, url, values: {} });
  }

  @Post('/upsertAsset')
  public async upsertAsset(@Request() req: any, @Header('x-user-id') userId: string, @Body() body: IupsertAsset): Promise<any>{
    const { url } = req;

    const missingRequiredCols = ['ASSET_ID'].filter(name => isEmpty(body[name]));
    if (isNotEmpty(missingRequiredCols)) {
      throw `Missing non-nullable columns: ${missingRequiredCols.join(',')}`;
    }
    const { ASSET_ID, ASSET_TYPE_ID, ASSET_NAME, LOCATION, ACQUISITION_DATE, STATUS } = body;

    const sql = `
      insert into ASSET
      (ASSET_ID, ASSET_TYPE_ID, ASSET_NAME, LOCATION, ACQUISITION_DATE, STATUS, EFFDT, EFFSEQ, EFF_STATUS)
      with inputdata as (
        select
        :ASSET_ID ASSET_ID, nvl(:ASSET_TYPE_ID, null) ASSET_TYPE_ID, nvl(:ASSET_NAME, '') ASSET_NAME, nvl(:LOCATION, '') LOCATION,
        nvl(:ACQUISITION_DATE, null) ACQUISITION_DATE, nvl(:STATUS, '') STATUS
        from dual
      ),
      currentData as (
        SELECT a.ASSET_ID, a.ASSET_TYPE_ID, a.ASSET_NAME, a.LOCATION, a.ACQUISITION_DATE, a.STATUS
        FROM ASSET a
        WHERE a.effdt = (SELECT MAX(effdt) FROM ASSET WHERE ASSET_ID = A.ASSET_ID)
        AND a.effseq = (SELECT MAX(effseq) FROM ASSET WHERE ASSET_ID = A.ASSET_ID and effdt = a.effdt)
      )
      SELECT 
      a.ASSET_ID ASSET_ID,
      nvl(nvl(a.ASSET_TYPE_ID, b.ASSET_TYPE_ID), null) ASSET_TYPE_ID,
      nvl(nvl(a.ASSET_NAME, b.ASSET_NAME), '') ASSET_NAME,
      nvl(nvl(a.LOCATION, b.LOCATION), '') LOCATION,
      nvl(nvl(a.ACQUISITION_DATE, b.ACQUISITION_DATE), null) ACQUISITION_DATE,
      nvl(nvl(a.STATUS, b.STATUS), '') STATUS,
      trunc(SYSDATE) EFFDT, nvl((select max(EFFSEQ)+1
      from ASSET where ASSET_ID = :ASSET_ID
          and EFFDT=trunc(SYSDATE)), 1) EFFSEQ, 'A' EFF_STATUS
    FROM inputData a
    left Join currentData b on a.ASSET_ID = b.ASSET_ID
    `;

    const values = { ASSET_ID, ASSET_TYPE_ID, ASSET_NAME, LOCATION, ACQUISITION_DATE, STATUS, userId };
    return await update({ sql, url, values });
  }

}
export { AssetController };

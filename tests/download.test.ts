import { TomateMods } from '../src';
import { fabricLoader } from '../src/modloaders';
import 'dotenv/config';
import fs from 'fs';

test('download', async () => {
  const mods = new TomateMods(
    'Tomate0613/tomate-mods/1.0.0',
    process.env.CURSEFORGE_API_KEY
  );

  fs.rmSync('mr.jar', { force: true });
  fs.rmSync('cf.jar', { force: true });

  const modrinthVersion = await mods.findVersion(
    {
      id: 'aCkoEaRG',
      provider: 'modrinth',
    },
    fabricLoader,
    ['1.20.1']
  ); // a mod from modrinth only
  const curseforgeVersion = await mods.findVersion(
    {
      id: '292908',
      provider: 'curseforge',
      slug: 'illuminations',
    },
    fabricLoader,
    ['1.19.2']
  ); // a mod from curseforge only

  await mods.downloadMod(modrinthVersion, 'mr.jar');
  await mods.downloadMod(curseforgeVersion, 'cf.jar');

  // TODO: Add test for popup downloads
});

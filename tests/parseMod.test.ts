import { TomateMods } from '../src';
import { fabricLoader } from '../src/modloaders';
import fs from 'fs';
import 'dotenv/config';

test('download', async () => {
  const mods = new TomateMods(
    'Tomate0613/tomate-mods/1.0.0',
    process.env.CURSEFORGE_API_KEY
  );

  fs.rmSync('cf.jar', { force: true });
  fs.rmSync('mr.jar', { force: true });

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

  const parsedMod = await mods.parseMod('mr.jar');

  expect(parsedMod).toStrictEqual({
    id: 'immersive-cursedness',
    version: '1.5.0',
    provider: 'custom',
    name: 'Immersive Cursedness',
    description:
      'Immersive portals but serverside. Together with some lovely cursed multithreading',
    slug: 'immersive-cursedness',
    authors: ['TheEpicBlock'],
    dependencies: [],
    updateVersion: null,
  });

  const fileMetadataModrinth = await mods.fileMetadata('mr.jar', fabricLoader, [
    '1.20.1',
  ]);
  const curseforgeModMetadata = await mods.fileMetadata(
    'cf.jar',
    fabricLoader,
    ['1.19.2']
  );

  expect(fileMetadataModrinth).toStrictEqual({
    authors: ['Creeper Host'],
    dependencies: [
      { dependencyType: 'required', id: 'P7dR8mSH', version: null },
    ],
    description: "An updated version of TheEpicBlock's Immersive Cursedness",
    id: 'aCkoEaRG',
    name: 'Immersive Cursedness Updated',
    provider: 'modrinth',
    slug: 'immersive-cursedness-updated',
    updateVersion: null,
    version: 'ruf3b0YU',
  });

  expect(curseforgeModMetadata).toStrictEqual({
    id: 'illuminations',
    version: '1.10.11',
    provider: 'custom',
    name: 'Illuminations',
    description:
      'Fireflies, other illuminations to make your world more enjoyable in darkness and player cosmetics.',
    slug: 'illuminations',
    authors: ['doctor4t'],
    dependencies: [],
    updateVersion: null,
  });
});

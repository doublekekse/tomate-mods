import { TomateMods } from '../src';
import { fabricLoader } from '../src/modloaders';
import 'dotenv/config';

test('find version', async () => {
  const mods = new TomateMods(
    'Tomate0613/tomate-mods/1.0.0',
    process.env.CURSEFORGE_API_KEY
  );

  const modrinthVersion = await mods.findVersion(
    {
      id: 'DFqQfIBR',
      provider: 'modrinth',
    },
    fabricLoader,
    ['1.12.2']
  );

  expect(modrinthVersion).toStrictEqual({
    id: 'DFqQfIBR',
    provider: 'modrinth',
    version: {
      id: 'CuXYUc2Q',
      project_id: 'DFqQfIBR',
      author_id: '99RdWNq1',
      featured: false,
      name: 'CraftPresence v2.2.3 (1.12.2)',
      version_number: '2.2.3+1.12.2',
      changelog:
        "# CraftPresence Changes\n\n## v2.2.3 (09/14/2023)\n\n_A Detailed Changelog from the last release is\navailable [here](https://gitlab.com/CDAGaming/CraftPresence/-/compare/release%2Fv2.2.2...release%2Fv2.2.3)_\n\nSee the Mod Description or [README](https://gitlab.com/CDAGaming/CraftPresence) for more info regarding the mod.\n\n### Fixes\n\n* Backend: Fixed exceptions in `FileUtils#filesInDir` that were not being ignored correctly\n    * This was previously resolved in v2.2.2 for BTA 1.7.7.0_02\n    * BTAs 1.7.7.0_01 build does not contain this fix\n\n___\n\n### More Information\n\n#### Known Issues\n\nDespite configuration compatibility being ensured between v1.8.x/v1.9.x and v2.0,\ncaution is advised to ensure the best experience, while also baring in mind that features can be adjusted, removed, or\nadded/iterated upon between releases.\n\nThe following known issues are present in this build:\n\n* On certain MC versions, Scrolling while in a Scroll List drawing `ItemStack`'s may cause GUI distortions\n* Text with colors do not retain those colors if that text moves to a newline in the CraftPresence UIs\n* The HypherionMC Config Layer (To Convert a Simple RPC config to CraftPresence) contains the following known issues:\n    * Placeholders related to the realm event are currently unimplemented and parse as `{''}`.\n\n#### Snapshot Build Info\n\nSome Versions of this Mod are for Minecraft Snapshots or Experimental Versions, and as such, caution should be noted.\n\nAny Snapshot Build released will be marked as **ALPHA** to match its Snapshot Status depending on tests done before\nrelease\nand issues found.\n\nSnapshot Builds, depending on circumstances, may also contain changes for a future version of the mod, and will be noted\nas so if this is the case with the `-Staging` label.\n",
      changelog_url: null,
      date_published: '2023-09-14T15:56:46.212522Z',
      downloads: 90,
      version_type: 'release',
      status: 'listed',
      requested_status: null,
      files: [
        {
          hashes: {
            sha512:
              'be7debd605930df437b8d6c27074c551a301f9053b401875969322e619dcb04bb7eb31c41fdd2c58c924481fc4cc5477b212570996eb93f5c51b865a986eae4d',
            sha1: 'c3afd28f7ca18bc74b03c8e8be5cd88219311160',
          },
          url: 'https://cdn.modrinth.com/data/DFqQfIBR/versions/CuXYUc2Q/CraftPresence-2.2.3%2B1.12.2.jar',
          filename: 'CraftPresence-2.2.3+1.12.2.jar',
          primary: true,
          size: 2273585,
          file_type: null,
        },
      ],
      dependencies: [],
      game_versions: ['1.12.2'],
      loaders: ['fabric', 'forge'],
    },
  });

  const curseforgeVersion = await mods.findVersion(
    {
      id: '274259',
      provider: 'curseforge',
      slug: 'carry-on',
    },
    fabricLoader,
    ['1.19.4']
  );

  expect(curseforgeVersion).toStrictEqual({
    id: '274259',
    provider: 'curseforge',
    version: {
      id: 4729950,
      gameId: 432,
      modId: 274259,
      isAvailable: true,
      displayName: 'carryon-fabric-1.19.4-2.0.6.27',
      fileName: 'carryon-fabric-1.19.4-2.0.6.27.jar',
      releaseType: 1,
      fileStatus: 4,
      hashes: [
        { value: '4559189bf33d3ba557f54a8da87ec12a979b597b', algo: 1 },
        { value: '792808d2ca3359cd0dcbff455d7425eb', algo: 2 },
      ],
      fileDate: '2023-08-30T20:48:39.5Z',
      fileLength: 445793,
      downloadCount: 1,
      downloadUrl:
        'https://edge.forgecdn.net/files/4729/950/carryon-fabric-1.19.4-2.0.6.27.jar',
      gameVersions: ['1.19.4', 'Fabric'],
      sortableGameVersions: [
        {
          gameVersionName: '1.19.4',
          gameVersionPadded: '0000000001.0000000019.0000000004',
          gameVersion: '1.19.4',
          gameVersionReleaseDate: '2023-03-09T00:00:00Z',
          gameVersionTypeId: 73407,
        },
        {
          gameVersionName: 'Fabric',
          gameVersionPadded: '0',
          gameVersion: '',
          gameVersionReleaseDate: '2022-09-01T00:00:00Z',
          gameVersionTypeId: 68441,
        },
      ],
      dependencies: [],
      alternateFileId: 0,
      isServerPack: false,
      fileFingerprint: 854431530,
      modules: [
        { name: 'META-INF', fingerprint: 369081290 },
        { name: 'LICENSE_carryon', fingerprint: 2972570874 },
        { name: 'logo.png', fingerprint: 4036356024 },
        { name: 'carryon.fabric.mixins.json', fingerprint: 1955743543 },
        { name: 'assets', fingerprint: 2134697875 },
        { name: 'pack.mcmeta', fingerprint: 1677690403 },
        { name: 'fabric.mod.json', fingerprint: 2245986454 },
        { name: 'carryon.mixins.json', fingerprint: 669811253 },
        { name: 'data', fingerprint: 1734879053 },
        { name: 'carryon-fabric-1.19.4-refmap.json', fingerprint: 3639741345 },
        { name: 'tschipp', fingerprint: 4025129186 },
      ],
    },
    slug: 'carry-on',
  });
});

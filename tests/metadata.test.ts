import { TomateMods } from '../src';
import { fabricLoader } from '../src/modloaders';
import 'dotenv/config';

test('metadata', async () => {
  const mods = new TomateMods(
    'Tomate0613/tomate-mods/1.0.0',
    process.env.CURSEFORGE_API_KEY
  );

  const modrinthModMetadata = await mods.getInstalledModMetadata(
    {
      provider: 'modrinth',
      id: 'P7dR8mSH',
      version: 'uIYkhRbX',
    },
    fabricLoader,
    ['1.19.4']
  );

  expect(modrinthModMetadata).toStrictEqual({
    authors: ['modmuss50', 'Player'],
    dependencies: [],
    description:
      'Lightweight and modular API providing common hooks and intercompatibility measures utilized by mods using the Fabric toolchain.',
    id: 'P7dR8mSH',
    name: 'Fabric API',
    provider: 'modrinth',
    slug: 'fabric-api',
    updateVersion: {
      author_id: 'JZA4dW8o',
      changelog:
        '- Bump version (modmuss50)\n- Improve Indigo and FRAPI Test Mod (#3208) (PepperCode1)\n- Make DFU error-tolerant to mod custom generator types (#3213) (qouteall)\n- Make deprecated modules opt-out instead of opt-in (#3246) (modmuss, Juuz)\n- Fix #3255 (#3257) (modmuss)\n',
      changelog_url: null,
      date_published: '2023-08-13T16:04:10.735444Z',
      dependencies: [],
      downloads: (modrinthModMetadata as any).updateVersion.downloads,
      featured: false,
      files: [
        {
          file_type: null,
          filename: 'fabric-api-0.87.0+1.19.4.jar',
          hashes: {
            sha1: '240e4b81231005d72ccd62a068fc68e86bad87a0',
            sha512:
              'eb108e3d8476994e80cfc9cf693bf3c665f8a57ecc1a0f81890470241876ad6c5182effdeca50d05bb99a65c3274659bab473d13ec1a43eba69e84cdb3ef7667',
          },
          primary: true,
          size: 2055666,
          url: 'https://cdn.modrinth.com/data/P7dR8mSH/versions/LKgVmlZB/fabric-api-0.87.0%2B1.19.4.jar',
        },
      ],
      game_versions: ['1.19.4'],
      id: 'LKgVmlZB',
      loaders: ['fabric'],
      name: '[1.19.4] Fabric API 0.87.0+1.19.4',
      project_id: 'P7dR8mSH',
      requested_status: null,
      status: 'listed',
      version_number: '0.87.0+1.19.4',
      version_type: 'release',
    },
    version: 'uIYkhRbX',
  });

  const curseforgeModMetadata = await mods.getInstalledModMetadata(
    {
      provider: 'curseforge',
      id: '306612',
      version: '4663818',
    },
    fabricLoader,
    ['1.19.4']
  );

  expect(curseforgeModMetadata).toStrictEqual({
    id: '306612',
    version: '4663818',
    provider: 'curseforge',
    name: 'Fabric API',
    description: 'Core API library for the Fabric toolchain',
    slug: 'fabric-api',
    authors: ['modmuss50', 'sfPlayer1'],
    dependencies: [],
    updateVersion: {
      id: 4702953,
      gameId: 432,
      modId: 306612,
      isAvailable: true,
      displayName: '[1.19.4] Fabric API 0.87.0+1.19.4',
      fileName: 'fabric-api-0.87.0+1.19.4.jar',
      releaseType: 1,
      fileStatus: 4,
      hashes: [
        { value: '240e4b81231005d72ccd62a068fc68e86bad87a0', algo: 1 },
        { value: '29ea7d5e97ca8d9b6c2f638b1c646e78', algo: 2 },
      ],
      fileDate: '2023-08-13T16:03:43.537Z',
      fileLength: 2055666,
      downloadCount: 0,
      downloadUrl:
        'https://edge.forgecdn.net/files/4702/953/fabric-api-0.87.0+1.19.4.jar',
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
      fileFingerprint: 2019067201,
      modules: [
        { name: 'META-INF', fingerprint: 2115683750 },
        { name: 'LICENSE-fabric-api', fingerprint: 3574284957 },
        { name: 'assets', fingerprint: 860504683 },
        { name: 'fabric.mod.json', fingerprint: 1738826858 },
      ],
    },
  });
});

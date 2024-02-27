import axios, { AxiosInstance } from 'axios';
import {
  CurseforgeDependencyList,
  DownloadPopup,
  InstalledModMetadata,
  InstalledResourceMetadata,
  ModLoader,
  Resource,
  SearchResult,
} from '../../types';
import {
  CF2Addon,
  CF2File,
  CF2FileRelationType,
  CF2GameId,
  CF2GetAddonResponse,
  CF2GetFingerprintMatchesResponse,
  CF2GetModFileResponse,
  CF2GetModFilesResponse,
  CF2HashAlgo,
  CF2SearchModsResponse,
} from 'curseforge-v2';
import fs from 'fs';
import checkFile from '../../checkFile';
import { IncomingMessage } from 'http';
import murmur2 from 'murmur2';

const API_BASE_URL = 'https://api.curseforge.com/';

export class CurseforgeApi {
  private api: AxiosInstance;

  constructor(userAgent: string, curseforgeApiKey: string) {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'User-Agent': userAgent,
        'x-api-key': curseforgeApiKey,
      },
    });
  }

  async getInstalledModMetadata(
    mod: { id: string; version: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<InstalledModMetadata> {
    const {
      data: { data: metadata },
    } = await this.api.get<CF2GetAddonResponse>(`/v1/mods/${mod.id}`);
    // const description = await this.api.get(`/v1/mods/${mod.id}/description`);

    const version = await this.getVersion(mod);

    return this.installedModMetadata(
      mod,
      version,
      metadata,
      modLoader,
      gameVersions
    );
  }

  async getInstalledResourceMetadata(
    resource: Resource
  ): Promise<InstalledResourceMetadata> {
    const {
      data: { data: metadata },
    } = await this.api.get<CF2GetAddonResponse>(`/v1/mods/${resource.id}`);

    return {
      id: resource.id,
      provider: resource.provider,
      version: resource.version,

      name: metadata.name,
      description: metadata.summary,
      authors: metadata.authors.map((author) => author.name),
      icon: metadata.logo.url,
    };
  }

  private async installedModMetadata(
    mod: { id: string; version: string },
    version: CF2File,
    metadata: CF2Addon,
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<InstalledModMetadata> {
    let updateVersion = null;

    if (modLoader.overrideMods[mod.id]) {
      updateVersion =
        (await this.findModVersion(mod, modLoader, gameVersions)) ?? null;
    }

    if (
      !updateVersion &&
      metadata.latestFiles[0].id.toString() !== mod.version
    ) {
      const latestVersion = await this.findModVersion(
        mod,
        modLoader,
        gameVersions
      );

      if (!latestVersion) throw new Error('Could not find version');

      if (latestVersion.id.toString() !== mod.version) {
        updateVersion = latestVersion;
      }
    }

    return {
      id: metadata.id.toString(),
      version: mod.version,
      provider: 'curseforge',

      name: metadata.name,
      description: metadata.summary,
      slug: metadata.slug,
      authors: metadata.authors.map((author) => author.name),
      icon: metadata.logo.url,

      dependencies: version.dependencies.map((dependency) => ({
        dependencyType: this.dependencyType(dependency.relationType),
        id: dependency.modId.toString(),
        version: dependency.fileId.toString(),
      })),

      updateVersion,
    };
  }

  async searchResource(
    query: string,
    queryParams: URLSearchParams
  ): Promise<SearchResult> {
    queryParams.set('searchFilter', query);
    queryParams.set('gameId', CF2GameId.Minecraft.toString());

    const {
      data: {
        data: searchHits,
        pagination: { totalCount: count },
      },
    } = await this.api.get<CF2SearchModsResponse>(
      `/v1/mods/search?${queryParams}`
    );

    return {
      hits: await Promise.all(
        searchHits.map(async (hit) => ({
          id: hit.id.toString(),
          provider: 'curseforge',

          versions: hit.latestFiles,

          name: hit.name,
          description: hit.summary,
          authors: hit.authors.map((author) => author.name),
          icon: hit.logo?.url,
          slug: hit.slug,
        }))
      ),

      count,
    };
  }

  async searchMod(
    query: string,
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<SearchResult> {
    const [gameVersion] = gameVersions;

    const queryParams = new URLSearchParams({
      gameId: CF2GameId.Minecraft.toString(),
      gameVersion,
      searchFilter: query,
      modLoaderType: modLoader.curseforgeCategory,
      classId: '6',
      pageSize: '20',
      // TEMP DISABLE AS CURSEFORGE API SEEMS TO BE BROKEN
      // sortField: query ? undefined : 2,
      // sortOrder: 'desc',
    });

    const search = await this.api.get<CF2SearchModsResponse>(
      `/v1/mods/search?${queryParams}`
    );

    return {
      hits: await Promise.all(
        search.data.data.map(async (hit) => {
          override: if (modLoader.overrideMods[hit.id]) {
            const overrideId = modLoader.overrideMods[hit.id];

            const {
              data: { data: metadata },
            } = await this.api.get<CF2GetAddonResponse>(
              `/v1/mods/${overrideId}`
            );

            if (
              !(await this.findModVersion(
                { id: overrideId },
                modLoader,
                gameVersions
              ))
            ) {
              break override;
            }

            return {
              id: overrideId,
              provider: 'curseforge',

              name: metadata.name,
              description: metadata.summary,
              icon: metadata.logo.url,
              authors: metadata.authors.map((author) => author.name),
              slug: metadata.slug,
            };
          }

          return {
            id: hit.id.toString(),
            provider: 'curseforge',

            name: hit.name,
            description: hit.summary,
            icon: hit.logo.url,
            authors: hit.authors.map((author) => author.name),
            slug: hit.slug,
          };
        })
      ),
      count: search.data.pagination.totalCount,
    };
  }

  dependencyType(relationType: CF2FileRelationType) {
    let dependencyType: 'required' | 'optional' | 'incompatible' | 'embedded';

    switch (relationType) {
      case CF2FileRelationType.Include:
      case CF2FileRelationType.EmbeddedLibrary:
        dependencyType = 'embedded';
        break;
      case CF2FileRelationType.Incompatible:
        dependencyType = 'incompatible';
        break;
      case CF2FileRelationType.RequiredDependency:
        dependencyType = 'required';
        break;
      case CF2FileRelationType.OptionalDependency:
        dependencyType = 'optional';
        break;
      default:
        throw new Error(
          '[tomate-mods] Unsupported dependency type: ' + relationType
        );
    }

    return dependencyType;
  }

  async listVersions(id: string, queryParams = '') {
    try {
      const {
        data: { data: versions },
      } = await this.api.get<CF2GetModFilesResponse>(
        `v1/mods/${id}/files${queryParams}`
      );

      return versions;
    } catch (e) {
      return [];
    }
  }

  async findModVersion(
    mod: { id: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    try {
      const [version] = await this.listVersions(
        mod.id,
        `?modId=${mod.id}&gameVersion=${gameVersions[0]}&modLoaderType=${modLoader.curseforgeCategory}`
      );

      return version;
    } catch (e) {
      return undefined;
    }
  }

  async getVersion(mod: { id: string | number; version: string | number }) {
    const {
      data: { data: version },
    } = await this.api.get<CF2GetModFileResponse>(
      `/v1/mods/${mod.id}/files/${mod.version}`
    );

    return version;
  }

  async download(
    mod: { id: string; version: CF2File; slug: string },
    downloadPath: string,
    downloadPopup?: DownloadPopup,
    retry = 5
  ): Promise<void> {
    const hash = mod.version.hashes.find(
      (hash) => hash.algo === CF2HashAlgo.Sha1
    )?.value;
    const url = mod.version.downloadUrl;

    const windowDownload = !url;

    if (!windowDownload) {
      const { data } = await axios.get<IncomingMessage>(url, {
        responseType: 'stream',
      });
      data.pipe(fs.createWriteStream(downloadPath));

      await new Promise<void>((resolve, reject) => {
        data.on('end', () => {
          resolve();
        });

        data.on('error', () => {
          reject();
        });
      });
    } else {
      const url = `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}/download/${mod.version.id}`;

      if (!downloadPopup) {
        throw new Error(`Can't download ${mod.slug} without a downloadPopup`);
      }

      await downloadPopup(url, downloadPath);
    }

    if (hash && !checkFile(downloadPath, hash)) {
      if (fs.existsSync(downloadPath)) fs.rmSync(downloadPath);

      if (--retry < 0) throw new Error('Failed to download mod');

      return this.download(mod, downloadPath, downloadPopup, retry);
    }
  }

  async fileMetadata(
    modPath: string,
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    const hash = murmur2(fs.readFileSync(modPath), 1, true);
    const hash2 = murmur2(fs.readFileSync(modPath), 1, false);

    const {
      data: {
        data: { exactMatches: fingerprintMatches },
      },
    } = await this.api.post<CF2GetFingerprintMatchesResponse>(
      `/v1/fingerprints`,
      {
        fingerprints: [hash, hash2],
      }
    );

    if (!fingerprintMatches) throw new Error('Failed to get fingerprints');
    const match = fingerprintMatches[0];
    if (!match) throw new Error('Failed to get fingerprints');

    const { file } = match;

    return this.getInstalledModMetadata(
      {
        id: file.modId.toString(),
        version: file.id.toString(),
      },
      modLoader,
      gameVersions
    );
  }

  async listDependencies(
    mod: {
      provider: 'curseforge';
      slug: string;
      id: string;
      version: CF2File;
    },
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    const dependencies: CurseforgeDependencyList = await Promise.all(
      mod.version.dependencies.map(async (dependency) => {
        let version: CF2File | undefined;

        if (dependency.fileId) {
          version = await this.getVersion({
            id: dependency.modId,
            version: dependency.fileId,
          });
        } else {
          version = await this.findModVersion(
            { id: dependency.modId.toString() },
            modLoader,
            gameVersions
          );
        }

        const {
          data: { data: metadata },
        } = await this.api.get<CF2GetAddonResponse>(`/v1/mods/${mod.id}`);

        return {
          dependencyType: this.dependencyType(dependency.relationType),

          mod: {
            id: mod.id,
            version,
            provider: 'curseforge',
            slug: metadata.slug,
          },
        };
      })
    );

    return dependencies;
  }
}

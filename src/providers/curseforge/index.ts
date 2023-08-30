import axios, { AxiosInstance } from 'axios';
import {
  DownloadPopup,
  InstalledModMetadata,
  ModLoader,
  SearchResult,
} from '../../types';
import {
  CF2File,
  CF2FileRelationType,
  CF2GameId,
  CF2GetAddonResponse,
  CF2GetModFileResponse,
  CF2GetModFilesResponse,
  CF2HashAlgo,
  CF2SearchModsResponse,
} from 'curseforge-v2';
import fs from 'fs';
import checkModFile from '../../checkModFile';
import { IncomingMessage } from 'http';

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

    let updateVersion = null;

    if (metadata.latestFiles[0].id.toString() !== mod.version) {
      const latestVersion = await this.findVersion(
        mod,
        modLoader,
        gameVersions
      );

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

      dependencies: version.dependencies.map((dependency) => {
        let dependency_type:
          | 'required'
          | 'optional'
          | 'incompatible'
          | 'embedded';

        switch (dependency.relationType) {
          case CF2FileRelationType.Include:
          case CF2FileRelationType.EmbeddedLibrary:
            dependency_type = 'embedded';
            break;
          case CF2FileRelationType.Incompatible:
            dependency_type = 'incompatible';
            break;
          case CF2FileRelationType.RequiredDependency:
            dependency_type = 'required';
            break;
          case CF2FileRelationType.OptionalDependency:
            dependency_type = 'optional';
            break;
          default:
            throw new Error(
              '[tomate-mods] Unsupported dependency type: ' +
                dependency.relationType
            );
        }

        return {
          dependency_type,
          project_id: dependency.modId.toString(),
          version_id: dependency.fileId.toString(),
        };
      }),

      updateVersion,
    };
  }

  async searchMods(
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
      `/v1/mods/search?${queryParams.toString()}`
    );

    return {
      hits: search.data.data.map((hit) => ({
        id: hit.id.toString(),
        provider: 'curseforge',

        name: hit.name,
        description: hit.summary,
        icon: hit.logo.url,
        authors: hit.authors.map((author) => author.name),
        slug: hit.slug,
      })),
      count: search.data.pagination.totalCount,
    };
  }

  async findVersion(
    mod: { id: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    const {
      data: {
        data: [version],
      },
    } = await this.api.get<CF2GetModFilesResponse>(
      `v1/mods/${mod.id}/files?modId=${mod.id}&gameVersion=${gameVersions[0]}&modLoaderType=${modLoader.curseforgeCategory}`
    );

    return version;
  }

  async getVersion(mod: { id: string; version: string }) {
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
  ) {
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

      if (!downloadPopup)
        throw new Error(`Can't download ${mod.slug} without a downloadPopup`);

      await downloadPopup(url, downloadPath);
    }

    if (hash && !checkModFile(downloadPath, hash)) {
      if (fs.existsSync(downloadPath)) fs.rmSync(downloadPath);

      if (--retry < 0) throw new Error('Failed to download mod');

      this.download(mod, downloadPath, downloadPopup, retry);
    }
  }
}

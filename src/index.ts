import { CF2File } from 'curseforge-v2';
import { CurseforgeApi } from './providers/curseforge';
import { ModrinthApi } from './providers/modrinth';
import { ProjectVersion } from './providers/modrinth/types';
import {
  DownloadPopup,
  InstalledModMetadata,
  ModLoader,
  Provider,
  SearchResult,
} from './types';

class NoCurseforgeApiKeyError extends Error {
  message = 'No curseforge api key provided; Curseforge Api can not be used';
  name = 'NoCurseforgeApiKeyError';
}

class InvalidModProviderError extends Error {
  message = 'Invalid mod provider';
  name = 'InvalidModProviderError';
}

export class TomateMods {
  private modrinthApi: ModrinthApi;
  private curseforgeApi?: CurseforgeApi;

  constructor(userAgent: string, curseforgeApiKey?: string) {
    this.modrinthApi = new ModrinthApi(userAgent);

    if (curseforgeApiKey)
      this.curseforgeApi = new CurseforgeApi(userAgent, curseforgeApiKey);
  }

  getInstalledModMetadata(
    mod: { provider: Provider; id: string; version: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<InstalledModMetadata> {
    if (mod.provider === 'modrinth') {
      return this.modrinthApi.getInstalledModMetadata(
        mod,
        modLoader,
        gameVersions
      );
    }

    if (mod.provider === 'curseforge') {
      if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

      return this.curseforgeApi.getInstalledModMetadata(
        mod,
        modLoader,
        gameVersions
      );
    }

    throw new InvalidModProviderError();
  }

  async search(
    query: string,
    modLoader: ModLoader,
    gameVersions: string[],
    useCurseforge: boolean
  ): Promise<SearchResult> {
    const asyncModrinthSearch = this.modrinthApi.searchMods(
      query,
      modLoader,
      gameVersions
    );

    let asyncCurseforgeSearch;
    if (this.curseforgeApi && useCurseforge) {
      asyncCurseforgeSearch = this.curseforgeApi.searchMods(
        query,
        modLoader,
        gameVersions
      );
    } else {
      asyncCurseforgeSearch = { hits: [], count: 0 };
    }

    const modrinthSearch = await asyncModrinthSearch;
    const curseforgeSearch = await asyncCurseforgeSearch;

    curseforgeSearch.hits = curseforgeSearch.hits.filter((hit) => {
      if (
        modrinthSearch.hits.find(
          (_hit) =>
            hit.slug === _hit.slug ||
            hit.name === _hit.name ||
            hit.description === _hit.description
        )
      ) {
        curseforgeSearch.count--;
        return false;
      }

      return true;
    });

    return {
      hits: modrinthSearch.hits.concat(curseforgeSearch.hits),
      count: modrinthSearch.count + curseforgeSearch.count,
    };
  }

  async findVersion(
    mod:
      | { id: string; provider: 'modrinth' }
      | { id: string; provider: 'curseforge'; slug: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<
    | { provider: 'modrinth'; id: string; version: ProjectVersion }
    | { provider: 'curseforge'; id: string; version: CF2File; slug: string }
  > {
    if (mod.provider === 'modrinth') {
      const version = await this.modrinthApi.findVersion(
        mod,
        modLoader,
        gameVersions
      );

      if (!version)
        throw new Error('Could not find compatible version for mod ' + mod.id);

      return {
        id: mod.id,
        provider: 'modrinth' as const,
        version,
      };
    }
    if (mod.provider === 'curseforge') {
      if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

      const version = await this.curseforgeApi.findVersion(
        mod,
        modLoader,
        gameVersions
      );

      return {
        id: mod.id,
        provider: 'curseforge' as const,
        version,
        slug: mod.slug,
      };
    }

    throw new InvalidModProviderError();
  }

  downloadMod(
    mod:
      | { provider: 'modrinth'; id: string; version: ProjectVersion }
      | { provider: 'curseforge'; id: string; version: CF2File; slug: string },
    downloadPath: string,
    downloadPopup?: DownloadPopup
  ) {
    if (mod.provider === 'modrinth') {
      return this.modrinthApi.download(mod, downloadPath);
    }
    if (mod.provider === 'curseforge') {
      if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

      return this.curseforgeApi.download(mod, downloadPath, downloadPopup);
    }

    throw new InvalidModProviderError();
  }
}

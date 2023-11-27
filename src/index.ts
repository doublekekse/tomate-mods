import { CF2File } from 'curseforge-v2';
import { CurseforgeApi } from './providers/curseforge';
import { ModrinthApi } from './providers/modrinth';
import { ProjectVersion } from './providers/modrinth/types';
import {
  DependencyList,
  DownloadPopup,
  InstalledModMetadata,
  InstalledResourceMetadata,
  ModLoader,
  Provider,
  Resource,
  SearchResult,
  SearchResultHit,
} from './types';
import { readFabricMod, readQuiltMod } from '@xmcl/mod-parser';

export class NoCurseforgeApiKeyError extends Error {
  message = 'No curseforge api key provided; Curseforge Api can not be used';
  name = 'NoCurseforgeApiKeyError';
}

export class InvalidProviderError extends Error {
  message = 'Invalid provider';
  name = 'InvalidProviderError';
}

export class TomateMods {
  private modrinthApi: ModrinthApi;
  private curseforgeApi?: CurseforgeApi;

  constructor(userAgent: string, curseforgeApiKey?: string) {
    this.modrinthApi = new ModrinthApi(userAgent);

    if (curseforgeApiKey) {
      this.curseforgeApi = new CurseforgeApi(userAgent, curseforgeApiKey);
    }
  }

  async getInstalledResourceMetadata(
    resource: Resource
  ): Promise<InstalledResourceMetadata> {
    if (resource.provider === 'modrinth') {
      return this.modrinthApi.getInstalledResourceMetadata(resource);
    }
    if (resource.provider === 'curseforge') {
      if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

      return this.curseforgeApi.getInstalledResourceMetadata(resource);
    }

    throw new InvalidProviderError();
  }

  async getInstalledModMetadata(
    mod: { provider: Provider; id: string; version: string },
    modLoader: ModLoader,
    gameVersions: string[],
    modPath?: string
  ): Promise<InstalledModMetadata> {
    try {
      if (mod.provider === 'modrinth') {
        return await this.modrinthApi.getInstalledModMetadata(
          mod,
          modLoader,
          gameVersions
        );
      }

      if (mod.provider === 'curseforge') {
        if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

        return await this.curseforgeApi.getInstalledModMetadata(
          mod,
          modLoader,
          gameVersions
        );
      }

      throw new InvalidProviderError();
    } catch (e) {
      if (!modPath) throw e;

      return this.parseMod(modPath);
    }
  }

  async parseMod(modPath: string): Promise<InstalledModMetadata> {
    try {
      const fabricMod = await readFabricMod(modPath);

      return {
        id: fabricMod.id,
        version: fabricMod.version,
        provider: 'custom',

        name: fabricMod.name ?? 'Unknown name',
        description: fabricMod.description ?? 'Unknown description',
        slug: fabricMod.id,
        authors: fabricMod.authors?.map((author) =>
          typeof author === 'string' ? author : author.name
        ) ?? ['Unknown author'],

        dependencies: [], // TODO

        updateVersion: null,
      };
    } catch (e) {}

    try {
      const quiltMod = await readQuiltMod(modPath);

      return {
        id: quiltMod.quilt_loader.id,
        version: quiltMod.quilt_loader.version,
        provider: 'custom',

        name: quiltMod.quilt_loader.metadata?.name ?? 'Unknown name',
        description:
          quiltMod.quilt_loader.metadata?.description ?? 'Unknown description',
        slug: quiltMod.quilt_loader.id,
        authors: Object.keys(
          quiltMod.quilt_loader.metadata?.contributors ?? {}
        ),

        dependencies: [], // TODO

        updateVersion: null,
      };
    } catch (e) {}

    throw new Error('Could not parse mod');
  }

  async searchResource(
    query: string,
    opts: {
      useCurseforge: boolean;

      curseforgeUrlSearchParams: URLSearchParams;
      modrinthFacets: string;
    }
  ): Promise<SearchResult> {
    const asyncModrinthSearch = this.modrinthApi.searchResource(query, opts.modrinthFacets);

    let asyncCurseforgeSearch;
    if (this.curseforgeApi && opts.useCurseforge) {
      asyncCurseforgeSearch = this.curseforgeApi.searchResource(query, opts.curseforgeUrlSearchParams);
    } else {
      asyncCurseforgeSearch = { hits: [], count: 0 };
    }

    const modrinthSearch = await asyncModrinthSearch;
    const curseforgeSearch = await asyncCurseforgeSearch;

    const searchResults = {
      hits: modrinthSearch.hits.concat(curseforgeSearch.hits),
      count: modrinthSearch.count + curseforgeSearch.count,
    };

    searchResults.hits = searchResults.hits.filter((hit, idx) => {
      if (searchResults.hits.find(sameMod(hit, idx))) {
        searchResults.count--;
        return false;
      }

      return true;
    });

    return searchResults;
  }

  async searchMod(
    query: string,
    modLoader: ModLoader,
    gameVersions: string[],
    useCurseforge: boolean,
    side: 'client_side' | 'server_side' = 'client_side'
  ): Promise<SearchResult> {
    const asyncModrinthSearch = this.modrinthApi.searchMod(
      query,
      modLoader,
      gameVersions,
      side
    );

    let asyncCurseforgeSearch;
    if (this.curseforgeApi && useCurseforge) {
      asyncCurseforgeSearch = this.curseforgeApi.searchMod(
        query,
        modLoader,
        gameVersions
      );
    } else {
      asyncCurseforgeSearch = { hits: [], count: 0 };
    }

    const modrinthSearch = await asyncModrinthSearch;
    const curseforgeSearch = await asyncCurseforgeSearch;

    const searchResults = {
      hits: modrinthSearch.hits.concat(curseforgeSearch.hits),
      count: modrinthSearch.count + curseforgeSearch.count,
    };

    searchResults.hits = searchResults.hits.filter((hit, idx) => {
      if (searchResults.hits.find(sameMod(hit, idx))) {
        searchResults.count--;
        return false;
      }

      return true;
    });

    return searchResults;
  }

  async findVersion(
    mod: { id: string; provider: 'modrinth' | 'curseforge'; slug: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<
    | {
        provider: 'modrinth';
        id: string;
        version: ProjectVersion;
        slug: string;
      }
    | { provider: 'curseforge'; id: string; version: CF2File; slug: string }
  > {
    if (mod.provider === 'modrinth') {
      const version = await this.modrinthApi.findVersion(
        mod.id,
        modLoader,
        gameVersions
      );

      if (!version) {
        throw new Error('Could not find compatible version for mod ' + mod.id);
      }

      return {
        id: mod.id,
        slug: mod.slug,
        provider: 'modrinth',
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

      if (!version) {
        throw new Error('Could not find compatible version for mod ' + mod.id);
      }

      return {
        id: mod.id,
        provider: 'curseforge',
        version,
        slug: mod.slug,
      };
    }

    throw new InvalidProviderError();
  }

  download(
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

    throw new InvalidProviderError();
  }

  async fileMetadata(
    modPath: string,
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    try {
      return await this.modrinthApi.fileMetadata(
        modPath,
        modLoader,
        gameVersions
      );
    } catch (e) {}

    try {
      if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

      return await this.curseforgeApi.fileMetadata(
        modPath,
        modLoader,
        gameVersions
      );
    } catch (e) {}

    return this.parseMod(modPath);
  }

  /**
   * Lists all dependencies
   */
  async listDependencies(
    mod:
      | { provider: 'modrinth'; id: string; version: ProjectVersion }
      | { provider: 'curseforge'; id: string; version: CF2File; slug: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<DependencyList> {
    if (mod.provider === 'modrinth') {
      return this.modrinthApi.listDependencies(mod, modLoader, gameVersions);
    }
    if (mod.provider === 'curseforge') {
      if (!this.curseforgeApi) throw new NoCurseforgeApiKeyError();

      return this.curseforgeApi.listDependencies(mod, modLoader, gameVersions);
    }

    throw new InvalidProviderError();
  }
}

function sameMod(hit: SearchResultHit, idx: number) {
  return (_hit: SearchResultHit, _idx: number) =>
    idx > _idx &&
    (hit.slug === _hit.slug ||
      hit.name === _hit.name ||
      hit.description === _hit.description);
}

export * from './types';

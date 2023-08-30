import { stringify } from 'querystring';
import { InstalledModMetadata, ModLoader, SearchResult } from '../../types';
import ModrinthQueue from './modrinthQueue';
import { ModrinthSearchResult, Project, ProjectVersion, User } from './types';
import fs from 'fs';
import checkModFile from '../../checkModFile';
import axios from 'axios';
import { IncomingMessage } from 'http';

export class ModrinthApi {
  private api: ModrinthQueue;

  constructor(userAgent: string) {
    this.api = new ModrinthQueue(userAgent);
  }

  async findVersion(
    mod: { id: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    for (let i = 0; i < modLoader.modrinthCategories.length; i++) {
      const versions = await this.api.get<ProjectVersion[]>(
        `/project/${mod.id}/version?loaders=${JSON.stringify([
          modLoader.modrinthCategories[i],
        ])}&game_versions=${JSON.stringify(gameVersions)}`
      );

      if (versions.data.length > 0) {
        return versions.data[0];
      }
    }
  }

  async getVersion(mod: { version: string }) {
    return this.api.get<ProjectVersion>(`/version/${mod.version}`);
  }

  async getInstalledModMetadata(
    mod: { id: string; version: string },
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<InstalledModMetadata> {
    const project = await this.api.get<Project>(`/project/${mod.id}`);
    const version = await this.getVersion(mod);
    const teamMembers = await this.api.get<{ user: User }[]>(
      `/project/${mod.id}/members`
    );

    let updateVersion = null;

    if (project.data.versions[0] !== mod.version) {
      const latestVersion = await this.findVersion(
        mod,
        modLoader,
        gameVersions
      );

      if (latestVersion && latestVersion.id !== mod.version) {
        updateVersion = latestVersion;
      }
    }

    return {
      id: project.data.id,
      version: mod.version,
      provider: 'modrinth',

      name: project.data.title,
      description: project.data.description,
      slug: project.data.slug,
      authors: teamMembers.data.map((member) => member.user.name),

      dependencies: version.data.dependencies,

      updateVersion,
    };
  }

  async searchMods(
    query: string,
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<SearchResult> {
    const params = {
      query,
      index: 'relevance',
      offset: 0,
      limit: 10,
      facets: `[${buildFacet(
        'categories',
        modLoader.modrinthCategories
      )},${buildFacet('versions', gameVersions)},${buildFacet('client_side', [
        'required',
        'optional',
      ])},["project_type:mod"]]`,
    };

    const searchResult = await this.api.get<ModrinthSearchResult>(
      `/search?${stringify(params)}`
    );

    return {
      hits: searchResult.data.hits.map((hit) => ({
        id: hit.project_id,
        provider: 'modrinth',

        name: hit.title,
        description: hit.description,
        icon: hit.icon_url,
        authors: [hit.author],
        slug: hit.slug,
      })),
      count: searchResult.data.total_hits,
    };
  }

  async download(
    mod: { id: string; version: ProjectVersion },
    downloadPath: string,
    retry = 5
  ) {
    const hash = mod.version.files[0].hashes.sha1;
    const url = mod.version.files[0].url;

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

    if (!checkModFile(downloadPath, hash)) {
      if (fs.existsSync(downloadPath)) fs.rmSync(downloadPath);

      if (--retry < 0) throw new Error('Failed to download mod');

      this.download(mod, downloadPath, retry);
    }
  }
}

function buildFacet(name: string, data: string[]) {
  return `[${data.map((d) => `"${name}: ${d}"`)}]`;
}

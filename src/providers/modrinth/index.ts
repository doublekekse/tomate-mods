import { stringify } from 'querystring';
import { InstalledModMetadata, ModLoader, SearchResult } from '../../types';
import ModrinthQueue from './modrinthQueue';
import { ModrinthSearchResult, Project, ProjectVersion, User } from './types';
import fs from 'fs';
import checkModFile from '../../checkModFile';
import axios from 'axios';
import { IncomingMessage } from 'http';
import crypto from 'crypto';

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
    try {
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
    } catch (e) {
      return undefined;
    }
  }

  async getVersion(mod: { version: string }) {
    return this.api.get<ProjectVersion>(`/version/${mod.version}`);
  }

  private async installedModMetadata(
    mod: { id: string; version: string },
    project: Project,
    version: ProjectVersion,
    teamMembers: { user: User }[],
    modLoader: ModLoader,
    gameVersions: string[]
  ): Promise<InstalledModMetadata> {
    let updateVersion = null;

    if (modLoader.overrideMods[project.id]) {
      updateVersion =
        (await this.findVersion(
          {
            id: modLoader.overrideMods[project.id],
          },
          modLoader,
          gameVersions
        )) ?? null;
    }

    if (!updateVersion && project.versions[0] !== mod.version) {
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
      id: project.id,
      version: mod.version,
      provider: 'modrinth',

      name: project.title,
      description: project.description,
      slug: project.slug,
      authors: teamMembers.map((member) => member.user.name),

      dependencies: version.dependencies.map((dependency) => ({
        id: dependency.project_id,
        version: dependency.version_id,
        dependencyType: dependency.dependency_type,
      })),

      updateVersion,
    };
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

    return this.installedModMetadata(
      mod,
      project.data,
      version.data,
      teamMembers.data,
      modLoader,
      gameVersions
    );
  }

  async search(
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
      hits: await Promise.all(
        searchResult.data.hits.map(async (hit) => {
          override: if (modLoader.overrideMods[hit.project_id]) {
            const overrideId = modLoader.overrideMods[hit.project_id];
            if (
              !(await this.findVersion(
                { id: overrideId },
                modLoader,
                gameVersions
              ))
            )
              break override;

            const project = await this.api.get<Project>(
              `/project/${overrideId}}`
            );

            const teamMembers = await this.api.get<{ user: User }[]>(
              `/project/${overrideId}/members`
            );

            return {
              id: project.data.id,
              provider: 'modrinth',

              name: project.data.title,
              description: project.data.description,
              icon: project.data.icon_url,
              authors: teamMembers.data.map((member) => member.user.name),
              slug: project.data.slug,
            };
          }

          return {
            id: hit.project_id,
            provider: 'modrinth',

            name: hit.title,
            description: hit.description,
            icon: hit.icon_url,
            authors: [hit.author],
            slug: hit.slug,
          };
        })
      ),
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

  async fileMetadata(
    modPath: string,
    modLoader: ModLoader,
    gameVersions: string[]
  ) {
    const modFile = fs.readFileSync(modPath);
    const modHash = crypto.createHash('sha1').update(modFile).digest('hex');

    const { data: version } = await this.api.get<ProjectVersion>(
      `/version_file/${modHash}?algorithm=sha1`
    );
    const { data: project } = await this.api.get<Project>(
      `/project/${version.project_id}`
    );
    const { data: teamMembers } = await this.api.get<{ user: User }[]>(
      `/project/${project.id}/members`
    );

    return this.installedModMetadata(
      { id: project.id, version: version.id },
      project,
      version,
      teamMembers,
      modLoader,
      gameVersions
    );
  }
}

function buildFacet(name: string, data: string[]) {
  return `[${data.map((d) => `"${name}: ${d}"`)}]`;
}

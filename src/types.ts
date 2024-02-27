import { CF2File } from 'curseforge-v2';
import { Loader, ProjectVersion } from './providers/modrinth/types';

export type Provider = 'curseforge' | 'modrinth' | 'custom';

export type ModLoader = {
  overrideMods: {
    [from: string]: string;
  };
  modrinthCategories: Loader[];
  curseforgeCategory: string;
};

export type InstalledModMetadata = {
  id: string;
  version: string;
  provider: Provider;

  name: string;
  description: string;
  icon?: string;
  slug: string;
  dependencies: {
    id: string;
    version?: string | undefined;
    dependencyType: 'required' | 'optional' | 'incompatible' | 'embedded';
  }[];
  authors: string[];
} & (
  | {
      provider: 'curseforge';
      updateVersion: CF2File | null;
    }
  | {
      provider: 'modrinth';
      updateVersion: ProjectVersion | null;
    }
  | { provider: 'custom'; updateVersion: null }
);

export type Resource = {
  provider: Provider;
  id: string;
  version: string;
};

export type InstalledResourceMetadata = Resource & {
  icon?: string;
  name: string;
  description: string;
  authors: string[];

  updateVersion?: any;
};

export type SearchResultHit = {
  id: string;
  provider: 'modrinth' | 'curseforge';

  name: string;
  description: string;
  icon?: string;
  authors: string[];
  slug: string;
};

export type SearchResult = { hits: SearchResultHit[]; count: number };

export type DownloadPopup = (url: string, savePath: string) => unknown;

export type DependencyType =
  | 'required'
  | 'optional'
  | 'incompatible'
  | 'embedded';

export type ModrinthDependencyList = {
  mod: {
    provider: 'modrinth';
    id: string;
    slug: string;

    version?: ProjectVersion;
  };

  dependencyType: DependencyType;
}[];

export type CurseforgeDependencyList = {
  mod: {
    provider: 'curseforge';
    id: string;
    slug: string;

    version?: CF2File;
  };

  dependencyType: DependencyType;
}[];

export type DependencyList = ModrinthDependencyList | CurseforgeDependencyList;

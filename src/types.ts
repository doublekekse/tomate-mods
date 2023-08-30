import { CF2File } from 'curseforge-v2';
import { Loader, ProjectVersion } from './providers/modrinth/types';

export type Provider = 'curseforge' | 'modrinth';

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
  slug: string;
  dependencies: {
    version_id?: string | undefined;
    project_id?: string | undefined;
    dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
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
);

export type SearchResultHit = {
  id: string;
  provider: Provider;

  name: string;
  description: string;
  icon: string;
  authors: string[];
  slug: string;
};

export type SearchResult = { hits: SearchResultHit[]; count: number };

export type DownloadPopup = (url: string, savePath: string) => unknown;

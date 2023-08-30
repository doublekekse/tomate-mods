export type Project = {
  /**
   * The ID of the mod, encoded as a base62 string
   */
  id: string;
  /**
   * The slug of a mod, used for vanity URLs
   */
  slug: string;
  /**
   * The id of the team that has ownership of this mod
   */
  team: string;
  /**
   * The title or name of the mod
   */
  title: string;
  /**
   * A short description of the mod
   */
  description: string;
  /**
   * A long form description of the mod.
   */
  body: string;
  /**
   * DEPRECATED The link to the long description of the mod
   */
  body_url?: string;
  /**
   * The date at which the mod was first published
   */
  published: string;
  /**
   * The date at which the mod was updated
   */
  updated: string;
  /**
   * The status of the mod - approved, rejected, draft, unlisted, processing, or unknown
   */
  status: string;
  /**
   * The license of the mod
   */
  license: License;
  /**
   * The support range for the client mod - required, optional, unsupported, or unknown
   */
  client_side: string;
  /**
   * The support range for the server mod - required, optional, unsupported, or unknown
   */
  server_side: string;
  /**
   * The total number of downloads the mod has
   */
  downloads: number;

  followers: number;
  /**
   * A list of the categories that the mod is in
   */
  categories: Array<string>;
  /**
   * A list of ids for versions of the mod
   */
  versions: Array<string>;
  /**
   * The URL of the icon of the mod
   */
  icon_url?: string;
  /**
   * An optional link to where to submit bugs or issues with the mod
   */
  issues_url?: string;
  /**
   * An optional link to the source code for the mod
   */
  source_url?: string;
  /**
   * An optional link to the mod's wiki page or other relevant information
   */
  wiki_url?: string;
  /**
   * An optional link to the mod's discord
   */
  discord_url?: string;
  /**
   * An optional list of all donation links the mod has
   */
  donation_urls: Array<DonationLink>;

  project_type: string;

  gallery: ProjectGallery[];
};

export type License = {
  /**
   * The license id of a mod, retrieved from the licenses get route
   */
  id: string;
  /**
   * The long for name of a license
   */
  name: string;
  /**
   * The URL to this license
   */
  url: string;
};

export type DonationLink = {
  /**
   * The platform id of a mod, retrieved from the donation platforms get route
   */
  id: string;
  /**
   * The long for name of a platform
   */
  platform: string;
  /**
   * The URL to this donation link
   */
  url: string;
};

export type User = {
  /**
   * The user's id
   */
  id: string;
  /**
   * The user's github id; only visible to the user themself
   */
  github_id: number;
  /**
   * The user's username
   */
  username: string;
  /**
   * The user's display name
   */
  name: string;
  /**
   * The user's email; only visible to the user themself
   */
  email?: string;
  /**
   * The user's avatar url; uses github's icons
   */
  avatar_url?: string;
  /**
   * A description of the user
   */
  bio: string;
  /**
   * The time at which the user was created
   */
  created: Date;
  /**
   * The user's role developer, moderator, or admin
   */
  role: string;
};

export type ProjectVersion = {
  /**
   * The ID of the version, encoded as a base62 string
   */
  id: string;
  /**
   * The ID of the project this version is for
   */
  project_id: string;
  /**
   * The ID of the author who published this version
   */
  author_id: string;
  /**
   * Whether the version is featured or not
   */
  featured: string;
  /**
   * The name of this version
   */
  name: string;
  /**
   * The version number. Ideally will follow semantic versioning
   */
  version_number: string;
  /**
   * The changelog for this version of the mod.
   */
  changelog?: string;
  /**
   * DEPRECATED A link to the changelog for this version of the mod
   */
  changelog_url?: string;
  /**
   * The date that this version was published
   */
  date_published: string;
  /**
   * The number of downloads this specific version has
   */
  downloads: number;
  /**
   * The type of the release - alpha, beta, or release
   */
  version_type: string;
  /**
   * A list of files available for download for this version
   */
  files: Array<ModVersionFile>;
  /**
   * A list of specific versions of mods that this version depends on
   */
  dependencies: Array<{
    version_id?: string; // Technically a version id is always required
    project_id?: string;
    dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
  }>;
  /**
   * A list of versions of Minecraft that this version of the mod supports
   */
  game_versions: Array<string>;
  /**
   * The mod loaders that this version supports
   */
  loaders: Array<Loader>;
};

export type ModVersionFile = {
  /**
   * A map of hashes of the file. The key is the hashing algorithm and the value is the string version of the hash.
   */
  hashes: Record<string, string>;
  /**
   * A direct link to the file
   */
  url: string;
  /**
   * The name of the file
   */
  filename: string;
};

export type Loader =
  | 'fabric'
  | 'forge'
  | 'liteloader'
  | 'modloader'
  | 'neoforge'
  | 'quilt'
  | 'rift';

export type ProjectGallery = {
  created: string;
  description: string;
  featured: boolean;
  title: string;
  url: string;
};

export type ModrinthSearchResult = {
  /**
   * The list of results
   */
  hits: Array<SearchResultHit>;
  /**
   * The number of results that were skipped by the query
   */
  offset: number;
  /**
   * The number of mods returned by the query
   */
  limit: number;
  /**
   * The total number of mods that the query found
   */
  total_hits: number;
};

export type SearchResultHit = {
  /**
   * The slug of project, e.g. "my_project"
   */
  slug: string;
  /**
   * The id of the project; prefixed with local-
   */
  project_id: string;
  /**
   * The project type of the project.
   * @enum "mod" "modpack"
   * */
  project_type?: 'mod' | 'modpack';
  /**
   * The username of the author of the project
   */
  author: string;
  /**
   * The name of the project.
   */
  title: string;
  /**
   * A short description of the project
   */
  description: string;
  /**
   * A list of the categories the project is in.
   */
  categories?: Array<string>;
  /**
   * A list of the minecraft versions supported by the project.
   */
  versions: Array<string>;
  /**
   * The total number of downloads for the project
   */
  downloads: number;
  /**
   * A link to the project's main page; */
  page_url: string;
  /**
   * The url of the project's icon */
  icon_url: string;
  /**
   * The url of the project's author */
  author_url?: string;
  /**
   * The date that the project was originally created
   */
  date_created: string;
  /**
   * The date that the project was last modified
   */
  date_modified: string;
  /**
   * The latest version of minecraft that this project supports */
  latest_version: string;
  /**
   * The id of the license this project follows */
  license: string;
  /**
   * The side type id that this project is on the client */
  client_side: string;
  /**
   * The side type id that this project is on the server */
  server_side: string;
  /**
   * The host that this project is from, always modrinth or curseforge */
  host: 'modrinth' | 'curseforge';
};

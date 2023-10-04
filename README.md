# Tomate Mods Documentation

Tomate Mods is a JavaScript library that provides utils for working with CurseForge and Modrinth at the same time

## Table of Contents

- [Tomate Mods Documentation](#tomate-mods-documentation)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
  - [Features](#features)
    - [Downloading mods](#downloading-mods)
    - [Searching for mods](#searching-for-mods)
    - [Mod metadata](#mod-metadata)
      - [If you safe provider, id and version:](#if-you-safe-provider-id-and-version)
      - [If you only have the file:](#if-you-only-have-the-file)
    - [Parsing mods](#parsing-mods)

---

## Installation

You can install the `tomate-mods` library using npm:

```shell
npm install [https://gittomate-mods](https://github.com/doublekekse/tomate-mods)
```


## Getting Started

To use `tomate-mods`, you'll need to import the `TomateMods` class and configure it with your CurseForge API key.

```javascript
import { TomateMods } from 'tomate-mods';

const mods = new TomateMods('Tomate0613/tomate-mods/1.0.0', 'curseforge-api-key');
```

Make sure to replace `'curseforge-api-key'` with your actual CurseForge API key.

## Features

### Downloading mods

To download a mod you first have to find a version of the mod that is compatible with a certain loader and minecraft version.

```javascript
const modVersion = await mods.findVersion({
  id: 'aCkoEaRG',
  provider: 'modrinth',
}, fabricLoader, ['1.20.1']);
```

For curseforge you also need the slug of the mod
```javascript
const modVersion = await mods.findVersion({
  id: '292908',
  provider: 'curseforge',
  slug: 'illuminations',
}, fabricLoader, ['1.19.2']);
```

Then you can download the mod.
```javascript
await mods.downloadMod(modVersion, 'mod.jar');
```

On curseforge you can't download some mods using the api. However you can open a browser window and download the mod this way. If you provide a function to the popupWindow parameter Tomate Mods will use it if necessary. In an electron environment this could look like this:
```typescript
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { getAssetPath } from './util';

const windowPopup = (options: BrowserWindowConstructorOptions) => {
  return new BrowserWindow({
    webPreferences: {
      sandbox: true,
      safeDialogs: true,
      nodeIntegration: false,
    },
    icon: getAssetPath('icon.png'),
    ...options,
  });
};

const downloadPopup = async (url: string, savePath: string) => {
  const downloadWindow = windowPopup({
    show: false,
  });

  const { session } = downloadWindow.webContents;

  await downloadWindow.webContents.loadURL(url);

  try {
    await new Promise<void>((resolve, reject) => {
      session.on('will-download', (_event, item) => {
        item.pause();

        item.setSavePath(
          process.platform === 'win32'
            ? savePath.replaceAll('/', '\\')
            : savePath
        );

        item.on('done', () => {
          resolve();
        });

        item.on('updated', (__event, state) => {
          if (state === 'interrupted') resolve();

          logger.error('Download state:', state);
        });
      });

      setTimeout(() => {
        reject();
      }, 600000); // 10 Minutes timeout
    });
  } finally {
    downloadWindow.close();
  }
};

await mods.downloadMod(modVersion, 'mod.jar', downloadPopup);
```

### Searching for mods

You can search for mods on both modrinth and curseforge at the same time

```javascript
const searchResults = await mods.search(
  'my-query',
  quiltLoader,
  ['1.20'],
  true // Curseforge's api is a bit slower, so sometimes you only want to search for mods on modrinth
);
```

Tomate Mods will try to remove all duplicate mod entries.

When using the quiltLoader preset the following mods will be replaced in the search results:
- fabric api ▶ QFAPI/QSL
- fabric language kotlin ▶ QKL

### Mod metadata

You can get metadata (such as available updates, etc.) on already downloaded mods

#### If you safe provider, id and version:
```javascript
const metadata = await mods.getInstalledModMetadata(
  mod: { provider, id, version },
  modLoader: quiltLoader,
  gameVersions: ['1.19.2'],
  modPath?: string
);
```

If the provider is set to "custom" or the requests fail (because you are offline) the mod will get [parsed](#parsing-mods)
#### If you only have the file:
`fileMetadata` will try to find your mod on modrinth/curseforge

```javascript
const metadata = await mods.fileMetadata(
  modPath: 'mod.jar',
  modLoader: quiltLoader,
  gameVersions: ['1.19.2']
)
```

If the mod is not found on modrinth and curseforge or the requests fail (because you are offline) the mod will get [parsed](#parsing-mods)

### Parsing mods

Tomate Mods allows you to parse mod files.
This is a wrapper around `@xmcl/mod-parser` that will output the metadata in the same format as `getInstalledModMetadata` or `fileMetadata`

```javascript
const metadata = await mods.parseMod('mod.jar');
```

Parsing mods will work offline, but will not provide any information on updates

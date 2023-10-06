import { TomateMods } from '../src';
import { quiltLoader } from '../src/modloaders';
import 'dotenv/config';

test('search', async () => {
  const mods = new TomateMods(
    'Tomate0613/tomate-mods/1.0.0',
    process.env.CURSEFORGE_API_KEY
  );

  const emptySearch = await mods.search('', quiltLoader, ['1.20'], true);

  expect(emptySearch.hits).toContainEqual({
    authors: ['Eli Orona', 'Ennui Langeweile', 'LambdAurora', 'Quilt Holdings'],
    description:
      'The standard libraries of the Quilt ecosystem. Essential for your modding experience on Quilt!',
    icon: 'https://cdn.modrinth.com/data/qvIfYCYJ/icon.png',
    id: 'qvIfYCYJ',
    name: 'Quilted Fabric API (QFAPI) / Quilt Standard Libraries (QSL)',
    provider: 'modrinth',
    slug: 'qsl',
  });
  expect(emptySearch.hits.length).toBe(30);

  const noResultSearch = await mods.search(
    '35rwr5dcedgbh',
    quiltLoader,
    ['1.20'],
    true
  );

  expect(noResultSearch.hits.length).toBe(0);
  expect(noResultSearch.count).toBe(0);
  expect(noResultSearch.hits).toStrictEqual([]);

  const quiltOverrideSearch = await mods.search(
    'fabric api',
    quiltLoader,
    ['1.20'],
    true
  );
  const hit = quiltOverrideSearch.hits[0];

  expect(quiltOverrideSearch.hits[0]).toStrictEqual({
    id: 'qvIfYCYJ',
    provider: 'modrinth',
    name: 'Quilted Fabric API (QFAPI) / Quilt Standard Libraries (QSL)',
    description:
      'The standard libraries of the Quilt ecosystem. Essential for your modding experience on Quilt!',
    icon: 'https://cdn.modrinth.com/data/qvIfYCYJ/icon.png',
    authors: ['Quilt-Holdings'],
    slug: 'qsl',
  });
  expect(
    quiltOverrideSearch.hits.find((_hit, i) => {
      return (
        i > 0 &&
        (hit.slug === _hit.slug ||
          hit.name === _hit.name ||
          hit.description === _hit.description)
      );
    })
  ).toBeFalsy();
});

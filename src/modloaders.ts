import { ModLoader } from './types';

export const quiltLoader: ModLoader = {
  overrideMods: {
    P7dR8mSH: 'qvIfYCYJ', // Fabric Api -> QFAPI/QSL
    '308769': '634179', // Fabric Api -> QFAPI/QSL

    Ha28R6CL: 'lwVhp9o5', // Fabric Language Kotlin -> QKL
    '306612': '720410', // Fabric Language Kotlin -> QKL
  },
  modrinthCategories: ['quilt', 'fabric'],
  curseforgeCategory: '5',
};

export const fabricLoader: ModLoader = {
  overrideMods: {},
  modrinthCategories: ['fabric'],
  curseforgeCategory: '4',
};

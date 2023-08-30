import { ModLoader } from './types';

export const quiltLoader: ModLoader = {
  overrideMods: {
    P7dR8mSH: 'qvIfYCYJ', // Fabric Api -> QFAPI
    '308769': '634179', // Fabric Api -> QFAPI

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

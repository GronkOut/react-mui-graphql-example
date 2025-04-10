export default {
  singleQuote: true,
  printWidth: 250,
  importOrder: [
    '^react',
    '<THIRD_PARTY_MODULES>',
    '@/plugins/*',
    '@/stores/*',
    '@/composables/*',
    '@/constants/*',
    '@/components/*',
    '.tsx$',
    '@/utils/*',
    '^[./]',
    '.js',
    '.ts',
    '@/assets/*',
    '.scss$',
    '.css$',
  ],
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  tabWidth: 2,
};

/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,js,mjs,cjs}': ['eslint --fix --cache', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  // type-check the whole project once if any TS file changed
  '*.ts': () => 'tsc --noEmit -p tsconfig.json',
};

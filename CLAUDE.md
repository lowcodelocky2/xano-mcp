# CLAUDE.md for xano-mcp

## Build/Test Commands
- Build project: `npm run build`
- Full build with lint & format: `npx eslint --fix src/**/*.ts && npx prettier --write src/**/*.ts && npm run build`
- Start server: `npm run start`
- Run TypeScript check: `npx tsc --noEmit`
- Install dependencies: `npm install`
- Lint project: `npx eslint --max-warnings=0 --ext .ts src/`
- Fix lint issues: `npx eslint --fix src/**/*.ts`
- Format code: `npx prettier --write "src/**/*.{ts,js,json}"`
- Check formatting: `npx prettier --check "src/**/*.{ts,js,json}"`

## Code Style Guidelines
- **Imports**: Use ES modules (import/export) with .js extension for Node.js compatibility
- **TypeScript**: Strict type checking; use interfaces for complex types
- **Error Handling**: Use try/catch blocks with specific error messages
- **Logging**: Use console.error for diagnostics (server logs)
- **Environment**: Required variables: XANO_API_KEY, XANO_WORKSPACE, XANO_API_BASE
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: camelCase for variables/functions, PascalCase for interfaces/types
- **API Style**: Use zod for schema validation in tool definitions
- **Documentation**: Include descriptions for all tool parameters
- **Type Safety**: Prefer typed responses from API calls using generics

## ESLint & Prettier Setup (Recommended)
- Install: `npm i -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier`
- `.eslintrc.json`:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```
- `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```
- Add to package.json scripts:
```json
"scripts": {
  "build": "tsc && node -e \"require('fs').chmodSync('build/index.js', '755')\"",
  "start": "node build/index.js",
  "lint": "eslint --max-warnings=0 --ext .ts src/",
  "lint:fix": "eslint --fix src/**/*.ts",
  "format": "prettier --write \"src/**/*.{ts,js,json}\"",
  "format:check": "prettier --check \"src/**/*.{ts,js,json}\"",
  "prebuild": "npm run lint:fix && npm run format"
}
```

To re-enable delete-table functionality: uncomment the block in src/index.ts then rebuild.
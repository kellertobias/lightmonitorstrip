module.exports = {
  env: {
    node: true,
    mocha: true,
    browser: true,
    jest: true,
  },
  plugins: ["@typescript-eslint", "import", "prettier", "drizzle"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@next/next/recommended",
    "plugin:promise/recommended",
    "plugin:unicorn/recommended",
    "prettier",
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    // 'drizzle/enforce-delete-with-where': "error",
    // 'drizzle/enforce-update-with-where': "error",
    "@typescript-eslint/no-floating-promises": "error",
    "no-console": "warn",
    "arrow-body-style": "off",
    "consistent-return": "off",
    curly: "error",
    "import/extensions": "off",
    "@next/next/no-img-element": "off",
    "import/prefer-default-export": "warn",
    "unicorn/no-await-expression-member": "warn",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/*.*spec.ts",
          "**/*.*spec.tsx",
          "**/*.stories.tsx",
          "**/*.stories.ts",
          "**/*.spec.tsx",
          "**/*.spec.ts",
          "src/tests/**",
          "vitest.config.*.ts",
          "vitest.workspace.ts",
          "stack/**/*.ts",
          "sst.config.ts",
          "codegen.ts",
        ],
      },
    ],
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          // 'type'
        ],
        pathGroups: [
          {
            pattern: "**/polyfills",
            group: "builtin",
            position: "before",
          },
          {
            pattern: "next/**",
            group: "builtin",
          },
          {
            pattern: "react**",
            group: "builtin",
          },
          {
            pattern: "clsx",
            group: "builtin",
          },
          {
            pattern: "@/shared/**",
            group: "internal",
          },
          {
            pattern: "@/api/**",
            group: "internal",
            position: "after",
          },
          {
            pattern: "@/components/**",
            group: "internal",
            position: "after",
          },
          {
            pattern: "@/(web|client)/**",
            group: "internal",
            position: "after",
          },
          {
            pattern: "@/common/**",
            group: "internal",
          },
          {
            pattern: "@/services/**",
            group: "internal",
          },
          {
            pattern: "@/**",
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
      },
    ],
    "import/prefer-default-export": "off",
    "unicorn/prefer-node-protocol": "off",
    "no-restricted-imports": "error",
    "no-plusplus": [
      "error",
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    "no-undef": ["error"],
    "nonblock-statement-body-position": ["error", "below"],
    "react/prop-types": "off",
    "react/jsx-props-no-spreading": "off",
    "unicorn/no-array-for-each": "off",
    "unicorn/no-static-only-class": "off",
    "unicorn/better-regex": "warn",
    "unicorn/no-array-reduce": "off",
    "unicorn/no-null": "off",
    "unicorn/prevent-abbreviations": "off",
    "unicorn/prefer-dom-node-remove": "off",
    "unicorn/numeric-separators-style": "off",
    "unicorn/prefer-export-from": "warn",
    "unicorn/consistent-destructuring": "off",
    "unicorn/prefer-spread": "warn",
    "@typescript-eslint/no-implied-eval": "warn",
    "@typescript-eslint/no-unused-expressions": ["error", {}],
    "@typescript-eslint/no-unused-vars": "error",
    "class-methods-use-this": "off",
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/no-noninteractive-element-interactions": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/interactive-supports-focus": "off",
  },
  overrides: [
    {
      files: [
        "**/*.spec.tsx",
        "**/*.spec.ts",
        "**/*.stories.tsx",
        "**/*.*-spec.ts",
        "**/*.*-spec.tsx",
      ],
      rules: {
        "no-restricted-imports": "off",
        "unicorn/no-array-callback-reference": "off",
        "import/no-useless-path-segments": "warn",
      },
    },
  ],
  globals: {
    NodeJS: true,
    JSX: true,
  },
};

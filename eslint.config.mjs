import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {ignores: ["dist", "node_modules"]},
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx,js,mjs}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                {allowConstantExport: true},
            ],
            "max-len": ["error", {code: 180}],
            indent: [
                "error",
                4,
                {
                    SwitchCase: 1,
                    VariableDeclarator: 1,
                    outerIIFEBody: 1,
                    FunctionDeclaration: {parameters: "first", body: 1},
                    FunctionExpression: {parameters: "first", body: 1},
                    CallExpression: {arguments: "first"},
                    ArrayExpression: 1,
                    ObjectExpression: 1,
                    ImportDeclaration: 1,
                    flatTernaryExpressions: false,
                },
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "no-trailing-spaces": "error", // Disallow trailing spaces
            "no-multi-spaces": "error", // Disallow multiple spaces
            "no-irregular-whitespace": "error", // Disallow irregular whitespace
            "space-in-parens": ["error", "never"], // Enforce spacing inside parentheses
            "space-before-function-paren": ["error", "always"], // Enforce spacing before function parenthesis
            "comma-spacing": ["error", {before: false, after: true}], // Enforce spacing after commas
            "object-curly-spacing": ["error", "never"], // Enforce spacing inside curly braces
        },
    }
);

import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node },
    rules: {
      // 级别 2= error 1= warn 警告 0= 关闭
      "no-var": 2,// 不能用var
      "no-console": 1,// 开发环境可以使用console
      "quotes": ["error", "double"],// 双引号
      "semi": ["error", "always"],// 分号
      "indent": ["error", 2],// 缩进2个空格
    }
  },
]);

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
 * Viteは開発サーバーの起動と、公開用ファイルへのbuildを担当します。
 * react()プラグインによりJSXをブラウザで実行できるJavaScriptへ変換し、
 * 開発中はファイル保存時にページ全体を再読込せず表示を更新できます。
 */
export default defineConfig({
  plugins: [react()],
});

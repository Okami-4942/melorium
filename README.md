# Melorium

音楽を本に見立てて紹介する、React + Three.js製の3Dギャラリーです。

## はじめかた

```bash
npm install
npm run dev
```

ターミナルに表示されたURLをブラウザで開いてください。

## 操作方法

- 画面をクリック: マウスで視点を動かす
- `W` `A` `S` `D`: 前後左右へ移動する
- `Esc`: マウス操作を解除する

本へ近づいたときの案内、Fキーで開く曲画面、メニューは、高校生向けの実装課題として完成コードを外してあります。

## Reactを学ぶときに読む順番

1. `src/main.jsx` — Reactアプリを開始する場所
2. `src/App.jsx` — `useState`で画面の状態を管理する場所
3. `src/components/` — 画面を小さな部品に分けた例
4. `src/hooks/useThreeScene.js` — ReactとThree.jsをつなぐ場所
5. `src/three/` — 3D空間を作る処理
6. `src/data/siteData.js` — 曲やリンクのデータ

完成後はReactがメニューや曲画面などのUIを担当し、Three.jsがcanvas内の3D描画を担当します。現在は、その接続を実際に学べるよう一部を課題として残しています。

## リファクタリングの詳しい説明

旧実装からそのまま移した部分、React版で用意した土台、高校生向けに残した課題の詳しい解説は、[`docs/react-refactoring-guide.md`](./docs/react-refactoring-guide.md) にまとめています。

特に、次の点を変更するときは先にこのドキュメントを読んでください。

- ReactとThree.jsの間でデータがどのように移動するか
- 本の照準判定が現在どこまで用意されているか
- ローディング画面を閉じる二つの条件
- UI表示中に3D操作を止めるための下準備
- 旧実装より進めた箇所と、現在残っている制約

## 高校生向け実装課題

次の順番で進めると、Reactの基礎からThree.jsとの接続へ段階的に進めます。

1. [`曲情報UI`](./docs/song-ui-implementation-guide.md) — 選択した曲IDをReactへ渡し、旧songデザインで表示する
2. [`メニューと「Fキーで開く」表示`](./docs/ui-implementation-guide.md) — `useState`、props、条件付き表示、`map()`を学ぶ
3. [`メイン部屋から3つの部屋への移動`](./docs/door-room-transition-guide.md) — 部屋設定とシーンの作り直しを学ぶ

現在の初期画面は、旧`main.js`を復元した灰色のメイン部屋です。上記三機能はまだ実装されていません。旧`menu`と`song`の基本デザインは、それぞれの手順書内に数値と使用画像を含めて記録しています。

## よく使うコマンド

```bash
npm run dev      # 開発用サーバーを起動
npm run lint     # 読みにくい記述や間違いを検査
npm run build    # 公開用ファイルを作成
npm run preview  # 公開用ファイルを手元で確認
```

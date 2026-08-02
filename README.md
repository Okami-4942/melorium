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
- 本に照準を合わせて `F`: 曲の説明を開く
- `Esc`: マウス操作を解除する、またはモーダルを閉じる

## Reactを学ぶときに読む順番

1. `src/main.jsx` — Reactアプリを開始する場所
2. `src/App.jsx` — `useState`で画面の状態を管理する場所
3. `src/components/` — 画面を小さな部品に分けた例
4. `src/hooks/useThreeScene.js` — ReactとThree.jsをつなぐ場所
5. `src/three/` — 3D空間を作る処理
6. `src/data/siteData.js` — 曲やリンクのデータ

ReactはメニューやモーダルなどのUIを担当し、Three.jsはcanvas内の3D描画を担当します。役割を分けることで、どちらか一方を変更したときに、もう一方へ影響しにくい構成にしています。

## リファクタリングの詳しい説明

旧実装からそのまま移した部分と、今回新しく完成させた部分を含めた詳しい解説は、[`docs/react-refactoring-guide.md`](./docs/react-refactoring-guide.md) にまとめています。

特に、次の点を変更するときは先にこのドキュメントを読んでください。

- ReactとThree.jsの間でデータがどのように移動するか
- 本を追加して曲モーダルと結び付ける方法
- ローディング画面を閉じる二つの条件
- モーダル表示中に3D操作を止める仕組み
- 旧実装より進めた箇所と、現在残っている制約

現在の初期画面は、旧`main.js`を復元した灰色のメイン部屋です。メイン部屋から`mezzo`・`forte`・`piano`へ移動する機能は、学習用の実装課題として [`docs/door-room-transition-guide.md`](./docs/door-room-transition-guide.md) に手順をまとめています。ドア移動はまだ実装されていません。

## よく使うコマンド

```bash
npm run dev      # 開発用サーバーを起動
npm run lint     # 読みにくい記述や間違いを検査
npm run build    # 公開用ファイルを作成
npm run preview  # 公開用ファイルを手元で確認
```

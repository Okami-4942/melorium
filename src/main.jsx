import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

/*
 * Reactアプリの開始地点です。
 * index.htmlにある<div id="root">を取得し、その内側をReactに管理してもらいます。
 * これ以降はdocument.createElement()などでDOMを直接作らず、Appが返すJSXから画面を作ります。
 *
 * StrictModeは、開発中に危険な副作用や後片付け忘れを見つけやすくする仕組みです。
 * 開発環境ではuseEffectが「実行 → cleanup → 再実行」されることがありますが、公開用buildでは二重実行されません。
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

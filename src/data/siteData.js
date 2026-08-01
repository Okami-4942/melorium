/*
 * 画面に表示する文章やリンクは、JSXやThree.jsの処理から分離してここで管理します。
 * データと見た目を分けると、曲を追加するときにコンポーネントをコピーせずに済みます。
 * songsのキーと、3D本に付けるsongIdは必ず同じ文字列にしてください。
 *
 * 注意: artist、description、外部URLには今回補った仮データが含まれます。
 * 公開前に、制作者が意図した正式な内容へ置き換えてください。
 */
export const songs = {
  planetes: {
    id: "planetes",
    title: "プラネテス",
    artist: "seiza feat. 初音ミク",
    description:
      "夜空に浮かぶ星のような音を、本の表紙と一緒にゆっくり味わってみてください。",
    youtubeUrl: "https://www.youtube.com/results?search_query=seiza+プラネテス",
    spotifyUrl: "https://open.spotify.com/search/seiza%20プラネテス",
  },
  marySue: {
    id: "marySue",
    title: "メアリー・スーの憂鬱",
    artist: "ナナホシ管弦楽団",
    description:
      "物語の中へ入り込むような一曲です。3D空間で本を眺めてから音楽を聴いてみましょう。",
    youtubeUrl:
      "https://www.youtube.com/results?search_query=メアリー・スーの憂鬱",
    spotifyUrl: "https://open.spotify.com/search/メアリー・スーの憂鬱",
  },
};

// MenuModalはこの配列をmap()し、要素の数だけリンクを表示します。
export const menuLinks = [
  {
    label: "使用曲プレイリスト",
    href: "https://music.youtube.com/playlist?list=PLbmd-OK5ClX8ZoZ5WuEk4SjFsVKJdWc-Z&si=mpIBRzTbA8D7Km_Y",
  },
  {
    label: "製作者のXへ",
    href: "https://x.com/sousoukanaderu",
  },
];

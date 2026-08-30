/*
 * 画面に表示する文章やリンクは、JSXやThree.jsの処理から分離してここで管理します。
 * データと見た目を分けると、曲を追加するときにコンポーネントをコピーせずに済みます。
 * songsのキーと、3D本に付けるsongIdは必ず同じ文字列にしてください。
 *
 * 注意: artist、description、外部URLには今回補った仮データが含まれます。
 * 公開前に、制作者が意図した正式な内容へ置き換えてください。
 */
export const songs = {
  hidamari: {
    id: "hidamari",
    title: "陽だまりのセツナ",
    artist: "赤乃わい",
    description:
      "時の流れと別れを描きながら、大切な人との絆が優しく歌われている曲。",
    youtubeUrl:
      "https://youtu.be/D2gWpqM2GFQ?si=DbZ6sWPn7MMJiioA",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/6aDvQRsMa4QM7nXDA8AVYN?si=cd998adb231247fb",
  },
  planetes: {
    id: "planetes",
    title: "プラネテス",
    artist: "seiza feat. 初音ミク",
    description:
      "夜空に浮かぶ星のような音を、本の表紙と一緒にゆっくり味わってみてください。",
    youtubeUrl: "https://youtu.be/UPztJYCAnO4?si=d1d7j1ae4NnYKf2M",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/1juR8DDDsEBhTPkMcggme2?si=92120924745c4306",
  },
  marySue: {
    id: "marySue",
    title: "メアリー・スーの憂鬱",
    artist: "鳥籠の中で僕たちは、 feat.むト",
    description:
      "物語の中へ入り込むような一曲です。3D空間で本を眺めてから音楽を聴いてみましょう。",
    youtubeUrl:
      "https://www.youtube.com/results?search_query=メアリー・スーの憂鬱",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/2dw7cXNh8cxRc0gxJOcF4K?si=00591b5b38e34069",
  },
  dec: {
  id: "dec",
  title: "Dec",
  artist: "正式なアーティスト名を入力",
  description: "正式な曲紹介を入力",
  youtubeUrl: "正式なYouTube URLを入力",
  spotifyUrl: "正式なSpotify URLを入力",
},
sleepwalk: {
  id: "sleepwalk",
  title: "Sleepwalk",
  artist: "正式なアーティスト名を入力",
  description: "正式な曲紹介を入力",
  youtubeUrl: "正式なYouTube URLを入力",
  spotifyUrl: "正式なSpotify URLを入力",
},
};

// UI課題で作るMenuModalは、この配列をmap()して要素の数だけリンクを表示します。
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

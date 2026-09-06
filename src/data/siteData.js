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
      "宇宙の浮遊感と切なさの中に、大切な人と生きる強い想いを描く曲。",
    youtubeUrl: "https://youtu.be/UPztJYCAnO4?si=d1d7j1ae4NnYKf2M",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/1juR8DDDsEBhTPkMcggme2?si=92120924745c4306",
  },
  marySue: {
    id: "marySue",
    title: "メアリー・スーの憂鬱",
    artist: "鳥籠の中で僕たちは、 feat.むト",
    description:
      "理想と現実の狭間で揺れる、自己愛と孤独を描いた退廃的な楽曲。",
    youtubeUrl:
      "https://youtu.be/gYjTxnVRojk?si=guUxDnwfkZ2qbeI2",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/2dw7cXNh8cxRc0gxJOcF4K?si=00591b5b38e34069",
  },
  dec: {
    id: "dec",
    title: "Dec",
    artist: "kanaria",
    description: "疾走感のあるサウンドに、切ない恋と自己犠牲的な想いを重ねた楽曲。",
    youtubeUrl: "https://youtu.be/9xbT8OZcDJQ?si=W2VrpYv3CFY72zBJ",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/44PT3ussI7vcQb6QYJhLF8?si=e027ef64c8ef4a2a",
  },
  sleepwalk: {
    id: "sleepwalk",
    title: "Sleepwalk",
    artist: "なとり",
    description: "踊れる心地よさの裏に、不安や違和感が潜む夜のような楽曲。",
    youtubeUrl: "https://youtu.be/l0vUtRwObp4?si=GFl52qChD0Dn62Hr",
    spotifyUrl: "https://open.spotify.com/intl-ja/track/5WHq3vcWRRb9xeQKgv7lAi?si=839f1d1222a741c6",
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

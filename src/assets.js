/*
 * 画像や3Dモデルの読み込み場所を一つにまとめたファイルです。
 *
 * Viteでは素材をimportすると、開発時とbuild後の両方で使えるURLへ変換されます。
 * GLBはJavaScriptとして解釈せずURLとして扱いたいため、末尾に「?url」を付けています。
 * 新しい画像やモデルを追加するときも、まずこのファイルへimportを追加してください。
 */
import doorModelUrl from "../models/door.glb?url";
import tableModelUrl from "../models/table.glb?url";
import greenBackUrl from "../images/green-ura.jpg";
import redBackUrl from "../images/red-ura.jpg";
import planetesCoverUrl from "../images/プラネテス.png";
import planetesSpineUrl from "../images/プラネテス1背.png";
import marySueCoverUrl from "../images/メアリー・スーの憂鬱.png";
import marySueSpineUrl from "../images/メアリー・スーの憂鬱3背.png";
import hidamariCoverUrl from "../images/陽だまりのセツナ.png";
import hidamariSpineUrl from "../images/陽だまりのセツナ1背.png";
import pianoDoorUrl from "../images/pdoorm.png";
import forteDoorUrl from "../images/fdoorm.png";
import mezzoDoorUrl from "../images/mdoorm.png";
import largoDoorUrl from "../images/ldoorm.png";
import loadingNoteUrl from "../images/lloading.svg";

// 用途別のオブジェクトにまとめることで、利用側がassets.models.doorのように読めます。
export const assets = {
  models: {
    door: doorModelUrl,
    table: tableModelUrl,
  },
  textures: {
    bookBack: greenBackUrl,
    mainBookBack: redBackUrl,
    planetesCover: planetesCoverUrl,
    planetesSpine: planetesSpineUrl,
    marySueCover: marySueCoverUrl,
    marySueSpine: marySueSpineUrl,
    hidamariCover: hidamariCoverUrl,
    hidamariSpine: hidamariSpineUrl,
    pianoDoor: pianoDoorUrl,
    forteDoor: forteDoorUrl,
    mezzoDoor: mezzoDoorUrl,
    largoDoor: largoDoorUrl,
  },
  ui: {
    loadingNote: loadingNoteUrl,
  },
};

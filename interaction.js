console.log("interaction.js が読み込まれました！");


const interactableObjects = [];


// インタラクト対象を登録する関数
export function registerInteraction(data) {

    interactableObjects.push(data);

    console.log("登録されました:", data);

}


window.addEventListener("keydown", (e) => {


    if (e.code === "KeyF") {

        console.log("Fキーが押されました！");

    }

});



registerInteraction({

    object: "test",

    text: "テスト",

    action: () => {

        console.log("テスト実行");

    }

});
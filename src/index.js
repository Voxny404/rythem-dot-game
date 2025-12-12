
const fileInput = document.getElementById("fileInput");
const audioPlayer = document.getElementById("audioPlayer");
let game = null;

audioPlayer.volume = 0.5;

let network = new Network()
let menu = new Menu(network)
menu.init()

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

fileInput.addEventListener("change", async function () {

    const file = this.files[0];
    if (!file) {
        menu.drawMenu();
        return
    }

    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    
    if (network.isConnected()) {
        if (network.isHost) menu.showMessageOnScreen("Transfering data ...")
        const buffer = await file.arrayBuffer();
        network.channel.send(buffer);
        await sleep(1000)

    }

    initGame();
});

async function reciveFileFromHost(file){
    menu.showMessageOnScreen("Reciving data ...")
    await sleep(1000)
    if (!file) {
        menu.drawMenu();
        return
    }

    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    
    initGame();
}

async function initGame(){
    menu.showMessageOnScreen("Starting Game ...")
    await sleep(1000)

    await countdown();

    game = new Game();
    game.init();
 
}
async function countdown(){
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
        // Countdown
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "80px Arial";

        for (let i = 3; i >= 1; i--) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(i, canvas.width / 2, canvas.height / 2);
            await sleep(1000); // wait 1 second
        }

        // Optional: show "GO!" before starting
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText("GO!", canvas.width / 2, canvas.height / 2);
        await sleep(500);

}

audioPlayer.addEventListener("ended", async() => {
    
    await sleep(5000)
    
    cancelAnimationFrame(game.animationFrameId)
    console.log("Song finished!")
    menu.displayScore(game.score, game.challangerScore)
    
    await sleep(5000)
    
    game = null;
    menu = new Menu()
    menu.init()
});

function restart(){
    game = null;
    menu = new Menu(network)
    menu.init()
}
function restartNetwork(){
    network = new Network();
}

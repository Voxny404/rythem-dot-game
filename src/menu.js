
class Menu {
    constructor(network) {
        this.network = network;
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.fileInput = document.getElementById("fileInput");
        this.metaWindow = document.getElementById("metaWindow");
        this.closeBtn = document.getElementById("closeBtn");
        this.closeBtn.addEventListener("click", () => this.hideMetaWindow(true));
        this.sendButton = document.getElementById('sendBtn')
        this.sendButton.onclick = () => { this.network.connect()};
        
        this.menuOptions = [
            { text: "( Play ) Select a Song", y: 250 },
            { text: "Multiplayer", y: 350 }
        ];

        this.selectedIndex = 0; // start with first option highlighted
    }

    showMetaWindow(){
        this.metaWindow.style.display = "flex";
    }

    hideMetaWindow(reset) {
        this.metaWindow.style.display = "none";
        if (reset) restart()
    }
    
    setTextMetaWindow(htmlContent) {
        this.metaWindow.querySelector("#metaContent").innerHTML = htmlContent;
    }
    
    drawMenu() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = "center";

        // Title
        this.ctx.fillStyle = "white";
        this.ctx.font = "60px Arial";
        this.ctx.fillText("Rhythm Dot Game", this.canvas.width / 2, 150);

        // Options
        this.ctx.font = "40px Arial";

        this.menuOptions.forEach((option, index) => {
            if (index === this.selectedIndex) {
                this.ctx.fillStyle = "yellow";   // highlight selected option
            } else {
                this.ctx.fillStyle = "white";
            }

            this.ctx.fillText(option.text, this.canvas.width / 2, option.y);
        });
    }

    init() {
        this.drawMenu();

        // Mouse click listener
        this.canvas.addEventListener("click", (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const y = event.clientY - rect.top;

            this.menuOptions.forEach((option, index) => {
                if (y > option.y - 40 && y < option.y) {
                    this.selectedIndex = index;
                    this.drawMenu();
                    this.activateSelection();
                }
            });
        });

        // Keyboard navigation
        document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowUp") {
                this.selectedIndex =
                    (this.selectedIndex - 1 + this.menuOptions.length) %
                    this.menuOptions.length;
                this.drawMenu();
            }

            if (event.key === "ArrowDown") {
                this.selectedIndex =
                    (this.selectedIndex + 1) % this.menuOptions.length;
                this.drawMenu();
            }

            if (event.key === "Enter") {
                this.activateSelection();
            }
        });
    }

    activateSelection() {
        const option = this.menuOptions[this.selectedIndex].text;

        if (option === this.menuOptions[0].text) {
            this.startGame();
        }
        if (option === this.menuOptions[1].text) {
            this.startMultiplayer();
        }
    }

    startGame() {
        this.fileInput.click();
    }

    async startMultiplayer() {
         
        if (!network.isConnected()) {
            this.network.init();
            this.showMetaWindow()
            this.showMessageOnScreen("Connecting to peer...")
        } else {

            if (network.isHost) {
                 this.showMessageOnScreen("Select a song") 
                 this.startGame()
            } else this.showMessageOnScreen("Waiting for host") 
        }
    }
    
    displayScore(score, score2) {
        let msg = `⚔️  Scoreboard  ⚔️\n`;
        msg += `You: ${score}`;
        if (score2) msg += `   |   Challenger: ${score2}`;
        if (score2) {
            if (score > score2) {
                msg += `\n🏆 You Win!`;
            } else if (score < score2) {
                msg += `\n💀 Challenger Wins!`;
            } else {
                msg += `\n🤝 It's a Tie!`;
            }
        }
        this.showScoreOnScreen(msg);
    }
    showScoreOnScreen(msg) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.font = "32px Arial";
        this.ctx.textAlign = "center";

        const lines = msg.split("\n");
        lines.forEach((line, i) => {
            this.ctx.fillText(line, this.canvas.width / 2, 260 + i * 40);
        });
    }    

    showMessageOnScreen(msg){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.fillText(msg, this.canvas.width / 2, 300);
    }
}


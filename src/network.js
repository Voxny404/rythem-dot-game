class Network{
    constructor(){
        this.pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        this.channel = null;
        this.isHost = true;
        this.initialized = false;

    }

    async init() {
        this.createDataChannel();
        this.initialized = true;
        await this.createOffer();
    }

    createDataChannel(){
        // Make sure it starts fresh firefox does not clear it
        document.getElementById('remote').value = ""

        // Offerer: create data channel
        this.channel = this.pc.createDataChannel("chat");
        this.channel.onopen = () => console.info( "Created data channel!");
        this.channel.onmessage = e => {
            this.isHost = false;

            if (e.data instanceof ArrayBuffer) {
                const blob = new Blob([e.data]);
                reciveFileFromHost(blob);
                return;
            }

            // Otherwise treat as JSON/text
            this.forwardMessage(e.data);
        };

        // Handle incoming data channel (answerer)
        this.pc.ondatachannel = event => {
            this.channel = event.channel;
            this.channel.onopen = () => console.info("Incomming data channel!");
            this.channel.onmessage = e => this.forwardMessage(e.data);

            // we wanna hide the window since we connected and do not need it anymore
            menu.hideMetaWindow()
            
            menu.startGame()

        };

        // ICE candidates -> populate local SDP when done
        this.pc.onicecandidate = e => {
            if (!e.candidate) {
                document.getElementById('local').value = JSON.stringify(this.pc.localDescription);
            }
        };
    }


    async createOffer(){
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
    }

    async connect() {
        const remoteSDP = JSON.parse(document.getElementById('remote').value);
        await this.pc.setRemoteDescription(remoteSDP);

        if (remoteSDP.type === "offer") {
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            document.getElementById('local').value = JSON.stringify(this.pc.localDescription);
        }
        console.log( "Remote SDP set. Waiting for channel to open...");
    }

    sendMsg(msg) {

        if (this.isConnected()) {
            this.channel.send(JSON.stringify(msg));
        } else {
            console.warn( "Channel not open yet!");
        }
    }

    forwardMessage(msg) {
        console.log("Raw Peer Message:", msg);

        // If msg is JSON text, parse it
        let data;
        try {
            data = JSON.parse(msg);
        } catch {
            console.warn("Received non-JSON message:", msg);
            return;
        }

        console.log("Parsed Peer Message:", data);

        if (data.score !== undefined) {
            game.setChallangerScore(data.score);
        }
    }

    isConnected() {
        return this.channel && this.channel.readyState === "open";
    }
}

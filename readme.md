# Rhythm Dot Game 🎵

A **browser-based rhythm game** with **real-time audio analysis** and **multiplayer support**. Hit dots in sync with music to score points, track streaks, and compete against other players using WebRTC.

---

## Features

- **Real-time audio analysis** using the Web Audio API  
- **Automatic beat detection** and dot spawning based on frequency bands  
- **Responsive gameplay** with score multipliers and hit streaks  
- **Visual feedback** via hit particles and colored dot animations  
- **Challenger mode**: track opponent scores in real-time  
- **Peer-to-peer multiplayer** using WebRTC Data Channels  

---

## How to Play

1. Open \`index.html\` in a modern browser (Chrome or Firefox recommended).  
2. Load your favorite audio file.  
3. Press the corresponding keys when dots reach the bottom:  

| Dot | Key |
|-----|-----|
| Dot 1 | A |
| Dot 2 | S |
| Dot 3 | D |
| Dot 4 | F |
| Dot 5 | G |

4. Score points for each successful hit and build up multipliers for streaks!  
5. In multiplayer mode, share your SDP with your opponent to connect and compete.

---

## Multiplayer Setup (WebRTC)

1. One player acts as the **host** (creates an offer).  
2. Copy the **local SDP** from the host and paste it into the **remote SDP** field for the challenger.  
3. Challenger sets their local SDP as the host’s remote SDP, then sends back their SDP.  
4. Once the data channel is open, **scores are synced in real-time**.  

\`Network.js\` handles:

- Peer connection setup  
- Data channel messaging  
- Real-time score updates  

---

## Installation

1. Clone the repository:  

\`\`\`bash
git clone https://github.com/yourusername/rhythm-dot-game.git
\`\`\`

2. Open \`index.html\` in your browser.  
3. Make sure your browser allows audio playback (some browsers block autoplay).  

---

## Configuration

- **BPM detection**: Automatically detects beats from the first 10 seconds of the track.  
- **Dot fall speed**: Adjust \`fallMulti\` in \`Game\` class to make dots fall faster or slower.  
- **Prediction offset**: Adjust \`advance\` in \`spawnDot()\` to make dots appear earlier for tighter timing.  

---

## Technologies

- HTML5 Canvas for graphics  
- Web Audio API for audio analysis  
- Vanilla JavaScript (ES6)  
- WebRTC for peer-to-peer multiplayer  

---

## Future Improvements

- Support for multiple audio formats  
- Advanced beat detection for complex tracks  
- Improved UI/UX for multiplayer setup  
- Customizable skins and themes  

---

## License

MIT License © [Voxny404]


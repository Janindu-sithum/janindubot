const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { createCanvas } = require('canvas');

// --- Express Server (Keeping Bot Alive) ---
const app = express();
app.get('/', (req, res) => res.send('Lucifer Bot is Online! 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('Web Server Ready!'));

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyDFNj9un4xsHzNEp4HjaKeFNuCCt-5GNxA",
    authDomain: "lucifer-e6969.firebaseapp.com",
    projectId: "lucifer-e6969",
    storageBucket: "lucifer-e6969.firebasestorage.app",
    messagingSenderId: "470007367808",
    appId: "1:470007367808:web:9c4315cb90442b243b7e65"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// --- Card Generator ---
async function createMemberCard(name, guildID, ffid) {
    const canvas = createCanvas(600, 350);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 600, 350);
    ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 10; ctx.strokeRect(10, 10, 580, 330);
    ctx.fillStyle = '#f39c12'; ctx.font = 'bold 35px Arial'; ctx.fillText('LUCIFER GUILD', 170, 60);
    ctx.fillStyle = '#ffffff'; ctx.font = '25px Arial'; ctx.fillText(`NAME  : ${name}`, 50, 150);
    ctx.fillText(`FF ID   : ${ffid}`, 50, 200);
    ctx.fillStyle = '#f39c12'; ctx.font = 'bold 30px Arial'; ctx.fillText(`GUILD ID: ${guildID}`, 50, 280);
    return canvas.toBuffer();
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- Pairing Code Logic ---
    if (!sock.authState.creds.registered) {
        // මෙතන ඔයාගේ WhatsApp Number එක දෙන්න (International Format: 947xxxxxxxx)
        const phoneNumber = "94740256201"; 
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n\n--- YOUR PAIRING CODE: ${code} ---\n\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log('✅ BOT CONNECTED SUCCESSFULLY!');
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    // --- Message Logic ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

        if (body.startsWith('#register')) {
            const args = body.split(' ');
            if (args.length < 3) return sock.sendMessage(sender, { text: "❌ #register [නම] [FF_ID]" });

            const name = args[1];
            const ffid = args[2];
            const guildID = `LUC-${Math.floor(1000 + Math.random() * 9000)}`;

            try {
                const userRef = doc(db, "members", sender);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) return sock.sendMessage(sender, { text: "ඔයා දැනටමත් Register වෙලා ඉන්නේ මචං!" });

                await setDoc(userRef, { number: sender, name, ffid, guildID });
                const card = await createMemberCard(name, guildID, ffid);
                await sock.sendMessage(sender, { image: card, caption: `✅ Registered! ID: ${guildID}` });
            } catch (e) {
                console.log(e);
            }
        }
    });
}

startBot();

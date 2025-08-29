require('dotenv').config();
const { terriid } = require('./id');
const express = require('express');
const fs = require('fs');
const path = require('path');
let router = express.Router();
const pino = require("pino");
const { Storage } = require("megajs");

const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Ensure temp directory exists
const TEMP_DIR = path.resolve(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

async function uploadCredsToMega(credsPath) {
    try {
        const { MEGA_EMAIL, MEGA_PASSWORD } = process.env;
        if (!MEGA_EMAIL || !MEGA_PASSWORD) throw new Error("Mega credentials not set in environment variables.");
        const storage = await new Storage({
            email: MEGA_EMAIL,
            password: MEGA_PASSWORD
        }).ready;
        console.log('[DEBUG] Mega storage initialized.');
        if (!fs.existsSync(credsPath)) {
            throw new Error(`File not found: ${credsPath}`);
        }
        const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: `${randomMegaId()}.json`,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;
        console.log('[DEBUG] Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log('[DEBUG] Session Url:', megaUrl);
        return megaUrl;
    } catch (error) {
        console.error('[DEBUG] Error uploading to Mega:', error);
        throw error;
    }
}

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

function waitForFile(filePath, timeout = 5000, interval = 100) {
    return new Promise((resolve, reject) => {
        const endTime = Date.now() + timeout;
        (function checkFile() {
            if (fs.existsSync(filePath)) return resolve();
            if (Date.now() > endTime) return reject(new Error("[DEBUG] Timeout waiting for file: " + filePath));
            setTimeout(checkFile, interval);
        })();
    });
}

router.get('/', async (req, res) => {
    const id = terriid();
    let num = req.query.number;

    async function GIFTED_PAIR_CODE() {
        const sessionPath = path.join(TEMP_DIR, id);
        if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        try {
            let Gifted = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari")
            });

            if (!Gifted.authState.creds.registered) {
                await delay(500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Gifted.requestPairingCode(num);
                console.log('[DEBUG] Pairing code generated:', code);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Gifted.ev.on('creds.update', saveCreds);

            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                console.log('[DEBUG] Connection update:', connection);

                if (connection == "open") {
                    const filePath = path.join(sessionPath, 'creds.json');
                    console.log('[DEBUG] Waiting for creds.json at', filePath);
                    try {
                        await waitForFile(filePath, 5000, 100);
                        console.log('[DEBUG] creds.json exists.');
                    } catch (e) {
                        console.error('[DEBUG] creds.json not created in time');
                        return;
                    }

                    let megaUrl = '';
                    try {
                        console.log('[DEBUG] Uploading creds to Mega...');
                        megaUrl = await uploadCredsToMega(filePath);
                        console.log('[DEBUG] Mega URL:', megaUrl);
                    } catch (e) {
                        megaUrl = 'Error uploading to Mega';
                        console.error('[DEBUG] Mega upload failed:', e);
                    }
                    const sid = megaUrl && megaUrl.includes("https://mega.nz/file/")
                        ? 'Veronica~' + megaUrl.split("https://mega.nz/file/")[1]
                        : 'Error: Invalid URL';

                    console.log('[DEBUG] SID:', sid);

                    let sidMsg;
                    try {
                        sidMsg = await Gifted.sendMessage(
                            Gifted.user.id,
                            {
                                text: sid,
                                contextInfo: {
                                    mentionedJid: [Gifted.user.id],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363397100406773@newsletter',
                                        newsletterName: 'VERONICA°S SESSION ID',
                                        serverMessageId: 143
                                    }
                                }
                            },
                            {
                                disappearingMessagesInChat: true,
                                ephemeralExpiration: 86400
                            }
                        );
                        console.log('[DEBUG] SID message sent!');
                    } catch (e) {
                        console.error('[DEBUG] Failed to send SID message:', e);
                    }

                    const GIFTED_TEXT = `
*✅sᴇssɪᴏɴ ɪᴅ ɢᴇɴᴇʀᴀᴛᴇᴅ✅*
______________________________
*🌟 Show your support by giving our repo a star! 🌟*
🔗 https://github.com/Terrizev/VERONICA-AI
______________________________

Use your Session ID Above to Deploy your Bot.
Check on YouTube Channel for Deployment Procedure(Ensure you have Github Account and Billed Heroku Account First.)
Don't Forget To Give Star⭐ To My Repo`;

                    try {
                        await Gifted.sendMessage(
                            Gifted.user.id,
                            {
                                text: GIFTED_TEXT,
                                contextInfo: {
                                    mentionedJid: [Gifted.user.id],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363397100406773@newsletter',
                                        newsletterName: 'VERONICA-BOT',
                                        serverMessageId: 143
                                    }
                                }
                            },
                            {
                                quoted: sidMsg,
                                disappearingMessagesInChat: true,
                                ephemeralExpiration: 86400
                            }
                        );
                        console.log('[DEBUG] Info message sent!');
                    } catch (e) {
                        console.error('[DEBUG] Failed to send info message:', e);
                    }

                    await Gifted.ws.close();
                    await removeFile(sessionPath);
                    console.log('[DEBUG] Session closed and temp files removed.');
                } else if (
                    connection === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output.statusCode != 401
                ) {
                    console.log('[DEBUG] Connection closed, retrying...');
                    await delay(5000);
                    GIFTED_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error('[DEBUG] Service Has Been Restarted:', err);
            await removeFile(sessionPath);
            if (!res.headersSent) {
                await res.send({ code: "Service is Currently Unavailable" });
            }
        }
    }

    return await GIFTED_PAIR_CODE();
});

module.exports = router;

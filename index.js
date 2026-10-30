import express from 'express';
import { default as makeWASocket, useMultiFileAuthState, delay, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public folder madhun HTML serve karne
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

// Pairing Code Route
app.get('/code', async (req, res) => {
    let phoneNumber = req.query.phone;
    if (!phoneNumber) {
        return res.json({ error: 'Phone number is required!' });
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '919356730236');
    const sessionDir = path.join(__dirname, 'temp_session_' + Date.now());

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.macOS('Chrome')
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            
            res.json({ code: code });
        } else {
            res.json({ code: 'ALREADY_REGISTERED' });
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log('WhatsApp connected successfully!');
                // Ithe tumhi session idwaigairah handle karu shakta
                setTimeout(() => {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }, 10000);
            }
        });

    } catch (err) {
        console.error(err);
        res.json({ error: 'Failed to generate pairing code!' });
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

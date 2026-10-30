import express from 'express';
import { default as makeWASocket, useMultiFileAuthState, delay, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel sathi /tmp folder use karne mahatvache ahe
const sessionDir = path.join('/tmp', 'rahul_session');

app.get('/code', async (req, res) => {
    let phoneNumber = req.query.phone;
    if (!phoneNumber) {
        return res.json({ error: 'Phone number is required!' });
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.macOS('Chrome')
        });

        if (!sock.authState.creds.registered) {
            await delay(2000);
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            
            res.json({ code: code });
        } else {
            res.json({ code: 'ALREADY_REGISTERED' });
        }

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error(err);
        res.json({ error: 'Failed to generate pairing code!' });
    }
});

// Vercel sathi app export karne (app.listen() naste)
export default app;

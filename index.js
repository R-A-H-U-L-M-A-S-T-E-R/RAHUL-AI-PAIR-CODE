import express from 'express';
import { default as makeWASocket, useMultiFileAuthState, delay, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/code', async (req, res) => {
    let phoneNumber = req.query.phone;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required!' });
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    const sessionDir = path.join('/tmp', 'session_' + Date.now());

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
            
            if (!res.headersSent) {
                return res.json({ code: code });
            }
        } else {
            if (!res.headersSent) {
                return res.json({ code: 'ALREADY_REGISTERED' });
            }
        }

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error('API Error:', err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to generate pairing code!' });
        }
    }
});

export default app;

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const YTMusic = require('ytmusic-api');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Endpoint Proxy Streaming untuk menembus blokir YouTube
app.get('/api/proxy', async (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) return res.status(400).send('Parameter URL wajib diisi');

    const range = req.headers.range;
    const axiosHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
    };

    if (range) {
        axiosHeaders['Range'] = range;
    }

    try {
        const response = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
            headers: axiosHeaders,
            timeout: 20000 // Timeout lebih lama untuk streaming
        });

        // Teruskan header asli dari YouTube (Content-Type, Content-Length, dll)
        res.status(response.status);
        res.set(response.headers);
        
        // Pipa (pipe) data langsung dari YouTube ke HP melalui server
        response.data.pipe(res);
        
        // Log sederhana
        console.log(`[PROXY] Streaming started: ${streamUrl.substring(0, 50)}...`);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send('Terjadi kesalahan saat streaming melalui proxy');
        }
    }
});

let ytmusic = new YTMusic();
let initialized = false;

// Initialize YTMusic with optional cookie
app.post('/api/init', async (req, res) => {
    try {
        const { cookie } = req.body;
        ytmusic = new YTMusic();
        await ytmusic.initialize(cookie || "");
        initialized = true;
        res.json({ success: true, message: 'YTMusic initialized' });
    } catch (error) {
        console.error('Init error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search for songs
app.get('/api/search', async (req, res) => {
    try {
        if (!initialized) {
            await ytmusic.initialize();
            initialized = true;
        }
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
        
        const results = await ytmusic.search(q);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get content for the home screen (Trending)
app.get('/api/home', async (req, res) => {
    try {
        if (!initialized) {
            await ytmusic.initialize();
            initialized = true;
        }
        const sections = await ytmusic.getHomeSections();
        let songs = [];
        for (const section of sections) {
            if (section.contents) {
                // Collect songs from sections
                songs.push(...section.contents.filter(item => item.type === 'SONG'));
            }
        }
        res.json(songs.slice(0, 20)); // Return first 20 songs
    } catch (error) {
        console.error('Home error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get personalized library
app.get('/api/library', async (req, res) => {
    try {
        if (!initialized) return res.status(400).json({ error: 'YTMusic not initialized with cookie' });
        const sections = await ytmusic.getHomeSections(); 
        res.json(sections);
    } catch (error) {
        console.error('Library error:', error);
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`!!! ERROR: Port ${port} sudah digunakan oleh aplikasi lain.`);
    } else {
        console.error('Terjadi kesalahan pada server:', e);
    }
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const YTMusic = require('ytmusic-api');
const play = require('play-dl');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

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

// Stream audio directly
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const streamInfo = await play.stream(`https://www.youtube.com/watch?v=${videoId}`);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        streamInfo.stream.pipe(res);
    } catch (error) {
        console.error('Stream error for videoId:', videoId, error);
        res.status(500).json({ error: error.message });
    }
});

// Get content for the home screen
app.get('/api/home', async (req, res) => {
    try {
        if (!initialized) {
            await ytmusic.initialize();
            initialized = true;
        }
        const sections = await ytmusic.getHomeSections();
        // Flatten or filter sections to just songs for simplicity on home
        let songs = [];
        for (const section of sections) {
            if (section.contents) {
                songs.push(...section.contents.filter(item => item.type === 'SONG'));
            }
        }
        res.json(songs.slice(0, 20)); // Return first 20 songs
    } catch (error) {
        console.error('Home error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update library fallback
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

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});

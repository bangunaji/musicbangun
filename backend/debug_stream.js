const play = require('play-dl');

async function debugStream() {
    const videoId = 'bAz3e3nHwgc';
    console.log(`Debug Video ID: ${videoId}`);
    try {
        const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
        console.log(`Jumlah format ditemukan: ${info.format.length}`);
        
        info.format.slice(0, 3).forEach((f, i) => {
            console.log(`Format ${i}: mimeType=${f.mimeType}, hasAudio=${!!f.audioQuality}, urlExists=${!!f.url}`);
        });

        const audioFormats = info.format.filter(f => f.mimeType && f.mimeType.includes('audio'));
        console.log(`Jumlah format audio: ${audioFormats.length}`);

        if (audioFormats.length > 0) {
            console.log(`URL format audio pertama: ${audioFormats[0].url.substring(0, 50)}...`);
        }
    } catch (error) {
        console.log(`ERROR: ${error.message}`);
    }
}

debugStream();

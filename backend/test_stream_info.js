const play = require('play-dl');

async function testStreamFromInfo() {
    const videoId = 'bAz3e3nHwgc';
    console.log(`--- Testing stream_from_info for: ${videoId} ---`);
    
    try {
        console.log('1. Fetching video info...');
        const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
        
        console.log('2. Creating stream from info...');
        const stream = await play.stream_from_info(info);
        
        if (stream && stream.url) {
            console.log('✅ SUCCESS!');
            console.log(`Stream URL: ${stream.url.substring(0, 100)}...`);
        } else {
            console.log('❌ FAILED: Stream created but no URL found.');
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        console.log(error.stack);
    }
}

testStreamFromInfo();

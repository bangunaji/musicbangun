const YTMusic = require('ytmusic-api');

async function testApi() {
    try {
        console.log('--- Memulai Pengujian API YouTube Music ---');
        const ytmusic = new YTMusic();
        
        console.log('1. Menginisialisasi API...');
        await ytmusic.initialize();
        
        console.log('2. Mengambil data Home Sections...');
        const sections = await ytmusic.getHomeSections();
        
        console.log(`Berasil mendapatkan ${sections.length} seksi.`);
        
        // Tampilkan 2 seksi pertama untuk verifikasi
        sections.slice(0, 2).forEach((section, index) => {
            console.log(`\nSeksi ${index + 1}: ${section.title}`);
            if (section.contents && section.contents.length > 0) {
                console.log(`Contoh item pertama: "${section.contents[0].name || section.contents[0].title}" [Type: ${section.contents[0].type}]`);
            } else {
                console.log('Seksi ini tidak memiliki konten langsung.');
            }
        });

        console.log('\n3. Menguji pencarian lagu "Trending"...');
        const searchResults = await ytmusic.search('trending');
        console.log(`Ditemukan ${searchResults.length} hasil pencarian.`);
        
        if (searchResults.length > 0) {
            console.log(`Lagu pertama: ${searchResults[0].name} oleh ${searchResults[0].artist?.name || 'Unknown'}`);
        }

        console.log('\n--- Pengujian Selesai: API berfungsi dengan baik ---');
    } catch (error) {
        console.error('\n!!! TERJADI KESALAHAN !!!');
        console.error(error);
    }
}

testApi();

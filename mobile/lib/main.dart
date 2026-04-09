import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';
import 'package:dio/dio.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';
import 'constants.dart';

void main() {
  runApp(const MusicPlayerApp());
}

final AudioPlayer _audioPlayer = AudioPlayer();
final YoutubeExplode _ytExplode = YoutubeExplode();

class MusicPlayerApp extends StatelessWidget {
  const MusicPlayerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Violet Music',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.deepPurple,
        scaffoldBackgroundColor: const Color(0xFF0F0425),
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.deepPurple,
          brightness: Brightness.dark,
          surface: const Color(0xFF1A0B3D),
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
        useMaterial3: true,
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  Map<String, dynamic>? _currentSong;
  bool _isPlaying = false;

  void _playSong(Map<String, dynamic> song) async {
    setState(() {
      _currentSong = song;
      _isPlaying = true;
    });
    try {
      final videoId = song['videoId'];
      
      // Step 1: Ambil manifest streaming langsung dari YouTube (Native on Phone)
      final manifest = await _ytExplode.videos.streamsClient.getManifest(videoId);
      
      // Step 2: Pilih stream audio (Utamakan m4a/mp4 untuk kompatibilitas terbaik di Android)
      final audioStream = manifest.audioOnly.where((s) => s.container.name == 'mp4').isNotEmpty
          ? manifest.audioOnly.where((s) => s.container.name == 'mp4').withHighestBitrate()
          : manifest.audioOnly.withHighestBitrate();
      
      // Step 3: Putar menggunakan AudioSource dengan User-Agent kustom
      // Beberapa stream YouTube memerlukan User-Agent agar tidak dianggap bot/ilegal
      await _audioPlayer.setAudioSource(
        AudioSource.uri(
          audioStream.url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
          },
        ),
      );
      _audioPlayer.play();
    } catch (e) {
      debugPrint('Error playing song: $e');
      String errorMessage = e.toString();
      
      // Deteksi error spesifik untuk pesan yang lebih user-friendly
      if (errorMessage.contains('(0) source error')) {
        errorMessage = "Gagal memuat sumber (Bisa jadi karena batasan YouTube atau jaringan).";
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $errorMessage'),
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(label: 'Details', textColor: Colors.white, onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text("Detail Error"),
                  content: Text(e.toString()),
                ),
              );
            }),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _currentIndex,
            children: [
              HomeScreen(onPlay: _playSong),
              SearchScreen(onPlay: _playSong),
              const LibraryScreen(),
            ],
          ),
          if (_currentSong != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: MiniPlayer(
                song: _currentSong!,
                onExpand: () => _showFullPlayer(context),
              ),
            ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF1A0B3D),
        selectedItemColor: Colors.deepPurpleAccent,
        unselectedItemColor: Colors.white54,
        items: const [
          BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.search), label: 'Search'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.library), label: 'Library'),
        ],
      ),
    );
  }

  void _showFullPlayer(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FullPlayerScreen(song: _currentSong!),
    );
  }
}

// --- Home Screen ---
class HomeScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onPlay;
  const HomeScreen({super.key, required this.onPlay});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _trendingSongs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchHomeData();
  }

  Future<void> _fetchHomeData() async {
    try {
      final dio = Dio();
      final response = await dio.get('${Constants.baseUrl}/api/home');
      setState(() {
        _trendingSongs = response.data;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Home data error: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text('Violet Music', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.deepPurple, Color(0xFF0F0425)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Trending Now', style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 16),
                  _isLoading 
                      ? const Center(child: CircularProgressIndicator())
                      : GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: 0.8,
                          ),
                          itemCount: _trendingSongs.length,
                          itemBuilder: (context, index) {
                            final song = _trendingSongs[index];
                            return SongCard(song: song, onTap: () => widget.onPlay(song));
                          },
                        ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SongCard extends StatelessWidget {
  final Map<String, dynamic> song;
  final VoidCallback onTap;

  const SongCard({super.key, required this.song, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                image: DecorationImage(image: NetworkImage(song['thumbnails'][0]['url']), fit: BoxFit.cover),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(song['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(song['artist']['name'] ?? 'Artist', style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ],
      ),
    );
  }
}

// --- Search Screen ---
class SearchScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onPlay;
  const SearchScreen({super.key, required this.onPlay});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _results = [];
  bool _isLoading = false;

  Future<void> _search(String query) async {
    if (query.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final dio = Dio();
      final response = await dio.get('${Constants.baseUrl}/api/search', queryParameters: {'q': query});
      setState(() => _results = response.data);
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: const InputDecoration(hintText: 'Search songs, artists...', border: InputBorder.none),
          onSubmitted: _search,
        ),
        actions: [
          IconButton(icon: const Icon(LucideIcons.search), onPressed: () => _search(_searchController.text)),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _results.length,
              itemBuilder: (context, index) {
                final item = _results[index];
                if (item['type'] != 'SONG' && item['type'] != 'VIDEO') return const SizedBox.shrink();
                return ListTile(
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(item['thumbnails'][0]['url'], width: 50, height: 50, fit: BoxFit.cover),
                  ),
                  title: Text(item['name'] ?? 'Unknown', maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(item['artist']['name'] ?? 'Various Artists'),
                  trailing: const Icon(LucideIcons.playCircle, color: Colors.deepPurpleAccent),
                  onTap: () => widget.onPlay(item),
                );
              },
            ),
    );
  }
}

// --- Library Screen ---
class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Personal Library (Requires Cookie)'));
  }
}

// --- Components ---
class MiniPlayer extends StatelessWidget {
  final Map<String, dynamic> song;
  final VoidCallback onExpand;

  const MiniPlayer({super.key, required this.song, required this.onExpand});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onExpand,
      child: Container(
        height: 70,
        margin: const EdgeInsets.only(left: 8, right: 8, bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1A0B3D),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 10)],
          border: Border.all(color: Colors.white10),
        ),
        child: Row(
          children: [
            Hero(
              tag: 'artwork',
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(song['thumbnails'][0]['url'], width: 50, height: 50, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(song['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(song['artist']['name'] ?? 'Artist', style: const TextStyle(fontSize: 12, color: Colors.white70)),
                ],
              ),
            ),
            StreamBuilder<PlayerState>(
              stream: _audioPlayer.playerStateStream,
              builder: (context, snapshot) {
                final playerState = snapshot.data;
                final playing = playerState?.playing ?? false;
                return IconButton(
                  icon: Icon(playing ? LucideIcons.pause : LucideIcons.play),
                  onPressed: () => playing ? _audioPlayer.pause() : _audioPlayer.play(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class FullPlayerScreen extends StatelessWidget {
  final Map<String, dynamic> song;

  const FullPlayerScreen({super.key, required this.song});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Color(0xFF0F0425),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white30, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 48),
          // Artwork
          Hero(
            tag: 'artwork',
            child: Container(
              height: 300,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                image: DecorationImage(image: NetworkImage(song['thumbnails'][0]['url']), fit: BoxFit.cover),
                boxShadow: [BoxShadow(color: Colors.deepPurple.withOpacity(0.5), blurRadius: 30, spreadRadius: 2)],
              ),
            ),
          ),
          const SizedBox(height: 48),
          // Info
          Text(song['name'] ?? 'Unknown', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 8),
          Text(song['artist']['name'] ?? 'Artist', style: const TextStyle(fontSize: 16, color: Colors.white70)),
          const SizedBox(height: 48),
          // Progress Bar
          StreamBuilder<Duration?>(
            stream: _audioPlayer.positionStream,
            builder: (context, snapshot) {
              final position = snapshot.data ?? Duration.zero;
              return ProgressBar(
                progress: position,
                total: _audioPlayer.duration ?? const Duration(minutes: 3),
                onSeek: _audioPlayer.seek,
                baseBarColor: Colors.white10,
                progressBarColor: Colors.deepPurpleAccent,
                thumbColor: Colors.deepPurpleAccent,
              );
            },
          ),
          const SizedBox(height: 48),
          // Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              IconButton(icon: const Icon(LucideIcons.skipBack, size: 36), onPressed: () {}),
              StreamBuilder<PlayerState>(
                stream: _audioPlayer.playerStateStream,
                builder: (context, snapshot) {
                  final playing = snapshot.data?.playing ?? false;
                  return IconButton(
                    icon: Icon(playing ? LucideIcons.pauseCircle : LucideIcons.playCircle, size: 80, color: Colors.deepPurpleAccent),
                    onPressed: () => playing ? _audioPlayer.pause() : _audioPlayer.play(),
                  );
                },
              ),
              IconButton(icon: const Icon(LucideIcons.skipForward, size: 36), onPressed: () {}),
            ],
          ),
        ],
      ),
    );
  }
}

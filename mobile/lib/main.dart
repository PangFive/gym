import 'dart:convert';
import 'dart:io';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

/// Wegym is the web app at [home]; this shell opens it in a WebView and
/// supplies what a WebView lacks: Google sign-in, sharing, saving files,
/// picking photos, keeping the screen on and opening outside links in their
/// own apps. The page talks to it through the WegymNative channel (see
/// `native()` in public/index.html).
const home = 'https://pangfive.github.io/gym/';

/// The OAuth web client of the why-gym Firebase project. The ID token that
/// Google returns for it is what Firebase accepts in signInWithCredential.
const googleWebClientId =
    '764736890357-bd1kasqrk7t005p9m1jd4dmbkn3eq3ke.apps.googleusercontent.com';

const appColor = Color(0xFFD6E8FB);

/// Asks Android for the camera (see MainActivity.kt); true when allowed.
Future<bool> cameraAllowed() async =>
    await const MethodChannel('wegym/camera').invokeMethod<bool>('request') ?? false;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const WegymApp());
}

class WegymApp extends StatelessWidget {
  const WegymApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Wegym',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(colorSchemeSeed: const Color(0xFF2F7CF6)),
        home: const WebShell(),
      );
}

class WebShell extends StatefulWidget {
  const WebShell({super.key});

  @override
  State<WebShell> createState() => _WebShellState();
}

class _WebShellState extends State<WebShell> {
  final web = WebViewController();
  bool ready = false, loading = true, offline = false, googleReady = false;

  @override
  void initState() {
    super.initState();
    setUp();
  }

  Future<void> setUp() async {
    final ua = await web.getUserAgent();
    await web.setJavaScriptMode(JavaScriptMode.unrestricted);
    await web.setUserAgent('$ua WegymApp/1.0');
    await web.setBackgroundColor(appColor);
    await web.addJavaScriptChannel('WegymNative', onMessageReceived: (m) => answer(m.message));
    await web.setNavigationDelegate(NavigationDelegate(
      onNavigationRequest: (req) async {
        if (!req.isMainFrame || isOwn(Uri.parse(req.url))) return NavigationDecision.navigate;
        await launchUrl(Uri.parse(req.url), mode: LaunchMode.externalApplication);
        return NavigationDecision.prevent;
      },
      onPageFinished: (_) => setState(() => loading = false),
      onWebResourceError: (e) {
        if (e.isForMainFrame == true) setState(() => offline = true);
      },
    ));
    final android = web.platform;
    if (android is AndroidWebViewController) {
      await android.setMediaPlaybackRequiresUserGesture(false);
      await android.setOnShowFileSelector(pickFiles);
      await android.setOnPlatformPermissionRequest((req) async {
        final camera = req.types.contains(WebViewPermissionResourceType.camera);
        if (!camera || await cameraAllowed()) {
          await req.grant();
        } else {
          await req.deny();
        }
      });
    }
    await web.loadRequest(Uri.parse(home));
    setState(() => ready = true);
  }

  bool isOwn(Uri u) =>
      u.host == 'pangfive.github.io' || const {'about', 'data', 'blob', 'javascript'}.contains(u.scheme);

  /// Runs one request from the page and hands the result back to it.
  Future<void> answer(String message) async {
    final m = jsonDecode(message) as Map<String, dynamic>;
    final args = (m['args'] as List?) ?? const [];
    Object? result;
    try {
      result = switch (m['name']) {
        'googleSignIn' => await googleSignIn(),
        'saveFile' => await saveFile('${args[0]}', '${args[1]}'),
        'share' => await share(Map<String, dynamic>.from(args[0] as Map)),
        'wakeLock' => await WakelockPlus.toggle(enable: args[0] == true).then((_) => true),
        _ => null,
      };
    } catch (e) {
      result = {'error': '$e'};
    }
    await web.runJavaScript('nativeReply(${m['id']}, ${jsonEncode(result)})');
  }

  Future<Map<String, String>> googleSignIn() async {
    final g = GoogleSignIn.instance;
    try {
      if (!googleReady) {
        await g.initialize(serverClientId: googleWebClientId);
        googleReady = true;
      }
      final acc = await g.authenticate();
      final token = acc.authentication.idToken;
      return token == null ? {'error': 'Google tidak mengirim token login.'} : {'idToken': token};
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) return {};
      return {'error': 'Login Google gagal (${e.code.name}). Coba masuk dengan email.'};
    }
  }

  Future<bool> saveFile(String name, String text) async {
    final f = File('${(await getTemporaryDirectory()).path}/$name');
    await f.writeAsString(text);
    await SharePlus.instance.share(ShareParams(files: [XFile(f.path, mimeType: 'application/json')], subject: name));
    return true;
  }

  Future<bool> share(Map<String, dynamic> d) async {
    final text = [d['text'], d['url']].where((s) => '$s'.isNotEmpty).join('\n');
    await SharePlus.instance.share(ShareParams(text: text, subject: '${d['title']}'));
    return true;
  }

  /// `<input type="file">`: the camera for capture="environment", the gallery
  /// for other images, and the file picker for everything else.
  Future<List<String>> pickFiles(FileSelectorParams p) async {
    final images = p.acceptTypes.isNotEmpty && p.acceptTypes.every((t) => t.startsWith('image/'));
    String? path;
    if (images) {
      // the manifest lists CAMERA, so Android only opens the camera app once it is allowed
      if (p.isCaptureEnabled && !await cameraAllowed()) return [];
      final x = await ImagePicker().pickImage(
        source: p.isCaptureEnabled ? ImageSource.camera : ImageSource.gallery,
        maxWidth: 2000,
      );
      path = x?.path;
    } else {
      path = (await openFile())?.path;
    }
    return path == null ? [] : [Uri.file(path).toString()];
  }

  Future<void> back() async {
    final closed = await web.runJavaScriptReturningResult('typeof closeTop == "function" && closeTop()');
    if (closed == true || closed == 'true') return;
    if (await web.canGoBack()) return web.goBack();
    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) back();
        },
        child: Scaffold(
          backgroundColor: appColor,
          body: SafeArea(
            child: Stack(children: [
              if (ready) WebViewWidget(controller: web),
              if (loading) const Center(child: CircularProgressIndicator()),
              if (offline)
                Offline(onRetry: () {
                  setState(() => offline = false);
                  web.reload();
                }),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Shown when the first visit has no connection yet. After one visit the
/// page's service worker keeps a copy, so later starts work offline.
class Offline extends StatelessWidget {
  const Offline({super.key, required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Container(
        color: appColor,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.wifi_off_rounded, size: 48),
          const SizedBox(height: 16),
          const Text('Tidak ada koneksi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('Sambungkan internet sekali untuk membuka Wegym. Setelah itu bisa dipakai offline.',
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton(onPressed: onRetry, child: const Text('Coba lagi')),
        ]),
      );
}

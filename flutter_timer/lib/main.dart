import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_timer/router.dart';
import 'package:flutter_timer/controllers/timer_controller.dart';
import 'package:flutter_timer/controllers/sound_controller.dart';
import 'package:flutter_timer/controllers/theme_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SharedPreferences.getInstance();

  runApp(const TimerApp());
}

class TimerApp extends StatelessWidget {
  const TimerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => ThemeController(),
        ),
        ChangeNotifierProvider(
          create: (_) => SoundController()..initialize(),
        ),
        ChangeNotifierProxyProvider<SoundController, TimerController>(
          create: (context) => TimerController(
            soundController: context.read<SoundController>(),
          ),
          update: (context, sound, previous) => previous ?? TimerController(
            soundController: sound,
          ),
        ),
      ],
      child: Consumer<ThemeController>(
        builder: (context, theme, _) {
          return MaterialApp.router(
            routerConfig: router,
            title: 'LookAtMe Timer',
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
              useMaterial3: true,
            ),
            darkTheme: ThemeData.dark(useMaterial3: true).copyWith(
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.green,
                brightness: Brightness.dark,
              ),
            ),
            themeMode: theme.themeMode,
          );
        },
      ),
    );
  }
} 
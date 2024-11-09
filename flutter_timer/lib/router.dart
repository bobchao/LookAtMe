import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_timer/pages/timer_page.dart';

final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const TimerPage(), // 直接使用 TimerPage
    ),
  ],
); 
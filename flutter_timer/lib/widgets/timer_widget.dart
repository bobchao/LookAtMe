import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'timer_painter.dart';
import '../controllers/timer_controller.dart';
import '../controllers/theme_controller.dart';
import 'dart:math' as math;

class TimerWidget extends StatefulWidget {
  const TimerWidget({super.key});

  @override
  State<TimerWidget> createState() => _TimerWidgetState();
}

class _TimerWidgetState extends State<TimerWidget> {
  double _angle = 0.0;
  Offset? _startPosition;
  late TimerPainter _painter;
  
  @override
  void initState() {
    super.initState();
    // 監聽計時器狀態變化
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = context.read<TimerController>();
      controller.addListener(_onTimerUpdate);
    });
  }

  @override
  void dispose() {
    context.read<TimerController>().removeListener(_onTimerUpdate);
    super.dispose();
  }

  void _onTimerUpdate() {
    final controller = context.read<TimerController>();
    if (!controller.isRunning && controller.remainingSeconds == 0) {
      // 計時結束時重置角度
      setState(() {
        _angle = 0.0;
      });
    }
  }
  
  void _updateTimer(double angle) {
    final minutes = (angle / 6).round();
    context.read<TimerController>().setTime(minutes);
  }
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        return Stack(
          fit: StackFit.expand,
          children: [
            GestureDetector(
              onPanStart: (details) {
                final box = context.findRenderObject() as RenderBox;
                final localPosition = box.globalToLocal(details.globalPosition);
                
                if (_painter.isHandleHit(localPosition, size)) {
                  context.read<TimerController>().stop();
                  
                  final center = box.size.center(Offset.zero);
                  _startPosition = details.globalPosition;
                  
                  final dx = localPosition.dx - center.dx;
                  final dy = localPosition.dy - center.dy;
                  _angle = (math.atan2(dy, dx) * 180 / math.pi + 90) % 360;
                }
              },
              onPanUpdate: (details) {
                if (_startPosition != null) {
                  final box = context.findRenderObject() as RenderBox;
                  final center = box.size.center(Offset.zero);
                  final localPosition = box.globalToLocal(details.globalPosition);
                  
                  final dx = localPosition.dx - center.dx;
                  final dy = localPosition.dy - center.dy;
                  final newAngle = (math.atan2(dy, dx) * 180 / math.pi + 90) % 360;
                  
                  setState(() {
                    _angle = newAngle;
                    _updateTimer(newAngle);
                  });
                }
              },
              onPanEnd: (details) {
                if (_startPosition != null) {
                  _startPosition = null;
                  context.read<TimerController>().start();
                }
              },
              child: Consumer<TimerController>(
                builder: (context, timer, child) {
                  final brightness = Theme.of(context).brightness;
                  final timerColor = context.watch<ThemeController>().timerColor;
                  _painter = TimerPainter(
                    angle: _angle,
                    progress: timer.remainingSeconds / ((_angle / 6) * 60),
                    isRunning: timer.isRunning,
                    isDarkMode: brightness == Brightness.dark,
                    timerColor: timerColor,
                  );
                  return CustomPaint(
                    painter: _painter,
                    size: size,
                  );
                },
              ),
            ),
            Center(
              child: Consumer<ThemeController>(
                builder: (context, theme, _) {
                  if (!theme.showTime) return const SizedBox.shrink();
                  
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey.shade800.withOpacity(0.8)
                          : Colors.white.withOpacity(0.8),
                      shape: BoxShape.circle,
                    ),
                    child: Consumer<TimerController>(
                      builder: (context, timer, child) {
                        final minutes = timer.remainingSeconds ~/ 60;
                        final seconds = timer.remainingSeconds % 60;
                        return Text(
                          '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).brightness == Brightness.dark
                                ? Colors.white
                                : Colors.black,
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
} 
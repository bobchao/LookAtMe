import 'package:flutter/material.dart';
import 'dart:math' as math;

class TimerPainter extends CustomPainter {
  final double angle;
  final double progress;
  final bool isRunning;
  final bool isDarkMode;
  final Color timerColor;

  TimerPainter({
    required this.angle,
    required this.progress,
    required this.isRunning,
    required this.isDarkMode,
    required this.timerColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;

    final bgPaint = Paint()
      ..color = isDarkMode ? Colors.grey.shade800 : Colors.grey.shade200
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius, bgPaint);

    final displayAngle = isRunning ? (angle * progress) : angle;

    if (displayAngle > 0) {
      final timerPaint = Paint()
        ..color = timerColor
        ..style = PaintingStyle.fill;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        displayAngle * math.pi / 180,
        true,
        timerPaint,
      );
    }

    final handlePaint = Paint()
      ..color = HSLColor.fromColor(timerColor)
          .withLightness((HSLColor.fromColor(timerColor).lightness - 0.2).clamp(0.0, 1.0))
          .toColor()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 24.0
      ..strokeCap = StrokeCap.round;

    final handleAngle = displayAngle * math.pi / 180 - math.pi / 2;
    final handleStart = center;
    final handleEnd = Offset(
      center.dx + (radius + 8) * math.cos(handleAngle),
      center.dy + (radius + 8) * math.sin(handleAngle),
    );

    canvas.drawLine(handleStart, handleEnd, handlePaint);
  }

  @override
  bool shouldRepaint(TimerPainter oldDelegate) {
    return oldDelegate.angle != angle || 
           oldDelegate.progress != progress ||
           oldDelegate.isRunning != isRunning ||
           oldDelegate.isDarkMode != isDarkMode ||
           oldDelegate.timerColor != timerColor;
  }

  bool isHandleHit(Offset point, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    
    final handleAngle = (isRunning ? angle * progress : angle) * math.pi / 180 - math.pi / 2;
    final handleEnd = Offset(
      center.dx + (radius + 8) * math.cos(handleAngle),
      center.dy + (radius + 8) * math.sin(handleAngle),
    );

    final distance = _distanceToLine(point, center, handleEnd);
    return distance <= 16.0;
  }

  double _distanceToLine(Offset point, Offset start, Offset end) {
    final l2 = math.pow(end.dx - start.dx, 2) + math.pow(end.dy - start.dy, 2);
    if (l2 == 0) return (point - start).distance;
    
    final t = math.max(0, math.min(1, (
      (point.dx - start.dx) * (end.dx - start.dx) +
      (point.dy - start.dy) * (end.dy - start.dy)
    ) / l2));
    
    final projection = Offset(
      start.dx + t * (end.dx - start.dx),
      start.dy + t * (end.dy - start.dy),
    );
    
    return (point - projection).distance;
  }
} 
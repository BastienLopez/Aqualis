package com.aquarium.premium.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.dp

@Composable
fun AnimatedAquariumBackground(
    visuals: AquariumVisuals,
    breathing: Float,
    lightIntensity: Float = 0.6f,
    waterTint: Float = 0.3f,
    modifier: Modifier = Modifier
) {
    val transition = rememberInfiniteTransition(label = "bg")
    val shimmer by transition.animateFloat(
        initialValue = 0.1f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(8000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmer"
    )
    val bubbleShift by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(14000),
            repeatMode = RepeatMode.Restart
        ),
        label = "bubbles"
    )

    Box(modifier = modifier.background(visuals.gradient)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val glowColor = visuals.glow.copy(alpha = 0.18f + breathing * 0.12f + lightIntensity * 0.08f)
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(glowColor, Color.Transparent),
                    center = androidx.compose.ui.geometry.Offset(width * 0.5f, height * 0.2f),
                    radius = width * 0.9f
                )
            )

            drawRect(
                color = visuals.glow.copy(alpha = 0.08f + waterTint * 0.18f)
            )

            repeat(18) { index ->
                val x = (width * ((index * 73) % 100) / 100f)
                val y = height - ((height + 200f) * ((bubbleShift + index * 0.08f) % 1f))
                val r = 6.dp.toPx() + (index % 4) * 3.dp.toPx()
                drawCircle(
                    color = visuals.particle.copy(alpha = 0.15f),
                    radius = r,
                    center = androidx.compose.ui.geometry.Offset(x, y)
                )
            }

            rotate(degrees = 18f) {
                drawRect(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color.Transparent,
                            visuals.particle.copy(alpha = 0.12f + shimmer * 0.08f),
                            Color.Transparent
                        )
                    ),
                    size = androidx.compose.ui.geometry.Size(width * 1.2f, height * 0.35f),
                    topLeft = androidx.compose.ui.geometry.Offset(-width * 0.2f, height * 0.15f)
                )
            }
        }
    }
}

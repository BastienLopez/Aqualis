package com.aquarium.premium.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate

enum class RareEventType { RAYON, BANC, MEDUSE }

@Composable
fun RareEventOverlay(
    type: RareEventType?,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(visible = type != null, modifier = modifier) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            when (type) {
                RareEventType.RAYON -> {
                    rotate(12f) {
                        drawRect(
                            brush = Brush.linearGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Color(0xFFB7E1FF).copy(alpha = 0.25f),
                                    Color.Transparent
                                )
                            ),
                            size = androidx.compose.ui.geometry.Size(size.width * 1.1f, size.height * 0.5f),
                            topLeft = androidx.compose.ui.geometry.Offset(-size.width * 0.1f, size.height * 0.1f)
                        )
                    }
                }
                RareEventType.BANC -> {
                    repeat(8) { index ->
                        val x = size.width * (0.1f + index * 0.1f)
                        val y = size.height * (0.4f + (index % 3) * 0.05f)
                        drawCircle(
                            color = Color(0xFF9BD6FF).copy(alpha = 0.5f),
                            radius = 10f,
                            center = androidx.compose.ui.geometry.Offset(x, y)
                        )
                    }
                }
                RareEventType.MEDUSE -> {
                    drawCircle(
                        color = Color(0xFFB69CFF).copy(alpha = 0.35f),
                        radius = size.minDimension * 0.12f,
                        center = androidx.compose.ui.geometry.Offset(size.width * 0.7f, size.height * 0.35f)
                    )
                }
                null -> Unit
            }
        }
    }
}

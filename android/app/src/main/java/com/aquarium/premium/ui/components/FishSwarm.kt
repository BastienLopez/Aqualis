package com.aquarium.premium.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.isActive
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

private enum class FishBehavior { LENT, CURIEUX, GROUPE }

data class FishRender(val resId: Int, val isCompanion: Boolean)

private data class FishMotion(
    val id: String,
    val resId: Int,
    val size: Dp,
    val speed: Float,
    val behavior: FishBehavior,
    val groupId: Int,
    val position: Offset,
    val velocity: Offset,
    val isCompanion: Boolean
)

@Composable
fun FishSwarm(
    fishRender: List<FishRender>,
    modifier: Modifier = Modifier,
    maxFish: Int = 25,
    companionGrowth: Float = 0f
) {
    val fishCount = fishRender.size.coerceAtMost(maxFish)
    val motions = remember(fishRender) {
        val random = Random(42)
        mutableStateListOf<FishMotion>().apply {
            repeat(fishCount) { index ->
                val behavior = when (index % 6) {
                    0, 3 -> FishBehavior.CURIEUX
                    1, 4 -> FishBehavior.GROUPE
                    else -> FishBehavior.LENT
                }
                val angle = random.nextFloat() * (Math.PI * 2).toFloat()
                val speed = when (behavior) {
                    FishBehavior.LENT -> random.nextFloat() * 18f + 10f
                    FishBehavior.CURIEUX -> random.nextFloat() * 22f + 12f
                    FishBehavior.GROUPE -> random.nextFloat() * 20f + 14f
                }
                val size = (42 + (index % 4) * 8).dp
                add(
                    FishMotion(
                        id = "fish-$index",
                        resId = fishRender[index].resId,
                        size = if (fishRender[index].isCompanion) size + 8.dp + (size * companionGrowth) else size,
                        speed = speed,
                        behavior = behavior,
                        groupId = if (behavior == FishBehavior.GROUPE) index % 3 else -1,
                        position = Offset(random.nextFloat(), random.nextFloat()),
                        velocity = Offset(cos(angle), sin(angle)),
                        isCompanion = fishRender[index].isCompanion
                    )
                )
            }
        }
    }

    val companionTransition = rememberInfiniteTransition(label = "companionPulse")
    val companionPulse by companionTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(5000), RepeatMode.Reverse),
        label = "companionPulse"
    )

    LaunchedEffect(fishRender) {
        var last = 0L
        while (isActive) {
            val now = withFrameNanos { it }
            if (last == 0L) last = now
            val dt = (now - last) / 1_000_000_000f
            last = now

            for (i in motions.indices) {
                val fish = motions[i]
                var vx = fish.velocity.x
                var vy = fish.velocity.y

                if (fish.behavior == FishBehavior.CURIEUX && Random.nextFloat() < 0.01f) {
                    vx += Random.nextFloat() * 0.4f - 0.2f
                    vy += Random.nextFloat() * 0.4f - 0.2f
                }

                var x = fish.position.x + vx * fish.speed * dt * 0.0015f
                var y = fish.position.y + vy * fish.speed * dt * 0.0015f

                if (x < 0.05f || x > 0.95f) vx = -vx
                if (y < 0.08f || y > 0.92f) vy = -vy

                x = x.coerceIn(0.04f, 0.96f)
                y = y.coerceIn(0.06f, 0.94f)

                motions[i] = fish.copy(
                    position = Offset(x, y),
                    velocity = Offset(vx, vy)
                )
            }
        }
    }

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val density = LocalDensity.current
        val widthPx = constraints.maxWidth.toFloat()
        val heightPx = constraints.maxHeight.toFloat()
        motions.forEach { fish ->
            val sizePx = with(density) { fish.size.toPx() }
            Image(
                painter = painterResource(id = fish.resId),
                contentDescription = null,
                modifier = Modifier
                    .size(fish.size)
                    .graphicsLayer {
                        translationX = fish.position.x * widthPx - sizePx / 2
                        translationY = fish.position.y * heightPx - sizePx / 2
                        val flip = if (fish.velocity.x < 0) -1f else 1f
                        val pulse = if (fish.isCompanion) companionPulse else 1f
                        scaleX = flip * pulse
                        scaleY = pulse
                    },
                contentScale = ContentScale.Fit
            )
        }
    }
}

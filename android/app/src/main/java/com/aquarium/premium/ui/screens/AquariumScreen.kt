package com.aquarium.premium.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.aquarium.premium.model.AquariumThemeType
import com.aquarium.premium.ui.components.AnimatedAquariumBackground
import com.aquarium.premium.ui.components.FishRender
import com.aquarium.premium.ui.components.FishSwarm
import com.aquarium.premium.ui.components.GlassPill
import com.aquarium.premium.ui.components.RareEventOverlay
import com.aquarium.premium.ui.components.RareEventType
import com.aquarium.premium.ui.components.UserStatusBar
import com.aquarium.premium.ui.components.visualsFor
import com.aquarium.premium.ui.theme.TextSecondary
import com.aquarium.premium.viewmodel.AquariumUiState
import com.aquarium.premium.viewmodel.SessionUiState
import kotlin.random.Random

@Composable
fun AquariumScreen(
    uiState: AquariumUiState,
    sessionUiState: SessionUiState,
    onSelectAquarium: (String) -> Unit,
    onCinemaMode: () -> Unit,
    onAdjustLight: (Float) -> Unit,
    onAdjustTint: (Float) -> Unit
) {
    val context = LocalContext.current
    val aquarium = uiState.aquariums.firstOrNull { it.id == uiState.activeAquariumId }
    val theme = aquarium?.theme ?: AquariumThemeType.SOMBRE
    val visuals = visualsFor(theme)

    val breathingTransition = rememberInfiniteTransition(label = "breathing")
    val breathing by breathingTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(tween(6000), repeatMode = RepeatMode.Reverse),
        label = "breathing"
    )
    val cameraShift by breathingTransition.animateFloat(
        initialValue = -12f,
        targetValue = 12f,
        animationSpec = infiniteRepeatable(tween(14000), repeatMode = RepeatMode.Reverse),
        label = "cameraShift"
    )
    val cameraScale by breathingTransition.animateFloat(
        initialValue = 1.02f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(tween(18000), repeatMode = RepeatMode.Reverse),
        label = "cameraScale"
    )

    var rareEvent by remember { mutableStateOf<RareEventType?>(null) }

    LaunchedEffect(sessionUiState.lastCompletedDuration) {
        val duration = sessionUiState.lastCompletedDuration ?: return@LaunchedEffect
        if (duration >= 120 && Random.nextFloat() < 0.45f) {
            rareEvent = listOf(RareEventType.RAYON, RareEventType.BANC, RareEventType.MEDUSE).random()
            kotlinx.coroutines.delay(4000)
            rareEvent = null
        }
    }

    val fishRender = remember(uiState.ownedFish, uiState.fishCatalog, uiState.activeAquariumId) {
        val owned = uiState.ownedFish.filter { it.assignedAquariumId == uiState.activeAquariumId }
        val ids = owned.mapNotNull { ownedFish ->
            uiState.fishCatalog.firstOrNull { it.id == ownedFish.fishId }
        }
        ids
    }.ifEmpty {
        uiState.fishCatalog.filter { it.isCompanion }
    }.map {
        val resId = context.resources.getIdentifier(it.imageRes, "drawable", context.packageName)
        FishRender(resId = resId, isCompanion = it.isCompanion)
    }.filter { it.resId != 0 }
    val companionGrowth = ((uiState.user?.xp ?: 0) / 2000f).coerceIn(0f, 0.2f)

    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    translationX = cameraShift
                    translationY = cameraShift * 0.4f
                    scaleX = cameraScale
                    scaleY = cameraScale
                }
        ) {
            AnimatedAquariumBackground(
                visuals = visuals,
                breathing = if (sessionUiState.isRunning) breathing else 0.2f,
                lightIntensity = aquarium?.lightIntensity ?: 0.6f,
                waterTint = aquarium?.waterTint ?: 0.3f
            )
            FishSwarm(fishRender = fishRender, companionGrowth = companionGrowth)
        }
        RareEventOverlay(type = rareEvent, modifier = Modifier.fillMaxSize())

        if (!uiState.cinemaMode) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .systemBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
                    .padding(bottom = 120.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    UserStatusBar(
                        userName = uiState.user?.name ?: "",
                        aquariumName = aquarium?.name ?: "Aquarium",
                        xp = uiState.user?.xp ?: 0,
                        gold = uiState.user?.gold ?: 0
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        uiState.aquariums.forEach { item ->
                            val selected = item.id == uiState.activeAquariumId
                            val unlocked = item.isUnlocked
                            GlassPill(
                                modifier = if (unlocked) Modifier.clickable { onSelectAquarium(item.id) } else Modifier,
                                color = when {
                                    selected -> MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f)
                                    unlocked -> MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
                                    else -> MaterialTheme.colorScheme.surface.copy(alpha = 0.3f)
                                }
                            ) {
                                Text(
                                    text = if (unlocked) item.name else "${item.name} (verrouillé)",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = if (selected) MaterialTheme.colorScheme.secondary else TextSecondary,
                                    modifier = Modifier.padding(horizontal = 4.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        GlassPill(modifier = Modifier.clickable { onAdjustLight(-0.05f) }) {
                            Text(text = "Lumière -", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                        }
                        GlassPill(modifier = Modifier.clickable { onAdjustLight(0.05f) }) {
                            Text(text = "Lumière +", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                        }
                        GlassPill(modifier = Modifier.clickable { onAdjustTint(-0.05f) }) {
                            Text(text = "Teinte -", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                        }
                        GlassPill(modifier = Modifier.clickable { onAdjustTint(0.05f) }) {
                            Text(text = "Teinte +", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
                        }
                    }
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    AnimatedVisibility(visible = uiState.showWelcomeMessage) {
                        Text(
                            text = "Bienvenue. Ton aquarium t’attend.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    GlassPill(modifier = Modifier.clickable { onCinemaMode() }) {
                        Text(
                            text = "Mode cinéma (30s)",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

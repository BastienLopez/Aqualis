package com.aquarium.premium.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import com.aquarium.premium.model.AquariumThemeType
import com.aquarium.premium.model.SessionType
import com.aquarium.premium.ui.components.AnimatedAquariumBackground
import com.aquarium.premium.ui.components.FishRender
import com.aquarium.premium.ui.components.FishSwarm
import com.aquarium.premium.ui.components.GlassCard
import com.aquarium.premium.ui.components.GlassPill
import com.aquarium.premium.ui.components.visualsFor
import com.aquarium.premium.ui.theme.GoldSoft
import com.aquarium.premium.ui.theme.TextSecondary
import com.aquarium.premium.viewmodel.AquariumUiState
import com.aquarium.premium.viewmodel.SessionUiState

@Composable
fun SessionScreen(
    aquariumUiState: AquariumUiState,
    sessionUiState: SessionUiState,
    onStartSession: (SessionType, Int) -> Unit,
    onDismissCompletion: () -> Unit,
    onGoAquarium: () -> Unit,
    onGoShop: () -> Unit
) {
    val context = LocalContext.current
    val aquarium = aquariumUiState.aquariums.firstOrNull { it.id == aquariumUiState.activeAquariumId }
    val theme = aquarium?.theme ?: AquariumThemeType.SOMBRE
    val visuals = visualsFor(theme)

    val breathingTransition = rememberInfiniteTransition(label = "sessionBreathing")
    val breathing by breathingTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(tween(5000), repeatMode = RepeatMode.Reverse),
        label = "sessionBreathing"
    )

    val fishRender = remember(aquariumUiState.ownedFish, aquariumUiState.fishCatalog, aquariumUiState.activeAquariumId) {
        val owned = aquariumUiState.ownedFish.filter { it.assignedAquariumId == aquariumUiState.activeAquariumId }
        val ids = owned.mapNotNull { ownedFish ->
            aquariumUiState.fishCatalog.firstOrNull { it.id == ownedFish.fishId }
        }
        ids
    }.ifEmpty { aquariumUiState.fishCatalog.filter { it.isCompanion } }.map {
        val resId = context.resources.getIdentifier(it.imageRes, "drawable", context.packageName)
        FishRender(resId = resId, isCompanion = it.isCompanion)
    }.filter { it.resId != 0 }
    val companionGrowth = ((aquariumUiState.user?.xp ?: 0) / 2000f).coerceIn(0f, 0.2f)

    Box(modifier = Modifier.fillMaxSize()) {
        AnimatedAquariumBackground(
            visuals = visuals,
            breathing = if (sessionUiState.isRunning) breathing else 0.2f,
            lightIntensity = aquarium?.lightIntensity ?: 0.6f,
            waterTint = aquarium?.waterTint ?: 0.3f
        )
        FishSwarm(fishRender = fishRender, companionGrowth = companionGrowth)

        if (!sessionUiState.calmPhase) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .systemBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 22.dp)
                    .padding(bottom = 120.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Session",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Choisis une activité et une durée. Ton aquarium respire avec toi.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                if (!sessionUiState.isRunning && !sessionUiState.isCompleted) {
                    SessionSetup(onStartSession = onStartSession)
                } else if (sessionUiState.isRunning) {
                    SessionRunning(remainingMillis = sessionUiState.remainingMillis)
                }

                AnimatedVisibility(visible = sessionUiState.isCompleted) {
                    SessionCompleted(
                        gold = sessionUiState.earnedGold,
                        onGoAquarium = onGoAquarium,
                        onGoShop = onGoShop,
                        onDismiss = onDismissCompletion
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionSetup(onStartSession: (SessionType, Int) -> Unit) {
    var selectedType by remember { mutableStateOf(SessionType.TRAVAIL) }
    var selectedDuration by remember { mutableStateOf(20) }

    GlassCard(modifier = Modifier.fillMaxWidth(), corner = 32.dp) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(
                text = "Activité",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SessionType.values().forEach { type ->
                    val selected = type == selectedType
                    GlassPill(
                        modifier = Modifier.clickable { selectedType = type },
                        color = if (selected) MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
                    ) {
                        Text(
                            text = when (type) {
                                SessionType.TRAVAIL -> "Travail"
                                SessionType.REVISIONS -> "Révisions"
                                SessionType.SPORT -> "Sport"
                                SessionType.PERSONNALISE -> "Personnalisé"
                            },
                            style = MaterialTheme.typography.labelLarge,
                            color = if (selected) MaterialTheme.colorScheme.secondary else TextSecondary
                        )
                    }
                }
            }

            Text(
                text = "Durée",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf(20, 30, 45, 60, 120, 180).forEach { minutes ->
                    val selected = minutes == selectedDuration
                    GlassPill(
                        modifier = Modifier.clickable { selectedDuration = minutes },
                        color = if (selected) MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
                    ) {
                        Text(
                            text = when (minutes) {
                                60 -> "1 h"
                                120 -> "2 h"
                                180 -> "3 h"
                                else -> "$minutes min"
                            },
                            style = MaterialTheme.typography.labelLarge,
                            color = if (selected) MaterialTheme.colorScheme.secondary else TextSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            GlassPill(modifier = Modifier.clickable { onStartSession(selectedType, selectedDuration) }) {
                Text(
                    text = "Lancer la session",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun SessionRunning(remainingMillis: Long) {
    val minutes = (remainingMillis / 60000)
    val seconds = (remainingMillis / 1000 % 60)
    val pulseTransition = rememberInfiniteTransition(label = "timerPulse")
    val pulse by pulseTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(4500), repeatMode = RepeatMode.Reverse),
        label = "timerPulse"
    )

    GlassCard(modifier = Modifier.fillMaxWidth(), corner = 32.dp) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(
                text = "Respire lentement",
                style = MaterialTheme.typography.titleMedium,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(16.dp))
            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .graphicsLayer {
                            scaleX = pulse
                            scaleY = pulse
                            alpha = 0.7f
                        }
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.15f), RoundedCornerShape(999.dp))
                )
                Text(
                    text = String.format("%02d:%02d", minutes, seconds),
                    style = MaterialTheme.typography.displayLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Le temps continue même si tu changes d’onglet.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun SessionCompleted(
    gold: Int,
    onGoAquarium: () -> Unit,
    onGoShop: () -> Unit,
    onDismiss: () -> Unit
) {
    GlassCard(modifier = Modifier.fillMaxWidth(), corner = 32.dp) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "Session terminée",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "+$gold pièces",
                style = MaterialTheme.typography.headlineLarge,
                color = GoldSoft
            )
            GlassPill(modifier = Modifier.clickable { onGoAquarium(); onDismiss() }) {
                Text(
                    text = "Retour à l’aquarium",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            GlassPill(modifier = Modifier.clickable { onGoShop(); onDismiss() }) {
                Text(
                    text = "Aller à la boutique",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

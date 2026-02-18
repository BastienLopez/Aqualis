package com.aquarium.premium.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.aquarium.premium.data.entity.OwnedFishEntity
import com.aquarium.premium.ui.components.GlassCard
import com.aquarium.premium.ui.components.GlassPill
import com.aquarium.premium.ui.components.PremiumBackground
import com.aquarium.premium.ui.theme.GoldSoft
import com.aquarium.premium.ui.theme.TextSecondary
import com.aquarium.premium.viewmodel.AquariumUiState

@Composable
fun CollectionScreen(
    uiState: AquariumUiState,
    onAssign: (OwnedFishEntity, String) -> Unit,
    onRemove: (OwnedFishEntity) -> Unit
) {
    val context = LocalContext.current
    val activeAquariumId = uiState.activeAquariumId
    val activeAquariumName = uiState.aquariums.firstOrNull { it.id == activeAquariumId }?.name ?: "Aquarium"
    val assignedCount = uiState.ownedFish.count { it.assignedAquariumId == activeAquariumId }
    val full = assignedCount >= 25

    PremiumBackground {
        Column(
            modifier = Modifier
                .systemBarsPadding()
                .padding(horizontal = 20.dp, vertical = 18.dp)
        ) {
            Text(
                text = "Collection",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Assigne tes poissons à l’aquarium actif.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(12.dp))
            if (full) {
                Text(
                    text = "Aquarium plein (25 poissons max).",
                    style = MaterialTheme.typography.bodyMedium,
                    color = GoldSoft
                )
            }
            Spacer(modifier = Modifier.height(12.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(bottom = 100.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(uiState.ownedFish) { owned ->
                    val fish = uiState.fishCatalog.firstOrNull { it.id == owned.fishId }
                    if (fish != null) {
                        val resId = context.resources.getIdentifier(fish.imageRes, "drawable", context.packageName)
                        GlassCard(corner = 26.dp) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = fish.name, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                if (resId != 0) {
                                    Image(
                                        painter = painterResource(id = resId),
                                        contentDescription = fish.name,
                                        modifier = Modifier.size(70.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = if (owned.assignedAquariumId == activeAquariumId) "Dans $activeAquariumName" else "Non assigné",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextSecondary
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                if (owned.assignedAquariumId == activeAquariumId) {
                                    GlassPill(modifier = Modifier.clickable { onRemove(owned) }) {
                                        Text(text = "Retirer", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                } else {
                                    GlassPill(modifier = if (!full) Modifier.clickable { onAssign(owned, activeAquariumId) } else Modifier) {
                                        Text(
                                            text = if (full) "Plein" else "Assigner",
                                            style = MaterialTheme.typography.labelLarge,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

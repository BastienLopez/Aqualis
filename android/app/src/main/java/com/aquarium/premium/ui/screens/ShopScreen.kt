package com.aquarium.premium.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.aquarium.premium.data.entity.AquariumEntity
import com.aquarium.premium.data.entity.FishEntity
import com.aquarium.premium.model.FishRarity
import com.aquarium.premium.ui.components.GlassCard
import com.aquarium.premium.ui.components.GlassPill
import com.aquarium.premium.ui.components.PremiumBackground
import com.aquarium.premium.ui.theme.GlassFill
import com.aquarium.premium.ui.theme.GoldSoft
import com.aquarium.premium.ui.theme.TextSecondary
import com.aquarium.premium.viewmodel.ShopUiState

@Composable
fun ShopScreen(
    uiState: ShopUiState,
    onPurchaseFish: (FishEntity) -> Unit,
    onPurchaseAquarium: (AquariumEntity) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    var previewFish by remember { mutableStateOf<FishEntity?>(null) }

    PremiumBackground {
        Column(
            modifier = Modifier
                .systemBarsPadding()
                .padding(horizontal = 20.dp, vertical = 18.dp)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 120.dp)
        ) {
            Text(
                text = "Boutique",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Choisis un poisson ou un aquarium premium.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(16.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf("Poissons", "Aquariums").forEachIndexed { index, label ->
                val selected = index == selectedTab
                GlassPill(
                    modifier = Modifier.clickable { selectedTab = index },
                    color = if (selected) MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f) else GlassFill
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelLarge,
                        color = if (selected) MaterialTheme.colorScheme.secondary else TextSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        if (selectedTab == 0) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                uiState.fishCatalog.forEach { fish ->
                    FishShopCard(
                        fish = fish,
                        onPreview = { previewFish = fish },
                        onBuy = { onPurchaseFish(fish) }
                    )
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                uiState.aquariums.forEach { aquarium ->
                    GlassCard(corner = 28.dp) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(
                                text = aquarium.name,
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (aquarium.isUnlocked) "Déjà débloqué" else "À débloquer - ${aquarium.price} pièces",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                            GlassPill(
                                modifier = if (!aquarium.isUnlocked) Modifier.clickable { onPurchaseAquarium(aquarium) } else Modifier
                            ) {
                                Text(
                                    text = if (aquarium.isUnlocked) "Débloqué" else "Acheter",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }

            AnimatedVisibility(visible = previewFish != null) {
                previewFish?.let { fish ->
                    Spacer(modifier = Modifier.height(18.dp))
                    GlassCard(corner = 28.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(text = "Prévisualisation", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                                Text(text = fish.name, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            }
                            GlassPill(modifier = Modifier.clickable { previewFish = null }) {
                                Text(text = "Fermer", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .clip(RoundedCornerShape(22.dp))
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(Color(0xFF0D1524), Color(0xFF1E2B3F))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            val resId = LocalContext.current.resources.getIdentifier(fish.imageRes, "drawable", LocalContext.current.packageName)
                            if (resId != 0) {
                                Image(
                                    painter = painterResource(id = resId),
                                    contentDescription = fish.name,
                                    modifier = Modifier.size(90.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FishShopCard(
    fish: FishEntity,
    onPreview: () -> Unit,
    onBuy: () -> Unit
) {
    val context = LocalContext.current
    val resId = context.resources.getIdentifier(fish.imageRes, "drawable", context.packageName)
    GlassCard(corner = 30.dp) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.verticalGradient(listOf(Color(0xFF2B1E1B), Color(0xFF3A2A24))))
            ) {
                if (resId != 0) {
                    Image(
                        painter = painterResource(id = resId),
                        contentDescription = fish.name,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = fish.name, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(text = "Rareté · ${rarityLabel(fish.rarity)}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Text(text = "${fish.price} pièces", style = MaterialTheme.typography.labelLarge, color = GoldSoft)
            }
            Column(horizontalAlignment = Alignment.End) {
                GlassPill(modifier = Modifier.clickable { onPreview() }) {
                    Text(text = "Aperçu", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
                }
                Spacer(modifier = Modifier.height(8.dp))
                GlassPill(modifier = Modifier.clickable { onBuy() }) {
                    Text(text = "Acheter", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
                }
            }
        }
    }
}

private fun rarityLabel(rarity: FishRarity): String = when (rarity) {
    FishRarity.COMMUN -> "Commun"
    FishRarity.RARE -> "Rare"
    FishRarity.EPIC -> "Épique"
    FishRarity.LEGENDAIRE -> "Légendaire"
}

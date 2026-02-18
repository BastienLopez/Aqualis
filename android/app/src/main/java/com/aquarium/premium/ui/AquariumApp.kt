package com.aquarium.premium.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aquarium.premium.AppViewModelFactory
import com.aquarium.premium.data.repository.AquariumRepository
import com.aquarium.premium.ui.components.BottomNavItem
import com.aquarium.premium.ui.components.GlassBottomBar
import com.aquarium.premium.ui.screens.AquariumScreen
import com.aquarium.premium.ui.screens.CollectionScreen
import com.aquarium.premium.ui.screens.SessionScreen
import com.aquarium.premium.ui.screens.ShopScreen
import com.aquarium.premium.viewmodel.AquariumViewModel
import com.aquarium.premium.viewmodel.SessionViewModel
import com.aquarium.premium.viewmodel.ShopViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Collections
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.WaterDrop

private enum class Tab { Aquarium, Session, Boutique, Collection }

@Composable
fun AquariumApp(repository: AquariumRepository) {
    val factory = remember { AppViewModelFactory(repository) }
    val aquariumVm: AquariumViewModel = viewModel(factory = factory)
    val sessionVm: SessionViewModel = viewModel(factory = factory)
    val shopVm: ShopViewModel = viewModel(factory = factory)

    val aquariumState by aquariumVm.uiState.collectAsState()
    val sessionState by sessionVm.uiState.collectAsState()
    val shopState by shopVm.uiState.collectAsState()

    var selectedTab by remember { mutableStateOf(Tab.Aquarium) }

    Box(modifier = Modifier.fillMaxSize()) {
        when (selectedTab) {
            Tab.Aquarium -> AquariumScreen(
                uiState = aquariumState,
                sessionUiState = sessionState,
                onSelectAquarium = aquariumVm::selectAquarium,
                onCinemaMode = aquariumVm::toggleCinemaMode,
                onAdjustLight = aquariumVm::adjustLight,
                onAdjustTint = aquariumVm::adjustTint
            )
            Tab.Session -> SessionScreen(
                aquariumUiState = aquariumState,
                sessionUiState = sessionState,
                onStartSession = { type, minutes -> sessionVm.startSession(type, minutes) },
                onDismissCompletion = sessionVm::dismissCompletion,
                onGoAquarium = { selectedTab = Tab.Aquarium },
                onGoShop = { selectedTab = Tab.Boutique }
            )
            Tab.Boutique -> ShopScreen(
                uiState = shopState,
                onPurchaseFish = { fish -> shopVm.purchaseFish(fish) { } },
                onPurchaseAquarium = { aquarium -> shopVm.purchaseAquarium(aquarium) { } }
            )
            Tab.Collection -> CollectionScreen(
                uiState = aquariumState,
                onAssign = { fish, aquariumId -> aquariumVm.assignFish(fish, aquariumId, 25) { } },
                onRemove = aquariumVm::removeFish
            )
        }

        val hideBars = aquariumState.cinemaMode || sessionState.calmPhase
        if (!hideBars) {
            GlassBottomBar(
                items = listOf(
                    BottomNavItem("Aquarium", Icons.Outlined.WaterDrop),
                    BottomNavItem("Session", Icons.Outlined.Schedule),
                    BottomNavItem("Boutique", Icons.Outlined.ShoppingBag),
                    BottomNavItem("Collection", Icons.Outlined.Collections)
                ),
                selectedIndex = selectedTab.ordinal,
                onSelect = { selectedTab = Tab.values()[it] }
            )
        }
    }
}

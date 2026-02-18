package com.aquarium.premium.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aquarium.premium.data.entity.AquariumEntity
import com.aquarium.premium.data.entity.FishEntity
import com.aquarium.premium.data.entity.OwnedFishEntity
import com.aquarium.premium.data.entity.UserEntity
import com.aquarium.premium.data.repository.AquariumRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AquariumUiState(
    val user: UserEntity? = null,
    val aquariums: List<AquariumEntity> = emptyList(),
    val fishCatalog: List<FishEntity> = emptyList(),
    val ownedFish: List<OwnedFishEntity> = emptyList(),
    val activeAquariumId: String = "sombre",
    val cinemaMode: Boolean = false,
    val showWelcomeMessage: Boolean = true
)

class AquariumViewModel(private val repository: AquariumRepository) : ViewModel() {
    private val cinemaMode = kotlinx.coroutines.flow.MutableStateFlow(false)

    val uiState: StateFlow<AquariumUiState> = combine(
        repository.user,
        repository.aquariums,
        repository.fish,
        repository.ownedFish,
        repository.activeTimer,
        cinemaMode
    ) { user, aquariums, fish, owned, timer, cinema ->
        AquariumUiState(
            user = user,
            aquariums = aquariums,
            fishCatalog = fish,
            ownedFish = owned,
            activeAquariumId = user?.activeAquariumId ?: "sombre",
            cinemaMode = cinema,
            showWelcomeMessage = timer == null
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AquariumUiState())

    init {
        viewModelScope.launch {
            repository.seedIfNeeded()
            repository.ensureInitialOwnedFish()
        }
    }

    fun selectAquarium(id: String) {
        viewModelScope.launch {
            repository.updateActiveAquarium(id)
        }
    }

    fun toggleCinemaMode() {
        viewModelScope.launch {
            cinemaMode.emit(true)
            kotlinx.coroutines.delay(30_000)
            cinemaMode.emit(false)
        }
    }

    fun assignFish(ownedFish: OwnedFishEntity, aquariumId: String, max: Int, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val ok = repository.assignFishToAquarium(ownedFish, aquariumId, max)
            onResult(ok)
        }
    }

    fun removeFish(ownedFish: OwnedFishEntity) {
        viewModelScope.launch {
            repository.removeFishFromAquarium(ownedFish)
        }
    }

    fun adjustLight(delta: Float) {
        val current = uiState.value.aquariums.firstOrNull { it.id == uiState.value.activeAquariumId } ?: return
        val newValue = (current.lightIntensity + delta).coerceIn(0.2f, 1f)
        viewModelScope.launch { repository.updateAquarium(current.copy(lightIntensity = newValue)) }
    }

    fun adjustTint(delta: Float) {
        val current = uiState.value.aquariums.firstOrNull { it.id == uiState.value.activeAquariumId } ?: return
        val newValue = (current.waterTint + delta).coerceIn(0.05f, 0.9f)
        viewModelScope.launch { repository.updateAquarium(current.copy(waterTint = newValue)) }
    }
}

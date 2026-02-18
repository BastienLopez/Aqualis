package com.aquarium.premium.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aquarium.premium.data.entity.AquariumEntity
import com.aquarium.premium.data.entity.FishEntity
import com.aquarium.premium.data.entity.UserEntity
import com.aquarium.premium.data.repository.AquariumRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ShopUiState(
    val user: UserEntity? = null,
    val fishCatalog: List<FishEntity> = emptyList(),
    val aquariums: List<AquariumEntity> = emptyList()
)

class ShopViewModel(private val repository: AquariumRepository) : ViewModel() {
    val uiState: StateFlow<ShopUiState> = combine(
        repository.user,
        repository.fish,
        repository.aquariums
    ) { user, fish, aquariums ->
        ShopUiState(user = user, fishCatalog = fish, aquariums = aquariums)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ShopUiState())

    fun purchaseFish(fish: FishEntity, onResult: (Boolean) -> Unit) {
        val user = uiState.value.user ?: return
        viewModelScope.launch {
            val ok = repository.purchaseFish(fish, user)
            onResult(ok)
        }
    }

    fun purchaseAquarium(aquarium: AquariumEntity, onResult: (Boolean) -> Unit) {
        val user = uiState.value.user ?: return
        viewModelScope.launch {
            val ok = repository.purchaseAquarium(aquarium, user)
            onResult(ok)
        }
    }
}

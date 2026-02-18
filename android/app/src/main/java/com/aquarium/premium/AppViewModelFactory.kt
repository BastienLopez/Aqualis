package com.aquarium.premium

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.aquarium.premium.data.repository.AquariumRepository
import com.aquarium.premium.viewmodel.AquariumViewModel
import com.aquarium.premium.viewmodel.SessionViewModel
import com.aquarium.premium.viewmodel.ShopViewModel

class AppViewModelFactory(private val repository: AquariumRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(AquariumViewModel::class.java) -> AquariumViewModel(repository) as T
            modelClass.isAssignableFrom(SessionViewModel::class.java) -> SessionViewModel(repository) as T
            modelClass.isAssignableFrom(ShopViewModel::class.java) -> ShopViewModel(repository) as T
            else -> throw IllegalArgumentException("ViewModel inconnu: ${modelClass.name}")
        }
    }
}

package com.aquarium.premium

import android.content.Context
import com.aquarium.premium.data.AppDatabase
import com.aquarium.premium.data.repository.AquariumRepository

class AppContainer(context: Context) {
    val repository: AquariumRepository = AquariumRepository(AppDatabase.get(context))
}

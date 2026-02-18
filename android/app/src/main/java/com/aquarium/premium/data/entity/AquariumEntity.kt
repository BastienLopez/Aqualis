package com.aquarium.premium.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.aquarium.premium.model.AquariumThemeType

@Entity(tableName = "aquariums")
data class AquariumEntity(
    @PrimaryKey val id: String,
    val name: String,
    val theme: AquariumThemeType,
    val isUnlocked: Boolean,
    val price: Int,
    val lightIntensity: Float,
    val waterTint: Float
)

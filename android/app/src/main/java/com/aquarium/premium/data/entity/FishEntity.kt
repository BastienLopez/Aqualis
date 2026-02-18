package com.aquarium.premium.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.aquarium.premium.model.FishRarity

@Entity(tableName = "fish")
data class FishEntity(
    @PrimaryKey val id: String,
    val name: String,
    val rarity: FishRarity,
    val price: Int,
    val imageRes: String,
    val isCompanion: Boolean = false
)

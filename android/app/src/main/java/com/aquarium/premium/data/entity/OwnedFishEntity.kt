package com.aquarium.premium.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "owned_fish")
data class OwnedFishEntity(
    @PrimaryKey val id: String,
    val fishId: String,
    val acquiredAt: Long,
    val assignedAquariumId: String?
)

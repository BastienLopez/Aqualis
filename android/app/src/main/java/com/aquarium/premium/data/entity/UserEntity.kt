package com.aquarium.premium.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: Int = 0,
    val name: String,
    val xp: Int,
    val gold: Int,
    val companionFishId: String,
    val activeAquariumId: String
)

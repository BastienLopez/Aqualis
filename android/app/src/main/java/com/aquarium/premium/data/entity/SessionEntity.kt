package com.aquarium.premium.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.aquarium.premium.model.SessionType

@Entity(tableName = "sessions")
data class SessionEntity(
    @PrimaryKey val id: String,
    val type: SessionType,
    val durationMinutes: Int,
    val startedAt: Long,
    val endedAt: Long,
    val earnedGold: Int
)

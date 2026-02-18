package com.aquarium.premium.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.aquarium.premium.model.SessionType

@Entity(tableName = "active_timer")
data class ActiveTimerEntity(
    @PrimaryKey val id: Int = 0,
    val type: SessionType,
    val durationMinutes: Int,
    val startedAt: Long,
    val isRunning: Boolean
)

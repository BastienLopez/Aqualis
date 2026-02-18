package com.aquarium.premium.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.aquarium.premium.data.entity.ActiveTimerEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TimerDao {
    @Query("SELECT * FROM active_timer WHERE id = 0")
    fun observeActive(): Flow<ActiveTimerEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: ActiveTimerEntity)

    @Query("DELETE FROM active_timer")
    suspend fun clear()
}

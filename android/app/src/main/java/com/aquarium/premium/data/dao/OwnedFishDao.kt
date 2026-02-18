package com.aquarium.premium.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.aquarium.premium.data.entity.OwnedFishEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface OwnedFishDao {
    @Query("SELECT * FROM owned_fish")
    fun observeAll(): Flow<List<OwnedFishEntity>>

    @Query("SELECT * FROM owned_fish")
    suspend fun getAll(): List<OwnedFishEntity>

    @Query("SELECT COUNT(*) FROM owned_fish WHERE assignedAquariumId = :aquariumId")
    suspend fun countAssigned(aquariumId: String): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: OwnedFishEntity)

    @Update
    suspend fun update(item: OwnedFishEntity)
}

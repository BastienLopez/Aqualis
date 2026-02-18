package com.aquarium.premium.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.aquarium.premium.data.entity.AquariumEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AquariumDao {
    @Query("SELECT * FROM aquariums")
    fun observeAll(): Flow<List<AquariumEntity>>

    @Query("SELECT COUNT(*) FROM aquariums")
    suspend fun count(): Int

    @Query("SELECT * FROM aquariums WHERE id = :id")
    suspend fun getById(id: String): AquariumEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<AquariumEntity>)

    @Update
    suspend fun update(item: AquariumEntity)
}

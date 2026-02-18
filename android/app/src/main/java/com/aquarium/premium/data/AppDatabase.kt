package com.aquarium.premium.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.aquarium.premium.data.dao.AquariumDao
import com.aquarium.premium.data.dao.FishDao
import com.aquarium.premium.data.dao.OwnedFishDao
import com.aquarium.premium.data.dao.SessionDao
import com.aquarium.premium.data.dao.TimerDao
import com.aquarium.premium.data.dao.UserDao
import com.aquarium.premium.data.entity.ActiveTimerEntity
import com.aquarium.premium.data.entity.AquariumEntity
import com.aquarium.premium.data.entity.FishEntity
import com.aquarium.premium.data.entity.OwnedFishEntity
import com.aquarium.premium.data.entity.SessionEntity
import com.aquarium.premium.data.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        AquariumEntity::class,
        FishEntity::class,
        OwnedFishEntity::class,
        SessionEntity::class,
        ActiveTimerEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun aquariumDao(): AquariumDao
    abstract fun fishDao(): FishDao
    abstract fun ownedFishDao(): OwnedFishDao
    abstract fun sessionDao(): SessionDao
    abstract fun timerDao(): TimerDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "aquarium.db"
            ).build().also { instance = it }
        }
    }
}

package com.aquarium.premium.data

import androidx.room.TypeConverter
import com.aquarium.premium.model.AquariumThemeType
import com.aquarium.premium.model.FishRarity
import com.aquarium.premium.model.SessionType

class Converters {
    @TypeConverter
    fun fromTheme(theme: AquariumThemeType): String = theme.name

    @TypeConverter
    fun toTheme(value: String): AquariumThemeType = AquariumThemeType.valueOf(value)

    @TypeConverter
    fun fromRarity(rarity: FishRarity): String = rarity.name

    @TypeConverter
    fun toRarity(value: String): FishRarity = FishRarity.valueOf(value)

    @TypeConverter
    fun fromSession(type: SessionType): String = type.name

    @TypeConverter
    fun toSession(value: String): SessionType = SessionType.valueOf(value)
}

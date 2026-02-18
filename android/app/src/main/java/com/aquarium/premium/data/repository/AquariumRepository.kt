package com.aquarium.premium.data.repository

import com.aquarium.premium.data.AppDatabase
import com.aquarium.premium.data.entity.ActiveTimerEntity
import com.aquarium.premium.data.entity.AquariumEntity
import com.aquarium.premium.data.entity.FishEntity
import com.aquarium.premium.data.entity.OwnedFishEntity
import com.aquarium.premium.data.entity.SessionEntity
import com.aquarium.premium.data.entity.UserEntity
import com.aquarium.premium.model.AquariumThemeType
import com.aquarium.premium.model.FishRarity
import com.aquarium.premium.model.SessionType
import java.util.UUID

class AquariumRepository(private val db: AppDatabase) {
    val user = db.userDao().observeUser()
    val aquariums = db.aquariumDao().observeAll()
    val fish = db.fishDao().observeAll()
    val ownedFish = db.ownedFishDao().observeAll()
    val sessions = db.sessionDao().observeAll()
    val activeTimer = db.timerDao().observeActive()

    suspend fun seedIfNeeded() {
        val aquariumCount = db.aquariumDao().count()
        if (aquariumCount == 0) {
            val aquariums = listOf(
                AquariumEntity(
                    id = "sombre",
                    name = "Aquarium sombre",
                    theme = AquariumThemeType.SOMBRE,
                    isUnlocked = true,
                    price = 0,
                    lightIntensity = 0.55f,
                    waterTint = 0.35f
                ),
                AquariumEntity(
                    id = "clair",
                    name = "Aquarium clair",
                    theme = AquariumThemeType.CLAIR,
                    isUnlocked = true,
                    price = 0,
                    lightIntensity = 0.72f,
                    waterTint = 0.18f
                ),
                AquariumEntity(
                    id = "abyssal",
                    name = "Aquarium abyssal",
                    theme = AquariumThemeType.ABYSSAL,
                    isUnlocked = true,
                    price = 0,
                    lightIntensity = 0.65f,
                    waterTint = 0.42f
                ),
                AquariumEntity(
                    id = "pandemonium",
                    name = "Pandemonium",
                    theme = AquariumThemeType.PANDEMONIUM,
                    isUnlocked = false,
                    price = 520,
                    lightIntensity = 0.38f,
                    waterTint = 0.62f
                )
            )
            db.aquariumDao().upsertAll(aquariums)
        }

        val fishCount = db.fishDao().count()
        if (fishCount == 0) {
            val fishList = listOf(
                FishEntity(
                    id = "companion",
                    name = "Compagnon",
                    rarity = FishRarity.LEGENDAIRE,
                    price = 0,
                    imageRes = "fish_companion",
                    isCompanion = true
                ),
                FishEntity(
                    id = "oranda",
                    name = "Oranda",
                    rarity = FishRarity.RARE,
                    price = 120,
                    imageRes = "fish_oranda"
                ),
                FishEntity(
                    id = "wrasse",
                    name = "Labre",
                    rarity = FishRarity.RARE,
                    price = 160,
                    imageRes = "fish_wrasse"
                ),
                FishEntity(
                    id = "comet",
                    name = "Comète",
                    rarity = FishRarity.COMMUN,
                    price = 80,
                    imageRes = "fish_comet"
                ),
                FishEntity(
                    id = "veil",
                    name = "Voile",
                    rarity = FishRarity.EPIC,
                    price = 240,
                    imageRes = "fish_veil"
                ),
                FishEntity(
                    id = "abyss",
                    name = "Lueur abyssale",
                    rarity = FishRarity.EPIC,
                    price = 280,
                    imageRes = "fish_abyss"
                )
            )
            db.fishDao().upsertAll(fishList)
        }

        if (db.userDao().getUser() == null) {
            db.userDao().upsert(
                UserEntity(
                    id = 0,
                    name = "Camille",
                    xp = 128,
                    gold = 220,
                    companionFishId = "companion",
                    activeAquariumId = "sombre"
                )
            )
        }
    }

    suspend fun ensureInitialOwnedFish() {
        val owned = db.ownedFishDao().getAll()
        if (owned.isEmpty()) {
            val companion = OwnedFishEntity(
                id = UUID.randomUUID().toString(),
                fishId = "companion",
                acquiredAt = System.currentTimeMillis(),
                assignedAquariumId = "sombre"
            )
            db.ownedFishDao().upsert(companion)
        }
    }

    suspend fun updateActiveAquarium(newId: String) {
        val current = db.userDao().getUser() ?: return
        db.userDao().upsert(current.copy(activeAquariumId = newId))
    }

    suspend fun updateUser(user: UserEntity) {
        db.userDao().upsert(user)
    }

    suspend fun getUser(): UserEntity? = db.userDao().getUser()

    suspend fun updateAquarium(aquarium: AquariumEntity) {
        db.aquariumDao().update(aquarium)
    }

    suspend fun purchaseFish(fish: FishEntity, user: UserEntity): Boolean {
        if (user.gold < fish.price) return false
        val owned = OwnedFishEntity(
            id = UUID.randomUUID().toString(),
            fishId = fish.id,
            acquiredAt = System.currentTimeMillis(),
            assignedAquariumId = null
        )
        db.ownedFishDao().upsert(owned)
        db.userDao().upsert(user.copy(gold = user.gold - fish.price))
        return true
    }

    suspend fun purchaseAquarium(aquarium: AquariumEntity, user: UserEntity): Boolean {
        if (aquarium.isUnlocked || user.gold < aquarium.price) return false
        db.aquariumDao().update(aquarium.copy(isUnlocked = true))
        db.userDao().upsert(user.copy(gold = user.gold - aquarium.price))
        return true
    }

    suspend fun assignFishToAquarium(ownedFish: OwnedFishEntity, aquariumId: String, max: Int): Boolean {
        val count = db.ownedFishDao().countAssigned(aquariumId)
        return if (count >= max) {
            false
        } else {
            db.ownedFishDao().upsert(ownedFish.copy(assignedAquariumId = aquariumId))
            true
        }
    }

    suspend fun removeFishFromAquarium(ownedFish: OwnedFishEntity) {
        db.ownedFishDao().upsert(ownedFish.copy(assignedAquariumId = null))
    }

    suspend fun startTimer(type: SessionType, durationMinutes: Int) {
        val timer = ActiveTimerEntity(
            id = 0,
            type = type,
            durationMinutes = durationMinutes,
            startedAt = System.currentTimeMillis(),
            isRunning = true
        )
        db.timerDao().upsert(timer)
    }

    suspend fun clearTimer() {
        db.timerDao().clear()
    }

    suspend fun addSession(session: SessionEntity) {
        db.sessionDao().insert(session)
    }
}

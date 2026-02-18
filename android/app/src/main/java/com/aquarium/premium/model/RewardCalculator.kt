package com.aquarium.premium.model

object RewardCalculator {
    private val rewards = mapOf(
        20 to 15,
        30 to 25,
        45 to 40,
        60 to 90,
        120 to 110,
        180 to 300
    )

    fun rewardForMinutes(minutes: Int): Int = rewards[minutes] ?: 0
}

package com.aquarium.premium

import com.aquarium.premium.model.RewardCalculator
import org.junit.Assert.assertEquals
import org.junit.Test

class RewardCalculatorTest {
    @Test
    fun rewardMapping_isExact() {
        assertEquals(15, RewardCalculator.rewardForMinutes(20))
        assertEquals(25, RewardCalculator.rewardForMinutes(30))
        assertEquals(40, RewardCalculator.rewardForMinutes(45))
        assertEquals(90, RewardCalculator.rewardForMinutes(60))
        assertEquals(110, RewardCalculator.rewardForMinutes(120))
        assertEquals(300, RewardCalculator.rewardForMinutes(180))
    }
}

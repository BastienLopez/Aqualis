package com.aquarium.premium.ui.components

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.aquarium.premium.model.AquariumThemeType
import com.aquarium.premium.ui.theme.AbyssGlow
import com.aquarium.premium.ui.theme.Ink800
import com.aquarium.premium.ui.theme.Ink900
import com.aquarium.premium.ui.theme.OceanBlue
import com.aquarium.premium.ui.theme.RoseDeep

data class AquariumVisuals(
    val gradient: Brush,
    val glow: Color,
    val particle: Color
)

fun visualsFor(theme: AquariumThemeType): AquariumVisuals {
    return when (theme) {
        AquariumThemeType.SOMBRE -> AquariumVisuals(
            gradient = Brush.verticalGradient(
                colors = listOf(Ink900, OceanBlue, Ink800)
            ),
            glow = Color(0xFF2A3A5F),
            particle = Color(0xFF7CB6FF)
        )
        AquariumThemeType.CLAIR -> AquariumVisuals(
            gradient = Brush.verticalGradient(
                colors = listOf(Color(0xFF0D1B22), Color(0xFF24495E), Color(0xFF1F2A35))
            ),
            glow = Color(0xFFBFA78B),
            particle = Color(0xFFE1D2B9)
        )
        AquariumThemeType.ABYSSAL -> AquariumVisuals(
            gradient = Brush.verticalGradient(
                colors = listOf(Color(0xFF05070D), Color(0xFF0E1A2A), Color(0xFF0C1220))
            ),
            glow = AbyssGlow,
            particle = Color(0xFF4EFAD8)
        )
        AquariumThemeType.PANDEMONIUM -> AquariumVisuals(
            gradient = Brush.verticalGradient(
                colors = listOf(Color(0xFF0A0507), Color(0xFF1B0A0F), Color(0xFF0E0608))
            ),
            glow = RoseDeep,
            particle = Color(0xFFB0363A)
        )
    }
}

package com.aquarium.premium.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    primary = OceanCyan,
    secondary = GoldSoft,
    tertiary = AbyssGlow,
    background = Ink900,
    surface = Ink800,
    onPrimary = Ink900,
    onSecondary = Ink900,
    onTertiary = Ink900,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun AquariumTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        typography = PremiumTypography,
        shapes = PremiumShapes,
        content = content
    )
}

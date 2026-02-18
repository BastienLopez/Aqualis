package com.aquarium.premium.ui.components

import android.os.Build
import android.graphics.RenderEffect
import android.graphics.Shader
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.aquarium.premium.ui.theme.CardShadow
import com.aquarium.premium.ui.theme.GlassFill
import com.aquarium.premium.ui.theme.GlassStroke

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    corner: Dp = 28.dp,
    padding: PaddingValues = PaddingValues(16.dp),
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .shadow(18.dp, RoundedCornerShape(corner), ambientColor = CardShadow, spotColor = CardShadow)
            .clip(RoundedCornerShape(corner))
            .background(GlassFill)
            .border(BorderStroke(1.dp, GlassStroke), RoundedCornerShape(corner))
            .then(
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    Modifier.graphicsLayer {
                        renderEffect = RenderEffect.createBlurEffect(20f, 20f, Shader.TileMode.CLAMP)
                    }
                } else Modifier
            )
            .padding(padding),
        content = content
    )
}

@Composable
fun GlassPill(
    modifier: Modifier = Modifier,
    color: Color = GlassFill,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .shadow(12.dp, RoundedCornerShape(999.dp), ambientColor = CardShadow, spotColor = CardShadow)
            .clip(RoundedCornerShape(999.dp))
            .background(color)
            .border(BorderStroke(1.dp, GlassStroke), RoundedCornerShape(999.dp))
            .padding(horizontal = 16.dp, vertical = 10.dp),
        content = content
    )
}

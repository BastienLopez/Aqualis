package com.aquarium.premium

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Surface
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat
import com.aquarium.premium.ui.AquariumApp
import com.aquarium.premium.ui.theme.AquariumTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            val container = remember { AppContainer(this) }
            AquariumTheme {
                Surface(color = Color.Transparent, modifier = Modifier) {
                    AquariumApp(container.repository)
                }
            }
        }
    }
}

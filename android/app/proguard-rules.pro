# Règles ProGuard — Aquarium App

# ── Room ──────────────────────────────────────────────────────────────────────
# Preserve Room DAO and Entity classes so R8 does not strip generated impls
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Dao class *
-keep @androidx.room.Entity class *
-keep @androidx.room.TypeConverters class *
-keepclassmembers class * extends androidx.room.RoomDatabase {
    static ** INSTANCE;
}
-keepclassmembers @androidx.room.Entity class * { *; }

# ── Kotlin coroutines ────────────────────────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# ── Kotlin metadata (needed for reflection in some libs) ─────────────────────
-keepattributes RuntimeVisibleAnnotations
-keep class kotlin.Metadata { *; }

# ── Jetpack Compose ──────────────────────────────────────────────────────────
# Compose relies on source names for debugging; keep in debug, strip in release is fine.
-dontwarn androidx.compose.**

# ── General safe rules ───────────────────────────────────────────────────────
# Preserve Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

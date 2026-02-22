# Audit APK Android — Aquarium App

## Résumé exécutif

**Découverte critique** : Le dossier `android/` contient une **application Android native Kotlin + Jetpack Compose** entièrement autonome, qui N'EST PAS un wrapper WebView de l'app Vite/React. Ce sont deux produits distincts dans le même dépôt. La SPA Vite et l'app Android native partagent le même concept (aquarium) mais ont des codebases séparés. Ce rapport couvre la configuration de build de l'app Android native.

Points bloquants avant release : (1) **aucune signing config** définie dans `build.gradle.kts` — impossible de générer un APK release signé sans setup préalable ; (2) `isMinifyEnabled = false` — l'APK release ne sera pas obfusqué ni réduit ; (3) `android:allowBackup="true"` — les sauvegardes Room sont extractibles via `adb backup` ; (4) `versionCode = 1` / `versionName = "1.0"` non incrémentés — à gérer pour chaque release Play Store.

---

## Tableau Constat → Impact → Priorité → Recommandation

| Constat | Impact | Priorité | Recommandation |
|---|---|---|---|
| Aucune signing config dans `build.gradle.kts` | APK release impossible à signer / uploader sur Play Store | P0 | Créer keystore + `key.properties` + `signingConfigs` block |
| `isMinifyEnabled = false` en release | APK ~40% plus gros, code reverse-engineerable, pas de tree-shaking | P0 | `isMinifyEnabled = true` + `isShrinkResources = true` |
| `proguard-rules.pro` vide | Sans règles Room, R8 peut supprimer des entités Room | P1 | Ajouter règles ProGuard Room + data classes |
| `android:allowBackup="true"` | `adb backup` extrait la DB Room complète | P1 | Mettre à `false` ou configurer `fullBackupContent` |
| `versionCode = 1` codé en dur | Montée de version manuelle risquée | P2 | Automatiser via CI ou variable Gradle |
| `targetSdk = 34` — non 35 | Google Play exige targetSdk ≥ 34 depuis août 2024 (OK) ; exigera 35 en 2025 | P2 | Planifier migration targetSdk 35 |
| Gradle 8.13 — dernière version stable | Bonne pratique, pas de problème | OK | Continuer à mettre à jour |
| Pas de `networkSecurityConfig` | Cleartext traffic non explicitement bloqué (OK sur API 28+ par défaut) | P3 | Ajouter config explicite par sécurité de défense |
| `ios-icons/` présent mais pas de projet iOS | Potentiel futur iOS — à planifier | Info | N/A |

---

## Identification du Stack Mobile

### Architecture
```
android/
├── app/
│   ├── build.gradle.kts        ← Config build Kotlin DSL
│   ├── proguard-rules.pro      ← Règles ProGuard (VIDE)
│   └── src/main/
│       ├── AndroidManifest.xml ← Permissions + config app
│       └── java/com/aquarium/premium/
│           ├── MainActivity.kt         ← Entry point
│           ├── AppContainer.kt         ← DI manuel (repository)
│           ├── AppViewModelFactory.kt  ← ViewModelFactory
│           ├── data/                   ← Room DB + Repository
│           ├── model/                  ← Data classes
│           ├── ui/                     ← Composables Jetpack Compose
│           │   ├── AquariumApp.kt      ← Root Composable + navigation
│           │   ├── screens/            ← AquariumScreen, SessionScreen, ShopScreen, CollectionScreen
│           │   ├── components/         ← BottomBar, etc.
│           │   └── theme/              ← MaterialTheme
│           └── viewmodel/              ← AquariumViewModel, SessionViewModel, ShopViewModel
```

### Technologies utilisées
| Composant | Version | Notes |
|---|---|---|
| Kotlin | (dépend du JDK 17) | Cible JVM 17 |
| Jetpack Compose BOM | 2025.12.00 | Très récent — Material3 |
| Room | 2.6.1 | Persistance SQLite |
| Coroutines | 1.7.3 | Async |
| ViewModel | 2.7.0 | Architecture |
| Gradle | 8.13 | Wrapper |
| compileSdk / targetSdk | 34 | Requis Play Store |
| minSdk | 26 (Android 8.0) | ~95% des appareils |

### Ce que l'app Android N'est PAS
- ❌ WebView wrapper de l'app Vite
- ❌ Capacitor / Cordova
- ❌ React Native
- ❌ Expo
- ✅ Application Kotlin native avec Jetpack Compose

---

## Étapes Build Android — Debug et Release

### Prérequis
```bash
# Vérifier Java 17
java -version  # doit afficher 17.x

# Vérifier ANDROID_HOME (ou ANDROID_SDK_ROOT)
echo $ANDROID_HOME
# Windows: echo %ANDROID_HOME%
# Doit pointer vers le SDK Android (généralement C:\Users\%USER%\AppData\Local\Android\Sdk)
```

### Build Debug
```bash
cd android/

# Windows
gradlew.bat assembleDebug

# Linux/macOS
./gradlew assembleDebug
```
**Output** : `android/app/build/outputs/apk/debug/app-debug.apk`

**Installation sur appareil/émulateur** :
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Release (non signé — avant setup keystore)
```bash
cd android/
gradlew.bat assembleRelease
```
**Output** : `android/app/build/outputs/apk/release/app-release-unsigned.apk`

Cet APK non signé ne peut pas être installé ni uploadé sur le Play Store.

---

## Gestion des Signatures (Keystore)

### Étape 1 — Générer un keystore

```bash
# À exécuter une seule fois — GARDER le fichier .jks précieusement
keytool -genkeypair \
  -alias aquarium-key \
  -keyalg RSA \
  -keysize 4096 \
  -sigalg SHA256withRSA \
  -validity 10000 \
  -keystore aquarium-release.jks \
  -storepass VOTRE_STORE_PASSWORD \
  -keypass VOTRE_KEY_PASSWORD \
  -dname "CN=AquariumApp, OU=Dev, O=VotreOrganisation, L=Paris, ST=IDF, C=FR"
```

**IMPORTANT** : Stocker `aquarium-release.jks` hors du dépôt git. Si cette clé est perdue, vous ne pourrez plus mettre à jour l'app sur le Play Store.

### Étape 2 — Fichier `key.properties`

Créer `android/key.properties` (à ajouter dans `.gitignore`) :
```properties
storePassword=VOTRE_STORE_PASSWORD
keyPassword=VOTRE_KEY_PASSWORD
keyAlias=aquarium-key
storeFile=../aquarium-release.jks
```

Ajouter dans `android/.gitignore` :
```gitignore
key.properties
*.jks
*.keystore
```

### Étape 3 — Configurer `app/build.gradle.kts`

```kotlin
import java.util.Properties
import java.io.FileInputStream

// Lire key.properties
val keyPropertiesFile = rootProject.file("key.properties")
val keyProperties = Properties().apply {
    if (keyPropertiesFile.exists()) load(FileInputStream(keyPropertiesFile))
}

android {
    // ... config existante ...

    signingConfigs {
        create("release") {
            keyAlias = keyProperties.getProperty("keyAlias")
            keyPassword = keyProperties.getProperty("keyPassword")
            storeFile = file(keyProperties.getProperty("storeFile"))
            storePassword = keyProperties.getProperty("storePassword")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Étape 4 — Générer l'APK signé

```bash
cd android/
gradlew.bat assembleRelease
```
**Output signé** : `android/app/build/outputs/apk/release/app-release.apk`

### Étape 5 — Générer un AAB (recommandé pour Play Store)

```bash
cd android/
gradlew.bat bundleRelease
```
**Output** : `android/app/build/outputs/bundle/release/app-release.aab`

**Pourquoi AAB plutôt qu'APK** :
- Play Store optimise la taille de téléchargement selon l'appareil (ABI, densité d'écran, langue)
- Requis pour les nouvelles apps depuis août 2021
- Environ 15–20% plus petit pour l'utilisateur final

---

## Règles ProGuard/R8 Requises

Le fichier `proguard-rules.pro` est actuellement **vide**. Sans règles, R8 peut supprimer ou renommer des classes utilisées par Room via réflexion.

```proguard
# ── Room ────────────────────────────────────────────────────────────────────
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.**
-keep @androidx.room.Entity class *
-keep @androidx.room.Dao interface *

# ── Data classes Kotlin (sérialisées par Room) ─────────────────────────────
# Remplacer com.aquarium.premium.model.** par le vrai package des entités
-keepclassmembers class com.aquarium.premium.model.** {
    <init>(...);
    <fields>;
}

# ── Kotlin Coroutines ────────────────────────────────────────────────────────
-dontwarn kotlinx.coroutines.**
-keep class kotlinx.coroutines.internal.MainDispatcherFactory { *; }

# ── Compose (normalement géré par BOM, mais à titre défensif) ───────────────
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# ── Suppress warnings génériques ─────────────────────────────────────────────
-dontwarn kotlin.**
-dontwarn org.jetbrains.annotations.**
```

---

## Versioning (`versionCode` / `versionName`)

### Situation actuelle
```kotlin
versionCode = 1
versionName = "1.0"
```

### Recommandations

**Règle Play Store** : `versionCode` doit être strictement croissant à chaque upload. Ne jamais réutiliser un versionCode.

**Stratégie manuelle** :
```kotlin
// app/build.gradle.kts — à incrémenter manuellement avant chaque release
versionCode = 2          // Integer — incrément à chaque déploiement Play Store
versionName = "1.1.0"    // Semver — visible par l'utilisateur
```

**Stratégie automatique (CI)** :
```kotlin
// Lire depuis un fichier version.properties ou depuis git tags
val versionProps = Properties().apply {
    load(FileInputStream(rootProject.file("version.properties")))
}
versionCode = versionProps.getProperty("VERSION_CODE").toInt()
versionName = versionProps.getProperty("VERSION_NAME")
```

```properties
# version.properties (committé dans git)
VERSION_CODE=2
VERSION_NAME=1.1.0
```

---

## Configuration Gradle Détaillée

### `app/build.gradle.kts` — État actuel vs recommandé

```kotlin
android {
    namespace = "com.aquarium.premium"
    compileSdk = 34  // OK — considérer 35 en 2025

    defaultConfig {
        applicationId = "com.aquarium.premium"
        minSdk = 26       // Android 8.0 — couvre ~95% des appareils actifs
        targetSdk = 34    // ✅ Requis par Play Store (août 2024)
        versionCode = 1   // ⚠️ À incrémenter
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false  // ❌ DOIT ÊTRE true
            // isShrinkResources = ??? — non défini, ajouter = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"  // ⚠️ Fichier vide — ajouter règles Room
            )
            // ❌ signingConfig NON DÉFINI — APK release non signable
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17  // ✅
        targetCompatibility = JavaVersion.VERSION_17  // ✅
    }

    // MANQUANT — recommandé pour Play Store
    // splits {
    //     abi { isEnable = true; reset(); include("arm64-v8a", "armeabi-v7a", "x86_64") }
    // }
}
```

### ABI Splits (optionnel, réduit la taille APK)

Pour un APK (pas AAB), les ABI splits réduisent la taille :
```kotlin
splits {
    abi {
        isEnable = true
        reset()
        include("arm64-v8a", "armeabi-v7a", "x86_64")
        isUniversalApk = false
    }
}
```
**Note** : Si vous uploadez un AAB, Google Play gère cela automatiquement. Les splits ne sont utiles que pour la distribution APK directe.

---

## Permissions Android

### Permissions déclarées (AndroidManifest.xml)
**Aucune permission déclarée.** ✅ Excellent — le principe du moindre privilège est respecté.

### Permissions que l'app DEVRAIT déclarer si elle utilise :
| Permission | Feature | Statut |
|---|---|---|
| `INTERNET` | Réseau | ❌ Non requis (app offline) |
| `RECORD_AUDIO` | Micro | ❌ Non requis |
| `READ_EXTERNAL_STORAGE` | Fichiers | ❌ Non requis |
| `VIBRATE` | Haptic feedback | Potentiellement utile (tap sur vitre) |
| `RECEIVE_BOOT_COMPLETED` | Notifications quotidiennes | Optionnel si push quêtes voulu |

### Recommandation
Ne rien ajouter pour l'instant. Si des notifications locales (rappel session, quête quotidienne) sont ajoutées :
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
```

---

## Checklist Play Store Readiness

### Icônes & Splash

- [x] `mipmap-hdpi/ic_launcher` présent
- [x] `mipmap-mdpi/ic_launcher` présent
- [x] `mipmap-xhdpi/ic_launcher` présent
- [x] `mipmap-xxhdpi/ic_launcher` présent
- [x] `mipmap-xxxhdpi/ic_launcher` présent
- [ ] **Adaptive icon** (`ic_launcher_background` + `ic_launcher_foreground`) — vérifier avec `android:roundIcon`
- [ ] **Splash screen** — non détecté (`androidx.core:core-splashscreen` non dans les dépendances) → ajouter

```kotlin
// Ajouter dans dependencies (build.gradle.kts)
implementation("androidx.core:core-splashscreen:1.0.1")
```

```kotlin
// MainActivity.kt — AVANT setContent
installSplashScreen()
```

- [ ] **Feature graphic** Play Store (1024×500 px) — asset à créer
- [ ] **Screenshots** Play Store (au moins 2 screenshots téléphone) — à capturer

### Métadonnées Play Store (à préparer hors code)
- [ ] Titre app (max 30 chars) : ex. "AquariumFocus - Poissons & Zen"
- [ ] Description courte (max 80 chars)
- [ ] Description longue (max 4000 chars)
- [ ] Politique de confidentialité hébergée en ligne (OBLIGATOIRE même sans données personnelles)
- [ ] Section "Data Safety" : déclarer "Aucune donnée collectée" (toutes les données sont locales)
- [ ] Catégorie app : "Simulation" ou "Style de vie"
- [ ] Classification de contenu : tout public (rating questionnaire à remplir)

### Target API Level
- `targetSdk = 34` ✅ conforme aux exigences Play Store actuelles (août 2024 : min 33)
- Préparer upgrade vers `targetSdk = 35` pour les releases 2025

### Tests de stabilité requis
- [ ] **ANR check** : aucune opération longue sur le thread principal (Room via coroutines ✅)
- [ ] **Crash rate < 1%** sur Firebase Crashlytics (à intégrer)
- [ ] **Compatibilité écrans** : tester 5" / 6.5" / tablette 10"
- [ ] **Rotation** d'écran gérée (Compose gère nativement)
- [ ] **Thème sombre/clair** : app force thème propre via `AquariumTheme` ✅

---

## Commandes Complètes — Récapitulatif

```bash
# 1. Aller dans le dossier Android
cd android/

# 2. Nettoyer
gradlew.bat clean

# 3. Build debug (test rapide)
gradlew.bat assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# 4. Installer debug sur appareil connecté
adb install app/build/outputs/apk/debug/app-debug.apk

# 5. Build release APK (après setup signing)
gradlew.bat assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk

# 6. Build AAB pour Play Store (recommandé)
gradlew.bat bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab

# 7. Vérifier que l'APK est bien signé
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk

# 8. Analyser la taille de l'APK
gradlew.bat :app:analyzeReleaseBundle
# Ou ouvrir l'APK dans Android Studio > Build > Analyze APK

# 9. Lancer les tests unitaires Android
gradlew.bat test

# 10. Lancer les tests instrumentés (sur émulateur)
gradlew.bat connectedAndroidTest
```

---

## Pièges Fréquents

### 1. Room + R8 — Suppression de classes
**Risque** : Avec `isMinifyEnabled = true` et un `proguard-rules.pro` vide, R8 peut supprimer les implémentations générées par Room (DAO, Database impl).  
**Solution** : Ajouter les règles ProGuard Room ci-dessus avant d'activer R8.  
**Symptôme** : `java.lang.RuntimeException: cannot find implementation for com.aquarium.premium.data.AquariumDatabase`

### 2. Compose + ProGuard — Classes @Composable
**Risque** : R8 peut renommer des Composables non référencés explicitement.  
**Solution** : Les règles du BOM Compose gèrent normalement cela. En cas de crash release uniquement, ajouter `-keep @androidx.compose.runtime.Composable class **`.

### 3. Coroutines + R8
**Risque** : `kotlinx.coroutines.internal.MainDispatcherFactory` non trouvé en release.  
**Solution** : Règle ProGuard déjà incluse dans le template ci-dessus.

### 4. `versionCode` non incrémenté
**Symptôme** : `Upload failed: Version code X has already been used.`  
**Solution** : Toujours incrémenter `versionCode` avant chaque upload sur Play Store.

### 5. Keystore perdu
**Conséquence** : Impossible de mettre à jour l'app sur le Play Store (il faudrait créer une nouvelle app avec un nouvel ID).  
**Solution** : Sauvegarder le `.jks` dans au moins 2 endroits distincts (cloud chiffré + stockage physique).

### 6. `ANDROID_HOME` non configuré sur la machine de CI
**Symptôme** : `SDK location not found.`  
**Solution** :
```bash
# Créer android/local.properties (gitignored)
echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties
```

### 7. `gradlew` non exécutable sur Linux/macOS
```bash
chmod +x android/gradlew
```

### 8. Build memory — Gradle OOM
**Symptôme** : `Java heap space` pendant le build.  
**Solution** : `android/gradle.properties` déjà configuré à `-Xmx4g` ✅. Augmenter à `-Xmx6g` si besoin.

### 9. Splash screen blanc avant premier frame Compose
**Solution** : Intégrer `androidx.core:core-splashscreen` (cf. section Splash ci-dessus).

### 10. Audio — Absence de sons sur certains appareils
**Contexte** : L'app Android native est séparée de la SPA Web qui utilise Web Audio API. Si les sons sont implémentés dans l'app native, vérifier :
- `ExoPlayer` ou `MediaPlayer` pour les fichiers audio
- Gestion du `AudioFocusRequest` si d'autres apps jouent de la musique
- Gestion `onPause()` pour couper le son quand l'app passe en arrière-plan

---

## Quick Wins (≤ 2h)

1. **Créer `key.properties` + keystore** + configurer `signingConfigs` dans `build.gradle.kts` → APK release signable immédiatement
2. **`isMinifyEnabled = true`** + **`isShrinkResources = true`** + règles ProGuard Room dans `proguard-rules.pro`
3. **`android:allowBackup="false"`** dans `AndroidManifest.xml`
4. **Ajouter `key.properties` et `*.jks` au `.gitignore`**
5. **Tester le build release** : `gradlew.bat bundleRelease` → vérifier que l'AAB se génère sans erreur

## Chantiers Structurants

1. **Automatiser le versionCode** via `version.properties` + CI GitHub Actions (1h)
2. **Splash screen** avec `core-splashscreen` (2h)
3. **Firebase Crashlytics** pour crash monitoring production (2h)
4. **Play Store page** : screenshots, description, politique de confidentialité, data safety form (1 journée)
5. **targetSdk 35** migration + tests compatibilité (demi-journée)
6. **Tests instrumentés** `connectedAndroidTest` pour smoke test des ViewModels (1 journée)

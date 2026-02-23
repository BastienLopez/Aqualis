# Swap Aqualis → APK Android via Capacitor

> **Objectif** : produire un `.apk` (ou `.aab`) installable/publiable sur Android,  
> **sans casser** le déploiement GitHub Pages sur https://bastienlopez.github.io/Aqualis/

---

## Contexte de ton projet

| Élément | État actuel |
|---|---|
| Framework | **Vite + React 18 SPA** (pas Next.js, pas de SSR) |
| Router | `BrowserRouter` avec `basename={import.meta.env.BASE_URL}` |
| Build prod | `base: "/Aqualis/"` → GitHub Pages ✅ |
| `android/` actuel | Kotlin natif Jetpack Compose — **sans rapport avec le web**, à supprimer |
| CI/CD | GitHub Actions → deploy automatique sur `main` |

**Stratégie retenue : Capacitor**  
Capacitor sert ton build Vite via `http://localhost` dans une WebView Android → aucun changement de code React, BrowserRouter continue de fonctionner.

---

## Prérequis (à installer une fois)

### 1. Node.js + npm
Déjà présent (ton projet tourne).

### 2. Java JDK 21
Vérifie : `java -version` → doit afficher `21.x`  
Si absent (winget disponible) :
```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK --accept-source-agreements --accept-package-agreements --silent
```
Ou télécharge → https://adoptium.net/temurin/releases/?version=21 (LTS)

> ⚠️ Capacitor 7 exige **Java 21 minimum** (Java 17 donne `invalid source release: 21`)

### 3. Android Studio
Télécharge : https://developer.android.com/studio  
Lors de l'installation, coche :
- Android SDK
- Android SDK Platform (API 34)
- Android Virtual Device

### 4. Variables d'environnement (Windows)
Après l'install d'Android Studio, ajoute dans les variables système :

```
ANDROID_HOME = C:\Users\<TON_USER>\AppData\Local\Android\Sdk
```

Et dans `Path`, ajoute :
```
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\platform-tools
```

Vérifie : ouvre un nouveau PowerShell → `adb --version` doit répondre.

---

## Étape 1 — Supprimer l'ancien dossier android/

Le `android/` actuel contient du Kotlin natif qui n'a aucun lien avec ton app web.  
Capacitor va le régénérer proprement.

```powershell
# Depuis la racine du projet
Remove-Item -Recurse -Force android/
```

---

## Étape 2 — Installer Capacitor

```powershell
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
```

---

## Étape 3 — Modifier vite.config.ts

Capacitor a besoin d'un build avec `base: './'` (chemins relatifs) car les fichiers sont servis localement.  
GitHub Pages a besoin de `base: '/Aqualis/'`.

→ On ajoute un **troisième mode** `capacitor` qui coexiste avec les deux existants.

Remplace la ligne `base` dans `vite.config.ts` :

```ts
// AVANT
base: mode === "production" ? "/Aqualis/" : "/",

// APRÈS
base: mode === "capacitor" ? "./" : mode === "production" ? "/Aqualis/" : "/",
```

---

## Étape 4 — Ajouter le script build:capacitor dans package.json

Dans la section `"scripts"` de `package.json`, ajoute :

```json
"build:capacitor": "vite build --mode capacitor",
```

Résultat :
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "build:capacitor": "vite build --mode capacitor",
  ...
}
```

---

## Étape 5 — Créer capacitor.config.ts

Crée un fichier **`capacitor.config.ts`** à la racine du projet :

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aquarium.premium',
  appName: 'Aqualis',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,  // remplis si tu signes avec un keystore
    },
  },
};

export default config;
```

> `androidScheme: 'https'` → garantit que l'app tourne sur `https://localhost`  
> ce qui rend BrowserRouter 100% compatible (pas de pb de `file://`).

---

## Étape 6 — Premier build + init Capacitor

```powershell
# Build pour Capacitor (génère dist/ avec base ./)
npm run build:capacitor

# Initialiser Capacitor (répond aux questions : appName = Aqualis, appId = com.aquarium.premium)
npx cap init

# Ajouter la plateforme Android (crée le dossier android/ Capacitor)
npx cap add android

# Synchroniser le build dans le projet Android
npx cap sync android
```

> **`npx cap sync`** = copie `dist/` dans `android/app/src/main/assets/public/`  
> À refaire à **chaque fois** que tu modifies ton code React.

---

## Étape 7 — Ouvrir Android Studio et générer l'APK

```powershell
# Ouvre directement le projet Android dans Android Studio
npx cap open android
```

Dans Android Studio :

### Debug APK (test rapide)
1. Attends que Gradle finisse (barre en bas)
2. Menu `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. Clique sur **"locate"** dans la notification → ton APK est dans :  
   `android/app/build/outputs/apk/debug/app-debug.apk`
4. Transfère ce fichier sur ton téléphone et installe-le

### Release APK (pour distribuer / Play Store)
1. Menu `Build` → `Generate Signed Bundle / APK`
2. Choisis **APK** (ou AAB pour le Play Store)
3. Crée un **keystore** si tu n'en as pas (garde-le précieusement !)
4. Remplis alias, mots de passe
5. Choisis `release` → `Finish`
6. L'APK signé est dans `android/app/build/outputs/apk/release/`

---

## Workflow quotidien (après setup initial)

```powershell
# 1. Tu modifies ton code React...

# 2. Rebuild pour Capacitor
npm run build:capacitor

# 3. Sync dans Android Studio
npx cap sync android

# 4. Dans Android Studio → Build APK (ou Run sur émulateur/device)
```

---

## GitHub Pages — rien à changer ✅

Le CI/CD actuel (`.github/workflows/ci.yml`) fait :
```
npm run build   →   base "/Aqualis/"   →   deploy sur GitHub Pages
```

Ce script **n'est pas touché**. Les deux coexistent :

| Commande | `base` | Destination |
|---|---|---|
| `npm run build` | `/Aqualis/` | GitHub Pages ✅ |
| `npm run build:capacitor` | `./` | APK via Capacitor ✅ |

https://bastienlopez.github.io/Aqualis/ continue de fonctionner exactement comme avant.

---

## Option alternative sans Android Studio : PWABuilder (APK via TWA)

Si tu veux un APK **sans installer Android Studio**, tu peux passer par PWABuilder :

1. Ton app est déjà déployée sur https://bastienlopez.github.io/Aqualis/ avec un `manifest.webmanifest` ✅
2. Va sur https://www.pwabuilder.com/
3. Entre l'URL de ton app
4. Clique sur **"Package for stores"** → **Android (TWA)**
5. Télécharge le `.apk` ou `.aab` généré automatiquement

> ⚠️ Le TWA charge ton app depuis internet (l'URL GitHub Pages).  
> Si t'es offline, l'app ne fonctionne pas (sauf si tu ajoutes un service worker).

---

## Résumé des icônes APK

Pour un APK propre, Capacitor a besoin d'icônes dans `android/app/src/main/res/`.  
Après `npx cap add android`, génère les icônes automatiquement :

```powershell
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --android
```

Prérequis : avoir un fichier `assets/icon.png` (1024×1024) et `assets/splash.png` (2732×2732) à la racine.

---

## Récapitulatif des commandes (setup initial complet)

```powershell
# 1. Supprime l'ancien android/ (Kotlin inutile)
Remove-Item -Recurse -Force android/

# 2. Installe Capacitor
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli

# 3. Build Capacitor
npm run build:capacitor

# 4. Init + add + sync
npx cap init
npx cap add android
npx cap sync android

# 5. Ouvre Android Studio
npx cap open android

# → Dans Android Studio : Build > Build APK(s)
```

---

## Checklist finale

- [x] Java 21 installé (`java -version`) ✅
- [x] Android SDK API 36 installé (via sdkmanager) ✅
- [x] `ANDROID_HOME` défini dans les variables d'env ✅
- [x] `npm install @capacitor/core @capacitor/android` fait ✅
- [x] `npm install --save-dev @capacitor/cli` fait ✅
- [x] `vite.config.ts` modifié (ajout mode `capacitor`) ✅
- [x] `package.json` script `build:capacitor` ajouté ✅
- [x] `capacitor.config.ts` créé à la racine ✅
- [x] `Remove-Item android/` fait (ancien Kotlin) ✅
- [x] `npm run build:capacitor` OK ✅
- [x] `npx cap add android` OK ✅
- [x] `npx cap sync android` OK ✅
- [x] APK généré : `android/app/build/outputs/apk/debug/app-debug.apk` (8.2 MB) ✅
- [x] GitHub Pages https://bastienlopez.github.io/Aqualis/ toujours fonctionnel ✅

---

## Script tout-en-un (futurs builds)

Un script `build-apk.ps1` a été créé à la racine. Pour rebuilder l'APK après chaque modif :

```powershell
.\build-apk.ps1
```

Il fait automatiquement : `build:capacitor` → `cap sync` → `gradlew assembleDebug`  
L'APK final est dans `android/app/build/outputs/apk/debug/app-debug.apk`.

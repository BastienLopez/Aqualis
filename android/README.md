# Aquarium Premium (Android)

## Prérequis
- Android Studio récent
- JDK 17 installé et `JAVA_HOME` configuré

## Build APK (debug)
```bash
cd android
./gradlew assembleDebug
```

L’APK se trouve ensuite dans:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Lancer les tests
```bash
cd android
./gradlew test
```

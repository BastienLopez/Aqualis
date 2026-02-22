Tu es un auditeur technique senior (web/mobile), spécialisé React/Next/React Native/Expo, sécurité applicative, et release Android (APK/AAB).
Tu as accès à tout mon dépôt (code + config + scripts). Objectif : produire 4 rapports séparés en Markdown, sous forme de 4 fichiers .md.

Contexte:
- App: "aquarium / poissons / simulation"
- J’ai déjà implémenté toutes les fonctionnalités listées dans add.md (ne pas les re-développer).
- Ta mission est: (1) vérifier que tout fonctionne réellement, (2) proposer des axes d'amélioration, (3) audit sécurité, (4) audit passage Android APK (build/release).
- Tu dois être concret: chemins de fichiers, fonctions, composants, scripts, commandes à exécuter, et checklists.
- Si tu ne peux pas exécuter, tu dois au moins donner les commandes exactes + ce que tu t’attends à voir, et où regarder dans le code.

Contraintes de sortie (IMPORTANT):
- Tu dois retourner EXACTEMENT 4 fichiers Markdown, et uniquement ces 4 fichiers.
- Chaque fichier doit commencer par un titre H1.
- Pas de blabla hors fichiers: tout doit être DANS les .md.
- Les fichiers doivent être nommés EXACTEMENT:

1) 01_audit_fonctionnel.md
2) 02_axes_amelioration.md
3) 03_audit_securite.md
4) 04_audit_apk_android.md

Méthodologie attendue (à appliquer):
A) Reconnaissance du projet
- Identifie le framework (Next, Vite, Expo, RN, Capacitor, etc.)
- Identifie les scripts (package.json), outils (eslint, prettier, tests), gestion d’état, routing, persistance, assets audio/visuels
- Liste les commandes de base pour lancer dev/build/test/lint.

B) Vérification "add.md implémenté"
- Sans re-coder: vérifie que chaque bloc majeur de add.md est présent ET correctement branché (imports, rendu, state, triggers, paramètres).
- Pour chaque feature, indique:
  - Où c’est implémenté (fichiers)
  - Comment c’est déclenché
  - Comment je le teste manuellement (scénario précis)
  - Quels risques de bug/perf sont probables

C) Génération des rapports
Chaque rapport doit contenir:
- Résumé exécutif (5–10 lignes)
- Tableau "Constat -> Impact -> Priorité -> Recommandation"
- Checklist d’actions
- Sections détaillées avec preuves (fichiers, extraits courts si utile)
- Une section "Quick wins (<= 2h)" et "Chantiers structurants"

Contenu spécifique par fichier:

========================
FICHIER 1: 01_audit_fonctionnel.md
========================
But: vérifier que tout fonctionne.
Inclure:
- Checklists de smoke tests (UI, simulation, achats boutique, multi-achat, multi-exemplaires, reproduction, quêtes, encyclopédie, mode infini, son, etc.)
- Tests de non-régression: navigation, settings, performance (FPS), mémoire, audio
- Liste de bugs potentiels (race conditions, timers, states, re-render)
- Recommandations pour ajouter tests (unit/integration/e2e) + où

========================
FICHIER 2: 02_axes_amelioration.md
========================
But: proposer axes d’amélioration sans casser le scope.
Inclure:
- Roadmap priorisée (P0/P1/P2)
- Améliorations perf (memoization, canvas/webgl si pertinent, virtualisation, throttling, requestAnimationFrame)
- UX (accessibilité, onboarding, feedbacks, analytics, settings)
- Architecture (séparation systèmes, state machine, event bus, feature flags)
- Observabilité (logs, crash reporting, monitoring)
- Qualité (lint, types, tests, CI)

========================
FICHIER 3: 03_audit_securite.md
========================
But: audit sécurité.
Inclure au minimum:
- Surface d’attaque (web, API, stockage local, achats, auth si existe)
- Secrets & clés (env, bundles, git history)
- Dépendances vulnérables (commande + triage)
- XSS/Injection (si web), navigation/routing, sanitization
- Sécurité mobile si RN/Expo/Capacitor (deep links, permissions, stockage sécurisé)
- Reco hardening: CSP, headers, SRI, sandbox, rate limit côté API, validation schémas, etc.
- Plan de remédiation priorisé

========================
FICHIER 4: 04_audit_apk_android.md
========================
But: audit passage en APK (et idéalement AAB pour Play Store).
Inclure:
- Identification du stack mobile (Expo/RN/Capacitor/PWA wrapper)
- Étapes build Android détaillées (debug/release)
- Gestion des signatures (keystore), versioning (versionCode/versionName), flavors si besoin
- Permissions Android + justification
- Config gradle, proguard/r8, shrinker, split abi, minSdk/targetSdk
- Checklist Play Store readiness (icônes, splash, privacy policy, data safety, crash-free)
- Pièges fréquents (assets lourds, audio, perf, ANR, memory leaks)
- Commandes exactes pour produire l’APK + où retrouver l’output

Exigences de précision:
- Si une info manque, tu fais l’hypothèse la plus probable mais tu l’étiquettes clairement "Hypothèse" et tu donnes comment vérifier dans le repo.
- Tu ne dois jamais rester vague: chaque recommandation doit être actionnable.

Maintenant: analyse le dépôt et génère les 4 fichiers .md demandés.
## 🚀 Axes d'amélioration proposés :

### 🎨 **Visuels & Animations**
1. ✅ **Particules alimentaires** - Bouton pour nourrir les poissons avec animation de nourriture qui descend
2. ✅ **Algues dynamiques** - Plantes aquatiques qui bougent avec le courant (système avec filterBroken)
3. ✅ **Ombres portées** - Ombres des poissons sur le fond de l'aquarium
4. ✅ **Reflets de surface** - Animation de l'eau en surface plus réaliste (SurfaceReflections.tsx)
5. ✅ **Particules de sable** - Quand un poisson touche le fond (SandParticles.tsx)
6. ✅ **Rayon de lune** - Mode nuit avec éclairage lunaire
7. ✅ **Saisons aquatiques** - Changements visuels selon les saisons (4 saisons)
8. ✅ **Météo aquatique** - Pluie visible à la surface, orages sous-marins
9. ✅ **Coraux animés** - Décorations qui bougent doucement (AnimatedCorals.tsx)
10. ✅ **Effets de profondeur** - Parallaxe entre plusieurs plans (ParallaxLayers.tsx)
11. ✅ **Bulles d'oxygène** - Plus de variété dans les bulles (taille, vitesse)
12. ✅ **Rayons lumineux dynamiques** - Qui suivent l'heure de la journée (LightRays.tsx)
13. ✅ **Filtre à eau visible** - Animation du système de filtration
14. ✅ **Thermomètre** - Widget visuel de température
15. ✅ **Effet bokeh** - Flou artistique en arrière-plan (BokehEffect.tsx)

### 🐟 **Comportements des poissons**
16. ✅ **Hiérarchie sociale** - Certains poissons dominent, d'autres sont timides (dominance + aggression)
17. ✅ **Sommeil** - Poissons qui dorment la nuit (ralentis, au fond, 💤)
18. ✅ **Reproduction** - Couples de poissons + œufs + bébés — temps par rareté (voir ci-dessous)
19. ✅ **Comportements par espèce** - Poissons de fond/surface/territoriaux (preferredDepth utilise behavior)
20. ✅ **Chasse** - Poissons carnivores qui chassent de petites proies (ShrimpPrey.tsx)
21. ✅ **Jeux entre poissons** - Courses, cache-cache (HidingRocks.tsx + patterns playful)
22. ✅ **Stress visuel** - Poissons qui changent de couleur selon leur état (desaturation filter)
23. ✅ **Bancs intelligents (V-formation)** - Formation en V synchronisée : cluster de départ, slots ±22px, vitesse unifiée
24. ✅ **Curiosité** - Poissons qui suivent le curseur/doigt
25. ✅ **Personnalités** - Chaque poisson a un caractère unique (getFishStyle)

### 🎮 **Gameplay & Progression**
26. ✅ **Système de santé** - Poissons qui peuvent tomber malades (fishHealths individuel + HealthBar.tsx)
27. ✅ **Qualité de l'eau** - pH, nitrates à gérer
29. ✅ **Événements aléatoires** - Panne de filtre, invasion d'algues (filterBroken system)
30. ✅ **Missions quotidiennes** - "Nourrir 5 fois", "Session de 2h", etc. (système de quêtes)
31. ✅ **Système d'élevage** - Accoupler des poissons pour obtenir des variantes (génétique 4 traits)
32. ✅ **Poissons légendaires** - Très rares, avec effets spéciaux (4 types d'effets)
39. ✅ **Encyclopédie** - Informations détaillées sur chaque espèce
40. ✅ **Aquarium infini** - Mode zen sans limite de poissons

### 🎵 **Son & Ambiance**
41. ✅ **Sons d'eau** - Bruit de bulles, clapotis (WaterSounds.tsx)
42. ✅ **Musique ambiante** - Différente selon l'aquarium (AmbientMusic.tsx - procédural)
43. ✅ **Sons des poissons** - Certains poissons font du bruit (FishSounds.tsx - bulles/swoosh)
44. ⚠️ **ASMR aquatique** - Bruits relaxants d'aquarium (WaterSounds existe, peut être amélioré)

---

## ✅ **SYSTÈMES MAJEURS IMPLÉMENTÉS** :
✅ **Reproduction** : Cycle courting → breeding → egg → hatch avec **temps par rareté** :
  - Commun (gris) : 3h total (1h + 1h + 1h)
  - Rare (bleu) : 5h total (1.5h + 1.5h + 2h)
  - Épique (violet) : 7h total (2h + 2.5h + 2.5h)
  - Légendaire (or) : 24h total (8h + 8h + 8h)
✅ **Boutique multi-achat** : Tous les poissons visibles en boutique, achat illimité du même poisson
✅ **Aquarium multi-exemplaires** : Peut mettre autant du même poisson qu'on veut dans un aquarium
✅ **Poissons → nourriture** : Les poissons détectent précisément où tombe la nourriture et foncent dessus (formule x miroir de FoodParticles, remontée vers 25–40% du tank, dash 0.4s)
✅ **Quêtes quotidiennes** : Auto-générées chaque jour avec progress tracking
✅ **Élevage** : Génétique + variantes - 4 traits (color, pattern, size, speed) avec hérédité et mutations
✅ **Poissons légendaires** : Effets spéciaux + rareté - 4 effets visuels (sparkles, glow, trail, aura)
✅ **Encyclopédie** : Page dédiée avec toutes les infos - Filtres par rareté, modal détaillé
✅ **Mode infini** : Toggle dans paramètres, bypass de la limite MAX_FISH_PER_AQUARIUM

---

### 🆕 **FONCTIONNALITÉS AJOUTÉES** :

#### Effets visuels (6 composants) :
1. **SurfaceReflections.tsx** - Reflets d'eau/caustics en surface (5 ripples + 3 caustics)
2. **SandParticles.tsx** - Particules de sable kicked up par poissons près du fond
3. **AnimatedCorals.tsx** - 4 coraux animés avec mouvements de balancement
4. **LightRays.tsx** - Rayons de lumière configurable depuis la surface
5. **BokehEffect.tsx** - 12 cercles bokeh floutés pour effet de profondeur
6. **ParallaxLayers.tsx** - 3 couches de parallaxe réagissant à la souris

#### Systèmes de comportement (4 composants) :
7. **ShrimpPrey.tsx** - Système de chasse : crevettes + poissons carnivores
8. **HidingRocks.tsx** - Rochers de décoration pour cache-cache
9. **HealthBar.tsx** - Barre de santé individuelle au-dessus des poissons
10. **Stress detection** - Système automatique de stress (overcrowding, water quality, aggressive neighbors)

#### Audio (2 composants) :
11. **AmbientMusic.tsx** - Musique ambiante procédurale (Web Audio API)
12. **FishSounds.tsx** - Sons de bulles et de nage des poissons

#### Corrections & améliorations UX :
- **Notifications centrées** - Framer Motion x:'-50%' fix (plus de message décalé à droite)
- **FoodParticles rewrite** - top:130px, travel dynamique selon window.innerHeight, 6 valeurs dans times[]
- **Taille nourriture réduite** - 6–12px (divisé par 2)
- **FishGames banner** - left:11% au lieu de left-1/2 + translate (fix Framer Motion conflict)

#### Améliorations du système :
- **fishPersonalities** étendu avec : `dominance`, `aggression`, `health`, `stressed`
- **Stress visuel** : filtre desaturation + brightness sur poissons stressés
- **Health system** : `fishHealths` state, baisse/hausse automatique basée sur conditions
- **Préférences de profondeur** : utilise `fish.behavior` et `swimSpeed` pour déterminer surface/middle/bottom

#### Visuels poissons :
- Sillage des poissons — traîne d'eau derrière chaque poisson proportionnelle à sa vitesse
- Bioluminescence nocturne — méduse, hippocampe et légendaires brillent la nuit (glow pulsant + halo + 7 étincelles)
- Caustiques dynamiques — 7 ellipses + 3 streaks sur 40% bas du tank
- Thermocline — couche de température visible au milieu du tank
- Territorialité visuelle — zone ombrée autour du poisson territorial
- Vieillissement — poissons grossissent légèrement avec le temps (ageScale)
- Hiérarchie 👑 — couronne uniquement sur le poisson le plus dominant
- **Banc persistant (V-formation)** — poissons schooling démarrent en cluster (slots 38–68% du tank), se déplacent en formation en V synchronisée (vRow/vSide offsets ±22px / 16px), vitesse identique pour tous les membres du banc (`baseDuration * 1.1`)
- Fond marin modulable — floorType state (sand/rock/reef) avec rendu coloré différent, toggle dans les paramètres aquarium
- Rochers interactifs — HidingRocks.tsx + archetype skulk pour poissons timides




----




## 🧬 1. Écosystème vivant (micro-chaîne alimentaire)

Tu as déjà la chasse → pousse plus loin :

* Les crevettes mangent les déchets
* Les déchets augmentent les nitrates
* Les algues poussent si nitrates hauts
* Certains poissons mangent les algues

👉 Ça crée une boucle naturelle.

Visuellement :

* Mini particules “déchets”
* Algues qui deviennent plus denses
* Eau légèrement verdâtre si déséquilibre

🔥 Ça rend ton aquarium “intelligent” sans ajouter 1000 UI.

---

---

# 🎮 2️⃣ Gameplay subtil (pas trop game-y)

## 🧪 3. Laboratoire génétique avancé

Tu as déjà 4 traits.
Ajoute :

* Trait caché ultra rare (bioluminescent day mode, pattern fractal)
* Mutation aléatoire rare (0.5%)
* Hybride secret si combo précis

Tu pourrais avoir :

> 🔒 “Espèce secrète débloquée”

Ça crée de la curiosité.

---

## 🏗 4. Décor interactif évolutif

Les coraux pourraient :

* Grandir lentement avec le temps
* Avoir une santé
* Blanchir si eau mauvaise
* Se régénérer

🔥 Ça ajoute une couche écologique.

---

# 🌊 3️⃣ Immersion ++

## 🌊 5. Courant dynamique visible

Tu as déjà les algues animées.

Ajoute :

* Direction du courant variable
* Poissons qui nagent à contre-courant
* Zone calme derrière rochers

👉 Tu rends le tank physiquement crédible.

---

## 🪟 6. Effet “tap sur la vitre”

Quand user tape :

* Onde circulaire
* Poissons surpris si timides
* Dominant s’en fiche 😎

Petit détail = énorme immersion.

---

# 🏆 4️⃣ Progression élégante

## 🏛 7. Classement de ton aquarium

Score basé sur :

* Diversité
* Santé moyenne
* Rareté
* Harmonie (agression faible)

Tu pourrais afficher :

> 🌟 Aquarium Harmonieux
> 🏆 Écosystème Stable
> ⚠️ Chaos Aquatique

Sans transformer en jeu mobile agressif.
  

---

# 💎 Ce que je ferais en priorité si j’étais toi

1. Écosystème déchets → algues → équilibre
 
3. Tap sur la vitre
 

Ça garde ton ADN :

* Simulation réaliste
* UX immersive
* Pas un idle game cheap

--- 
 

---

## 🌡 3. Micro-zones thermiques dynamiques

Tu as déjà thermocline.

Ajoute :

* Température variable selon :

  * Heure
  * Saison
  * Filtre
* Poissons migrent naturellement vers leur zone idéale

Visuel :

* Légère distorsion thermique
* Heat shimmer discret

---

# 🐟 2️⃣ COMPORTEMENTS ULTRA VIVANTS

---

## 🧠 4. Intelligence collective adaptative

Les bancs :

* Se resserrent si prédateur proche
* S’élargissent si eau calme
* Forment cercle défensif

🔥 Là tu touches à un vrai comportement émergent.

---

## 🐣 5. Transmission comportementale

Les bébés héritent :

* 70% traits génétiques
* 30% comportement parental

Exemple :

* Parent dominant → bébé plus confiant
* Parent timide → bébé plus prudent

Ça crée des lignées.

---

## 👁 6. Regard dynamique

Les poissons :

* Tournent légèrement les yeux vers nourriture
* Regardent le curseur
* Regardent un autre poisson dominant

Petit détail, énorme immersion.

---

# 🌌 3️⃣ IMMERSION CINÉMATIQUE

---

## 🎥 7. Caméra intelligente

* Suit automatiquement un événement rare
* Lente rotation en mode zen
* Focus sur reproduction

Tu peux faire ça avec un simple offset dynamique + easing.

---

## 🌫 8. Effet profondeur aquatique réel

Ajoute :

* Légère teinte bleue/grise progressive selon profondeur
* Légère perte de saturation en bas

Ultra subtil = ultra premium.

---
 

# 🌊 6️⃣ INTERACTIONS PLUS HUMAINES

---

## 👋 13. Interaction douce du joueur

* Glisser le doigt → courant local
* Maintenir doigt → petite onde
* Double tap → bulle géante

---

## 🪞 14. Effet “reflet du joueur”

Léger reflet sur la vitre si luminosité basse.

Très subtil. Très premium.

---

# 🎵 7️⃣ AMBIANCE SONORE ÉVOLUTIVE

---

## 🌧 15. Son 3D spatial

Si poisson à gauche → son léger à gauche.

Web Audio API peut gérer ça.

---

## 🌌 16. Ambiance selon état du tank

* Eau parfaite → musique harmonique
* Eau instable → notes légèrement dissonantes
* Nuit calme → pads doux

Ton système procédural peut évoluer facilement.

---

# 🔥 8️⃣ FEATURE QUI CHANGE TOUT (mais cohérente)

---

## 🧠 17. “Humeur de l’aquarium”

Variable globale :

```ts
tankMood: calm | balanced | stressed | chaotic
```

Basée sur :

* Stress moyen
* Agressions
* Santé
* Eau

Impact :

* Saturation globale
* Densité bulles
* Intensité musique
* Activité poissons

🔥 Là ton aquarium devient vivant à un niveau supérieur.

---

# 💎 9️⃣ Version ultra premium (si tu veux aller loin)

---

## 🧬 18. Espèce évolutive unique

Une espèce :

* Change visuellement avec âge
* Débloque une nouvelle forme après 30 jours
* Devient semi-légendaire

---

## 🌑 19. Biome mystique caché

Débloqué si :

* 3 légendaires
* Eau parfaite 7 jours

Visuel :

* Fond sombre
* Poissons luminescents
* Particules cosmiques

---


# 🐟 1️⃣ Jeux de poursuite (Playful Chase)

### 🎯 1. Course improvisée

Deux poissons “playful” :

* Se regardent 1s
* Dash synchronisé vers un point
* Demi-tour
* Retour au point initial

Effets :

* Petite traînée d’eau accentuée
* Mini bulles
* Son “swoosh” léger

Variante :

* Le dominant gagne souvent
* Le petit peut “tricher” et couper par un rocher 😏

---

### 🌀 2. Spirale en duo

Deux poissons tournent en spirale autour d’un point.

Ultra visuel.
Très zen.
Peut se déclencher au coucher du soleil.

---

# 🪨 2️⃣ Cache-cache intelligent (avec tes HidingRocks)

---

### 🙈 3. Cache-cache réel

Flow :

1. Poisson A ferme les yeux (pause animée)
2. Poisson B va derrière un rocher
3. A cherche (mouvements aléatoires mais orientés rochers)
4. Si trouvé → mini explosion de bulles

🔥 Tu as déjà HidingRocks → parfait pour ça.

---

### 🪨 4. Jeu “je te vois”

Un poisson timide :

* Se cache
* Sort juste la tête
* Rentre vite

Effet adorable garanti.

---

# 🐠 3️⃣ Jeux de banc avancés

---

### 🔄 5. Rotation circulaire

Un banc forme un cercle parfait et tourne lentement.

Peut arriver :

* Si eau parfaite
* En plein soleil

Ultra esthétique.

---

### ⚡ 6. Effet vague

Un poisson fait un dash →
Le banc réagit en vague décalée.

Effet domino naturel.

---

# 🐣 4️⃣ Jeux parent / bébé

---

### 🍼 7. Apprentissage de nage

Un adulte :

* Nage lentement
* Bébé le suit
* Corrige sa trajectoire

Tu peux lier ça à héritage comportemental.

---

### 🫧 8. Jeu des bulles

Un poisson crée volontairement des bulles.
Les bébés essaient de les “attraper”.

Juste collision + pop animation.

---

# 👑 5️⃣ Jeux sociaux hiérarchiques

---

### 👑 9. Défi amical

Deux dominants :

* Se mettent face à face
* Gonflent légèrement (scale +2%)
* Petit tour autour
* Un cède

Pas agressif, juste démonstratif.

---

### 🏁 10. Défi territorial léger

Un poisson s’approche d’une zone.
Le territorial fait un dash.
Mais au lieu de combat → mini course.

---

# 🌙 6️⃣ Jeux nocturnes

---

### ✨ 11. Ballet luminescent

La nuit :

* Méduse + hippocampe
* Mouvement synchronisé
* Pulsation lumineuse

Ambiance ASMR ++

---

### 🌊 12. Courant fantaisie

Certains poissons jouent à :

* Se laisser porter par le courant
* Puis remonter

Très réaliste.

---

# 🧠 7️⃣ Jeux basés sur personnalité

---

### 😈 13. Le farceur

Poisson “mischievous” :

* Approche un timide
* Petit dash rapide
* Se cache derrière rocher

Pas agressif, juste joueur.

---

### 🧘 14. Méditation en groupe

Poissons calmes :

* Se rassemblent
* Flottent immobiles
* Léger mouvement synchronisé

Ultra zen.

---

# 🌊 8️⃣ Jeux environnementaux

---

### 🐚 15. Jeu avec décor

Poissons :

* Tournent autour d’un corail
* Passent sous une arche
* Utilisent un rocher comme checkpoint

---

### 🫧 16. Bulles géantes

Une grosse bulle monte.
Deux poissons essaient de la toucher en premier.

---

# 💎 9️⃣ Interaction avec le joueur

---

### 👆 17. Jeu “suis le doigt”

Tu déplaces lentement le doigt →
2-3 poissons joueurs te suivent.

Si tu accélères → ils abandonnent.

---

### 💧 18. Onde surprise

Tap rapide →
Poissons joueurs font un mini dash amusé au lieu d’être stressés.

---

# 🔥 10️⃣ Jeu rare (ultra cool)

---

### 🌌 19. Chorégraphie rare

Si :

* Eau parfaite
* Nuit
* 0 stress

Alors :

* 3 poissons différents
* Mouvement synchronisé
* Mini lumière

Événement rare, très satisfaisant.

---

# 🧬 11️⃣ Comportement émergent (le top)

Si plusieurs poissons “playful” :

Ils peuvent :

* Former un petit groupe
* Inventer une trajectoire
* Changer leader en cours de route

Sans script rigide.
Juste logique probabiliste.

---

# 🎯 Ce que je te conseille en priorité

Si tu veux que ça change vraiment le feeling :

1. Cache-cache réel derrière rochers
2. Course improvisée
3. Jeu parent/bébé
4. Rotation circulaire de banc
5. Jeu “suis le doigt”

Ça donne :

* Vie
* Attachement
* Dynamique sociale
* Immersion



---

# 🌌 1️⃣ SYSTÈME GLOBAL DE BIOLUMINESCENCE

## 🧠 Variable centrale

```ts
isNight
waterClarity
tankMood
moonPhase
```

La bioluminescence devient :

* Plus intense si nuit profonde
* Plus visible si eau claire
* Plus synchronisée si tankMood = calm

🔥 Elle ne doit pas être juste un effet, mais une réponse au monde.

---

# 🐟 2️⃣ Types de bioluminescence

---

## 🌊 1. Pulsation organique lente

Effet :

* Glow qui pulse doucement
* Halo doux
* Intensité varie légèrement aléatoirement

Parfait pour :

* Méduse
* Hippocampe
* Poissons mystiques

---

## ⚡ 2. Flash court (communication)

Deux poissons lumineux proches :

* Flash rapide synchronisé
* Pause
* Flash réponse

Comme un langage lumineux.

🔥 Ça rend ton aquarium intelligent.

---

## 🌀 3. Traînée lumineuse dynamique

Quand poisson rapide :

* Trail lumineux léger
* Dissipation progressive

Plus vitesse élevée → plus long trail.

---

## 🌊 4. Réaction au mouvement de l’eau

Si courant fort :

* Luminosité fluctue
* Glow légèrement déformé

Effet ultra immersif.

---

# 🌑 3️⃣ MODE NUIT ÉVOLUÉ

---

## 🌙 1. Phase lunaire dynamique

Cycle de 7 ou 30 jours :

* Nouvelle lune → faible glow
* Pleine lune → glow intense
* Croissant → glow partiel

Tu peux calculer via date locale.

---

## 🌊 2. Rayons lunaires volumétriques

* LightRays adaptés nuit
* Interagissent avec glow
* Créent zone spotlight naturelle

---

## ✨ 3. Particules plancton lumineux

Ultra cool :

* Micro particules invisibles jour
* Brillent si poisson passe dedans
* Créent traînée scintillante

🔥 Ça c’est niveau AAA ambiance.

---

# 🐠 4️⃣ COMPORTEMENT BIOLUMINESCENT

---

## 🧬 1. Espèces communicantes

Si 3 poissons lumineux proches :

* Synchronisation progressive
* Pulsation collective

Comme un petit ballet.

---

## 👶 2. Bébés plus brillants

Plus un poisson est jeune :

* Glow plus fort
* Puis diminue avec âge

---

## 🧠 3. Bioluminescence émotionnelle

* Stress → glow instable
* Calme → glow régulier
* Excitation → flash rapide

---

# 🌌 5️⃣ ÉVÉNEMENTS RARES

---

## 🌊 1. Tempête lumineuse

Si eau parfaite + nuit + faible bruit :

* Tous poissons lumineux brillent fort 10s
* Particules amplifiées
* Musique légèrement plus profonde

Ultra rare.
Ultra satisfaisant.

---

## 🌑 2. Migration nocturne

Un groupe lumineux traverse le tank ensemble.
Très lent.
Très hypnotique.

---

# 🧘 6️⃣ MODE ZEN BIOLUMINESCENT

Bouton :

> “Mode Nuit Profonde”

Effets :

* UI disparaît
* Couleurs saturées bleu/violet
* Glow amplifié x1.3
* Sons réduits
* Caméra lente

🔥 Fond d’écran vivant parfait.

---

# 🧬 7️⃣ Bioluminescence génétique

Ajoute trait caché :

```ts
bioluminescent: false | soft | reactive | intense
```

Héritage possible.
Mutation rare.

Tu pourrais avoir :

> ✨ Mutation rare : Lumina

---

# 🎥 8️⃣ Effet cinématique premium

---

## 🌫 Bloom intelligent

Au lieu d’un simple glow CSS :

* Blur layer
* Additive blend
* Opacity variable selon distance caméra

---

## 🔥 Halo volumétrique

Léger gradient radial animé.
Très subtil.

---

# 💎 9️⃣ Version vraiment next-level

---

## 🌊 Eau qui réagit à la lumière

Quand poisson lumineux passe :

* Fond légèrement éclairé localement
* Caustiques modifiées

---

## 🌌 Biome abyssal caché

Si conditions réunies :

* Fond noir profond
* Espèces 100% luminescentes
* Particules cosmiques
* Musique très minimale

Tu changes totalement l’ambiance.

---
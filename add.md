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
17. ✅ **Sommeil** - Poissons qui dorment la nuit (ralentis, au fond)
18. ✅ **Reproduction** - Couples de poissons + œufs + bébés (dans collection add une partie reproduction)
19. ✅ **Comportements par espèce** - Poissons de fond/surface/territoriaux (preferredDepth utilise behavior)
20. ✅ **Chasse** - Poissons carnivores qui chassent de petites proies (ShrimpPrey.tsx)
21. ✅ **Jeux entre poissons** - Courses, cache-cache (HidingRocks.tsx + patterns playful)
22. ✅ **Stress visuel** - Poissons qui changent de couleur selon leur état (desaturation filter)
23. ✅ **Bancs intelligents** - Synchronisation des mouvements (schoolFish)
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
✅ **Reproduction** : Système de couples, œufs, bébés (très complexe) - Cycle de 4 jours (courting → breeding → egg → hatch)
✅ **Quêtes quotidiennes** : Nécessite système de tracking persistant - Auto-générées chaque jour avec progress tracking
✅ **Élevage** : Génétique + variantes - 4 traits (color, pattern, size, speed) avec hérédité et mutations
✅ **Poissons légendaires** : Effets spéciaux + rareté - 4 effets visuels (sparkles, glow, trail, aura)
✅ **Encyclopédie** : Page dédiée avec toutes les infos - Filtres par rareté, modal détaillé
✅ **Mode infini** : Changement architecture aquarium - Toggle dans paramètres, bypass de la limite

### 🆕 **NOUVELLES FONCTIONNALITÉS AJOUTÉES** :
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

#### Améliorations du système :
- **fishPersonalities** étendu avec : `dominance`, `aggression`, `health`, `stressed`
- **Stress visuel** : filtre desaturation + brightness sur poissons stressés
- **Health system** : `fishHealths` state, baisse/hausse automatique basée sur conditions
- **Position tracking** : `fishPositions` et `carnivorePositions` pour systèmes interactifs
- **Préférences de profondeur** : utilise `fish.behavior` et `swimSpeed` pour déterminer surface/middle/bottom

🎨 Visuels
Sillage des poissons — traîne d'eau derrière chaque poisson proportionnelle à sa vitesse
Bioluminescence nocturne — méduse et hippocampe brillent vraiment la nuit (glow pulsant + halo)
Fond marin modulable — sable/roche/récif choisissables indépendamment du thème
Caustiques dynamiques — projection de lumière ondulée sur le fond (CSS filter + keyframes)

🐟 Comportements
Comportement banc persistant — les poissons "schooling" (néon, guppy, danio) maintiennent une formation cohésive en permanence, pas seulement en événement rare
Rochers interactifs — HidingRocks utilisés comme cachettes réelles (poissons stressés/timides se déplacent vers les rochers)
Territorialité visuelle — zone ombrée autour du poisson territorial, autres poissons qui la contournent
Vieillissement — poissons qui grandissent légèrement et grossissent avec le temps

🎮 Gameplay
Aquarium multi-étages — zones haute/basse avec thermocline visible et espèces adaptées à chaque zone
Achievements/trophées — déblocables : "Nourri 100 fois", "100 jours de streak", "Légendaire obtenu"

🎵 Son
ASMR amélioré — sons différenciés : mode pluie déclenche le son de pluie de WaterSounds, mode nuit active sons de méditation
Sons de saison — gazouillis printanier, ambiance hivernale feutrée


# Règles du Loup-Garou de Thiercelieux

> Document de référence pour le développement de l'application Garouf.
> Basé sur les règles officielles du jeu "Les Loups-Garous de Thiercelieux" édité par Lui-même / Asmodée.

---

## Sommaire

1. [Principe du jeu](#principe-du-jeu)
2. [Déroulement d'une partie](#déroulement-dune-partie)
3. [Rôles](#rôles)
4. [Ordre d'appel la nuit](#ordre-dappel-la-nuit)
5. [Conditions de victoire](#conditions-de-victoire)
6. [Équilibrage et compositions recommandées](#équilibrage-et-compositions-recommandées)
7. [Interactions entre rôles](#interactions-entre-rôles)

---

## Principe du jeu

Le jeu oppose deux camps :
- **Les Villageois** : doivent identifier et éliminer tous les Loups-Garous.
- **Les Loups-Garous** : doivent éliminer tous les Villageois.

Un **Maître du Jeu** (le narrateur, rôle tenu par l'application) orchestre la partie en appelant les rôles la nuit et en animant les débats le jour.

Le jeu alterne entre **phases de nuit** (les rôles spéciaux agissent secrètement) et **phases de jour** (le village débat et vote pour éliminer un suspect).

---

## Déroulement d'une partie

### Mise en place

1. Chaque joueur reçoit secrètement un rôle.
2. Personne ne connaît le rôle des autres (sauf exceptions : Loups entre eux, Amoureux entre eux).

### Première nuit (tour de préparation)

Certains rôles n'agissent que lors de la première nuit :

1. **Voleur** — regarde les 2 cartes non distribuées et peut échanger la sienne.
2. **Cupidon** — désigne 2 joueurs qui deviennent Amoureux.
3. **Les Amoureux** — se réveillent et se reconnaissent.

Puis les rôles habituels enchaînent (Voyante, Loups, etc.).

### Nuits suivantes (tour normal)

Les rôles sont appelés dans un ordre précis (voir [Ordre d'appel](#ordre-dappel-la-nuit)).

### Phase de jour

1. **Annonce des morts** — Le narrateur annonce qui a été éliminé pendant la nuit.
2. **Débat** — Les joueurs discutent et accusent.
3. **Vote** — Les joueurs votent à main levée pour éliminer un suspect. En cas d'égalité, personne ne meurt (sauf si le Bouc Émissaire est en jeu).

Le joueur éliminé révèle son rôle. Si c'est le Chasseur, il tire immédiatement.

---

## Rôles

### Camp des Loups-Garous

#### Loup-Garou 🐺

| Propriété | Valeur |
|-----------|--------|
| Camp | Loups-Garous |
| Intervention | Chaque nuit |
| Exemplaires | 1 à 4 selon le nombre de joueurs |

**Pouvoir** : Chaque nuit, les Loups-Garous se réveillent ensemble, se reconnaissent, et désignent unanimement un villageois à dévorer. Au lever du jour, la victime est éliminée.

**Règles** :
- Les Loups se connaissent entre eux.
- Ils ne peuvent pas dévorer un autre Loup-Garou.
- Le jour, ils participent aux débats en se faisant passer pour des Villageois innocents.

---

### Camp du Village

#### Villageois 🧑‍🌾

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Jour (vote) |
| Exemplaires | Variable (complète la composition) |

**Pouvoir** : Aucun pouvoir spécial. Le Villageois utilise la déduction, l'observation et la persuasion pour identifier les Loups-Garous lors des débats de jour.

---

#### Voyante 🔮

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Chaque nuit |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Chaque nuit, la Voyante se réveille et désigne un joueur. Le Maître du Jeu lui montre secrètement la carte (le rôle) de ce joueur.

**Règles** :
- Elle doit rester discrète pour ne pas se faire repérer par les Loups.
- Elle peut transmettre ses informations subtilement pendant les débats de jour.

---

#### Sorcière 🧪

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Chaque nuit (après les Loups) |
| Exemplaires | 0 ou 1 |

**Pouvoir** : La Sorcière possède 2 potions, chacune utilisable **une seule fois** dans toute la partie :
- **Potion de guérison** : sauve la victime des Loups-Garous cette nuit.
- **Potion de mort** : empoisonne un joueur de son choix (en plus de la victime des Loups).

**Règles** :
- Le Maître du Jeu lui montre qui a été attaqué par les Loups.
- Elle peut utiliser les deux potions la même nuit.
- Elle ne peut PAS utiliser la potion de guérison sur elle-même (règle officielle, mais souvent variée selon les tables).
- Chaque potion ne peut être utilisée qu'une seule fois par partie.

---

#### Chasseur 🏹

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | À son élimination (nuit ou jour) |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Lorsque le Chasseur est éliminé (que ce soit par les Loups la nuit ou par le vote du village le jour), il doit immédiatement désigner un joueur vivant : ce joueur est abattu sur-le-champ.

**Règles** :
- Le tir est obligatoire (il ne peut pas choisir de ne tuer personne).
- Il peut tirer sur n'importe quel joueur vivant.
- Le tir se déclenche quelle que soit la cause de sa mort (Loups, vote, poison de la Sorcière).

---

#### Cupidon 💘

| Propriété | Valeur |
|-----------|--------|
| Camp | Village (ou Amoureux si couple mixte) |
| Intervention | Première nuit uniquement |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Lors de la première nuit, Cupidon se réveille et désigne 2 joueurs qui deviennent **Amoureux**. Il peut se désigner lui-même comme l'un des deux amoureux.

**Règles** :
- Les Amoureux se réveillent ensuite pour se reconnaître.
- Si l'un des Amoureux meurt, l'autre meurt immédiatement de chagrin.
- **Couple mixte** (un Loup + un Villageois) : les Amoureux forment un 3ème camp. Leur objectif devient d'être les 2 derniers survivants. Ils doivent éliminer TOUS les autres joueurs (Loups ET Villageois).
- **Couple du même camp** : ils jouent normalement avec leur camp d'origine, avec le lien de mort en plus.
- Cupidon, s'il n'est pas Amoureux, joue avec le Village.

---

#### Petite Fille 👧

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Chaque nuit (pendant le tour des Loups) |
| Exemplaires | 0 ou 1 |

**Pouvoir** : La Petite Fille peut espionner les Loups-Garous pendant leur tour de nuit en entrouvrant les yeux.

**Règles** :
- Si les Loups-Garous la surprennent en train d'espionner, ils peuvent la dévorer immédiatement (à la place ou en plus de leur victime, selon les variantes).
- Dans l'application : la Petite Fille reçoit un indice partiel sur l'identité des Loups (par exemple, un des Loups est révélé aléatoirement).
- Elle est une cible prioritaire si les Loups la soupçonnent.

---

#### Salvateur 🛡️

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Chaque nuit (avant les Loups) |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Chaque nuit, le Salvateur se réveille et désigne un joueur à protéger. Si ce joueur est attaqué par les Loups-Garous cette nuit, il survit.

**Règles** :
- Il **ne peut PAS protéger la même personne deux nuits consécutives**.
- Il **peut se protéger lui-même**.
- La protection ne fonctionne que contre l'attaque des Loups-Garous, pas contre la potion de mort de la Sorcière.
- Si le joueur protégé est la cible des Loups, la Sorcière voit quand même qu'il y a eu une victime (mais celle-ci est sauvée).

---

#### Ancien 👴

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Passif |
| Exemplaires | 0 ou 1 |

**Pouvoir** : L'Ancien possède **2 vies** face aux Loups-Garous. La première fois qu'il est dévoré par les Loups, il survit (perd sa première vie). La deuxième attaque des Loups le tue.

**Règles** :
- Si l'Ancien est éliminé **par le village** (vote de jour), **par la Sorcière** (potion de mort) ou **par le Chasseur** (tir) : tous les autres villageois **perdent leurs pouvoirs spéciaux** et deviennent de simples Villageois. C'est une punition sévère pour le village.
- Seule l'attaque des Loups-Garous lui accorde la vie supplémentaire.
- La protection du Salvateur s'applique normalement (empêche de perdre une vie).

---

#### Corbeau 🐦‍⬛

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Chaque nuit |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Chaque nuit, le Corbeau se réveille et désigne un joueur. Ce joueur commencera le prochain vote de jour avec **2 voix contre lui** automatiquement.

**Règles** :
- Le Corbeau peut choisir de ne désigner personne (passer son tour).
- Les 2 voix s'ajoutent aux votes normaux du village.
- Le joueur ciblé est annoncé au village : "Un joueur a reçu la marque du Corbeau" (sans révéler qui est le Corbeau).
- Le Corbeau peut cibler n'importe quel joueur, y compris un Loup-Garou.

---

#### Idiot du Village 🤪

| Propriété | Valeur |
|-----------|--------|
| Camp | Village |
| Intervention | Passif (se déclenche au vote) |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Si l'Idiot du Village est désigné par le vote du village pour être éliminé, il **révèle son rôle et survit**. Mais il perd définitivement son **droit de vote** pour le reste de la partie.

**Règles** :
- Ce pouvoir ne fonctionne qu'une seule fois (la première fois qu'il est voté).
- S'il est attaqué par les Loups-Garous la nuit, il meurt normalement.
- S'il est empoisonné par la Sorcière, il meurt normalement.
- Après avoir survécu au vote, il peut toujours participer aux débats mais ne vote plus.

---

#### Voleur 🎭

| Propriété | Valeur |
|-----------|--------|
| Camp | Variable (dépend du rôle choisi) |
| Intervention | Première nuit uniquement |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Lors de la première nuit, le Voleur regarde 2 cartes non distribuées (placées au centre) et peut échanger sa carte avec l'une d'elles. Il prend alors le rôle correspondant pour le reste de la partie.

**Règles** :
- Si les 2 cartes du centre sont des Loups-Garous, le Voleur **doit obligatoirement** en prendre une (il est forcé de devenir Loup).
- Si au moins une carte n'est pas Loup-Garou, le choix est libre.
- S'il ne prend aucune carte, il reste Villageois simple.
- **Contrainte de mise en place** : quand le Voleur est en jeu, il faut distribuer **2 cartes de moins** que le nombre de joueurs (les 2 cartes restantes vont au centre).

---

### Rôle spécial

#### Capitaine 🎖️

| Propriété | Valeur |
|-----------|--------|
| Camp | Aucun (rôle additionnel) |
| Intervention | Jour (vote) |
| Exemplaires | 0 ou 1 |

**Pouvoir** : Le vote du Capitaine compte **double** (2 voix au lieu d'1). Le Capitaine est élu par le village au premier jour de jeu.

**Règles** :
- Le Capitaine est un rôle **additionnel** : un joueur cumule son rôle secret + le titre de Capitaine.
- Si le Capitaine est éliminé, il désigne son successeur avant de mourir.
- Le Capitaine peut être n'importe quel joueur (Loup ou Villageois).
- En cas d'égalité au vote, le Capitaine tranche.

---

## Ordre d'appel la nuit

L'ordre d'appel est crucial pour le bon déroulement du jeu. Il est **dynamique** : seuls les rôles présents dans la partie sont appelés.

### Première nuit

| Ordre | Rôle | Action |
|-------|------|--------|
| 1 | Voleur | Regarde les 2 cartes du centre, peut échanger |
| 2 | Cupidon | Désigne 2 Amoureux |
| 3 | Amoureux | Se réveillent et se reconnaissent |
| 4 | Voyante | Inspecte un joueur |
| 5 | Salvateur | Protège un joueur |
| 6 | Loups-Garous | Choisissent une victime |
| 7 | Sorcière | Utilise ses potions (ou non) |
| 8 | Corbeau | Désigne un joueur (marque +2 voix) |

### Nuits suivantes

| Ordre | Rôle | Action |
|-------|------|--------|
| 1 | Voyante | Inspecte un joueur |
| 2 | Salvateur | Protège un joueur (pas le même que la nuit précédente) |
| 3 | Loups-Garous | Choisissent une victime |
| 4 | Sorcière | Guérit et/ou empoisonne |
| 5 | Corbeau | Désigne un joueur |

### Rôles passifs (pas d'appel)

- **Petite Fille** : espionne durant le tour des Loups (pas appelée séparément)
- **Chasseur** : se déclenche automatiquement à sa mort
- **Ancien** : effet passif (2 vies contre les Loups)
- **Idiot du Village** : effet passif (survit au premier vote)
- **Capitaine** : vote double, élu le jour

### Rôles morts

Un rôle dont le joueur est mort **n'est plus appelé** la nuit (sauf la Sorcière qui peut être appelée même morte dans certaines variantes pour ne pas révéler qu'elle est morte — mais dans l'application, on skippe simplement).

---

## Conditions de victoire

| Camp | Condition |
|------|-----------|
| **Village** | Tous les Loups-Garous sont éliminés |
| **Loups-Garous** | Le nombre de Loups vivants est supérieur ou égal au nombre de Villageois vivants |
| **Couple mixte** (Amoureux) | Les 2 Amoureux sont les derniers survivants |

### Précisions

- La vérification se fait **après chaque mort** (nuit, jour, tir du Chasseur).
- En cas de couple mixte, si les Amoureux gagnent, ni le Village ni les Loups ne gagnent.
- Le Loup-Garou amoureux d'un Villageois doit aider à éliminer les autres Loups ET les Villageois.

---

## Équilibrage et compositions recommandées

### Ratio de base

Le ratio recommandé est d'environ **1 Loup-Garou pour 3-4 joueurs** (soit ~25-30% de Loups). Les rôles spéciaux du village compensent la puissance des Loups.

### Table de composition recommandée

| Joueurs | Loups | Voyante | Sorcière | Chasseur | Cupidon | Petite Fille | Salvateur | Ancien | Corbeau | Idiot | Voleur | Villageois |
|---------|-------|---------|----------|----------|---------|--------------|-----------|--------|---------|-------|--------|------------|
| **6** | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **7** | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **8** | 2 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **9** | 2 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **10** | 3 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| **11** | 3 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 3 |
| **12** | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 3 |
| **13** | 3 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 3 |
| **14** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 2 |
| **15** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 2 |
| **16** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 2 |
| **17** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2+2c |
| **18** | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 3+2c |

> **Note** : "2c" signifie 2 cartes au centre pour le Voleur. Quand le Voleur est en jeu, on ajoute 2 cartes supplémentaires à la distribution.

### Principes d'équilibrage

1. **Ratio Loups/Joueurs** : ~25% de Loups (1 Loup pour 3-4 joueurs).
2. **Rôles puissants du village** (Voyante, Sorcière, Salvateur) compensent l'avantage nocturne des Loups.
3. **Ajouter les rôles progressivement** : plus il y a de joueurs, plus on introduit de rôles spéciaux.
4. **Minimum de Villageois simples** : toujours garder au moins 2-3 Villageois sans pouvoir pour maintenir l'incertitude.
5. **Le Voleur augmente la complexité** : ne l'ajouter qu'avec 15+ joueurs pour garder une partie lisible.
6. **Cupidon change la dynamique** : le couple mixte peut bouleverser l'équilibre, à ajouter à partir de 9 joueurs.

### Limites par rôle

| Rôle | Min | Max | Notes |
|------|-----|-----|-------|
| Loup-Garou | 1 | 4 | Augmenter avec le nombre de joueurs |
| Villageois | 0 | ∞ | Complète les places restantes |
| Voyante | 0 | 1 | Recommandée dès 6 joueurs |
| Sorcière | 0 | 1 | Recommandée dès 7 joueurs |
| Chasseur | 0 | 1 | Recommandé dès 8 joueurs |
| Cupidon | 0 | 1 | Recommandé dès 9 joueurs |
| Petite Fille | 0 | 1 | Recommandée dès 11 joueurs |
| Salvateur | 0 | 1 | Recommandé dès 12 joueurs |
| Ancien | 0 | 1 | Recommandé dès 13 joueurs |
| Corbeau | 0 | 1 | Recommandé dès 15 joueurs |
| Idiot du Village | 0 | 1 | Recommandé dès 16 joueurs |
| Voleur | 0 | 1 | Recommandé dès 17 joueurs |

---

## Interactions entre rôles

### Salvateur + Loups-Garous
- Si le Salvateur protège la cible des Loups → la victime survit.
- La Sorcière voit quand même qu'il y a eu une attaque, mais la victime est "déjà sauvée" (la Sorcière peut garder sa potion).

### Salvateur + Sorcière
- La protection du Salvateur ne bloque PAS la potion de mort de la Sorcière.
- Si la Sorcière empoisonne un joueur protégé par le Salvateur, le joueur meurt (le Salvateur ne protège que contre les Loups).

### Ancien + Village
- Si le village élimine l'Ancien par vote, **tous les pouvoirs spéciaux du village sont annulés** : Voyante, Sorcière, Chasseur, Salvateur, etc. deviennent de simples Villageois.
- Si l'Ancien meurt des Loups (après ses 2 vies), pas de pénalité.

### Ancien + Sorcière
- Si la Sorcière empoisonne l'Ancien, il meurt immédiatement (pas de vie supplémentaire) ET les pouvoirs du village sont perdus.

### Ancien + Chasseur
- Si le Chasseur tire sur l'Ancien, l'Ancien meurt ET les pouvoirs du village sont perdus.

### Cupidon + Loups-Garous
- Si un Loup est amoureux d'un Villageois, ils forment un camp à part (couple mixte).
- Le Loup amoureux NE DOIT PAS voter pour tuer son amoureux(se) et vice-versa.

### Chasseur + Amoureux
- Si le Chasseur meurt et tire sur un Amoureux, l'autre Amoureux meurt aussi de chagrin (effet cascade).

### Sorcière + Chasseur
- Si la Sorcière empoisonne le Chasseur, celui-ci tire avant de mourir.

### Petite Fille + Loups-Garous
- Dans l'application : la Petite Fille reçoit un indice (ex: un Loup révélé aléatoirement) plutôt que d'espionner physiquement.

### Corbeau + Idiot du Village
- Si le Corbeau cible l'Idiot et que celui-ci est voté, l'Idiot survit normalement (son pouvoir prime).

### Voleur + n'importe quel rôle
- Le Voleur prend le rôle ET toutes ses règles.
- Si le Voleur prend le rôle de Loup-Garou, il rejoint le camp des Loups.

---

## Sources

- [Règles officielles - regledujeu.fr](https://www.regledujeu.fr/loup-garou-regle/)
- [Guide complet des rôles - Murderama](https://www.murderama.fr/blog/tous-les-roles-du-loup-garou-guide-complet)
- [Tout savoir sur le Loup-Garou - Murderama](https://www.murderama.fr/blog/tout-savoir-sur-le-loup-garou-regles-detaillees-et-variantes-creatives)
- [Les Loups-garous de Thiercelieux - Wikilivres](https://fr.wikibooks.org/wiki/Les_Loups-garous_de_Thiercelieux)
- [Règles du jeu - regles-de-jeux.com](https://www.regles-de-jeux.com/regle-du-loup-garou/)
- [Suggested setups - werewolv.es](https://werewolv.es/setups)

# OGLight

OGLight est un script facile à prendre en main, le but est d'ajouter énormément de fonctionnalités au jeu sans avoir à se prendre la tête à configurer quoi que ce soit pendant des heures.


![image](https://user-images.githubusercontent.com/1087731/189495657-572fa9ef-4aac-4fed-bdbc-596ce117f281.png)

- Author: Oz
- Fork: Kursion

# Guide d'utilisation d'OGLight
## Rapatriement des ressources

A l'aide de OGLight, vous pouvez rapatrier toutes vos ressources de toutes vos planètes ou de toutes vos lunes vers une destination (la destination est une de vos planètes ou une de vos lunes).
Si vous souhaitez rapatrier toutes les ressources de vos planètes, rendez-vous sur la première planète depuis laquelle vous souhaitez que le rapatriement décolle, puis cliquer sur le bouton bleu avec le symbole infini :

![image](https://user-images.githubusercontent.com/1087731/189495517-a5dbf0b3-a629-49d5-94e6-9307a520e8a1.png)


Une popup apparaîtra et vous demandera de choisir une destination vers laquelle vous souhaitez rapatrier vos ressources :

![image](https://user-images.githubusercontent.com/1087731/189495523-9e09a914-8098-4ed5-b761-dc9f4ab48c6b.png)


Sélectionnez une destination parmi vos planètes ou vos lunes (vous pouvez également sélectionner la lune associée grâce au bouton du même nom) :

Ensuite, vous serez amené sur le menu flotte de la première planète/lune que vous avez sélectionné. Il vous suffit alors d'appuyer sur la touche "entrée" en boucle (ou de la maintenir) pour que le script se charge d'envoyer les ressources à l'endroit souhaité.

Note : La mission utilisée (transpo/statio) ainsi que le type de vaisseaux envoyé dépendront des paramètres définis dans le menu de droite.

Afin de "sauter" une planète lors du processus, il est possible d'appuyer sur la touche "o" (ou sur le bouton correspondant à droite, sous la liste des planètes).

Une fois qu'une boucle complète entre toutes les planètes a été effectuée, le script quitte automatiquement le "mode rapatriement".

# Verrouillage de construction
Vous avez la possibilité de "verrouiller" toutes les constructions que vous voulez via le bouton suivant :

![image](https://user-images.githubusercontent.com/1087731/189495528-6844d046-bc85-4758-9983-092e0ee4a82c.png)



Une fois que vous avez cliqué dessus, un cadenas apparaîtra à côté de la planète/lune en question :

![image](https://user-images.githubusercontent.com/1087731/189495532-ee508305-ad86-4c7e-a351-fc0eed10eaf2.png)


Une fois ce bouton cliqué, une nouvelle fenêtre apparaîtra

![image](https://user-images.githubusercontent.com/1087731/189495536-67f58644-0812-43d6-b6ed-58cfe4f61325.png)


Vous pourrez alors supprimer une construction verrouillée ou envoyer directement des ressources à l'endroit désiré.

Notes :

- La mission utilisée (transpo/statio) ainsi que le type de vaisseaux envoyé dépendront des paramètres définis dans le menu de droite.
- Il est possible d'afficher puis de verrouiller des niveaux supérieurs en utilisant les flèches situés à côté du bouton de verrouillage.
- Pour la flotte et la défense, le nombre verrouillé dépendra du nombre indiqué dans le champs (celui utilisé normalement pour lancer la construction).
- Les ressources envoyées sont décomptés de la somme indiquée par le cadenas et il est ainsi possiblede compléter avec des ressources provenant d'autres planètes/lunes

# Ressources minimum à garder
Vous pouvez définir un nombre de ressources minimum à garder sur vos planètes/lunes.

Pour cela il suffit de se rendre sur la vue "flotte" n°3 :

![image](https://user-images.githubusercontent.com/1087731/189495585-af23480b-e3f8-4f66-bc79-abb3485961a2.png)


Une fois ce bouton cliqué, vous pourrez définir un montant de ressources à laisser sur TOUTES vos planètes / lunes.

# Envoi de ressources facilité
Vous pouvez sélectionner automatiquement le nombre de vaisseaux nécessaires à un transport en cliquant ici dans la vue "flotte" n°1 :

![image](https://user-images.githubusercontent.com/1087731/189495591-73904a9c-85d8-45e4-be3b-19d4b86734bf.png)


Une fenêtre vous permettra de définir les quantités de ressources à envoyer, puis, une fois ce montant indiqué, le script selectionnera le bon nombre de transporteurs à envoyer.

# Marquer des cibles
OGLight vous permet de marquer des cibles en leur attribuant des couleurs.

Pour cela, il vous suffit d'aller dans la vue "galaxie" et de cliquer ici

![image](https://user-images.githubusercontent.com/1087731/189495601-e77e3df0-1b36-4da9-b5c4-234d5f6ea004.png)


Vous pourrez alors choisir une couleur à lui attribuer ce qui aura pour effet de la rendre plus visible dans la vue "galaxie".

Notes :

- la couleur grise correspond au fait "d'ignorer" la cible ce que la rendra moins visible.
- il est possible de marquer toutes les planètes d'un joueur en survolant son pseudo et en choisissant une couleur directement ici :

![image](https://user-images.githubusercontent.com/1087731/189495612-de2005e8-746a-4ed2-b4fb-213a099db277.png)


Il est possible d'accéder à la liste des cibles marquées en cliquant ici :

![image](https://user-images.githubusercontent.com/1087731/189495614-56b1fbce-0001-4616-8ad3-57a1dec69d6c.png)


Ce qui a pour effet d'ouvrir sur la droite cette fenêtre :

![image](https://user-images.githubusercontent.com/1087731/189495620-67cdcc0e-f08d-4042-a3cb-8387a06c77e2.png)


Les cibles y sont triées par galaxies et par parquets (de 50) systèmes.

Note : il est possible d'afficher/masquer certaines cibles en cliquant sur les couleur en haut.

Cliquer sur les coordonnées permet d'ouvrir la vue "galaxie" à la position désirée.

Cliquer sur l'icone de planète permet de sonder la planète/lune.

L'icone drapeau permet de définir "la prochaine cible". Une fois celle-ci sélectionnée, il faut se rendre dans la vue "flotte" n°1. Il est alors possible d'appuyer sur la touche "t" (ou sur le bouton correspondant à droite, sous la liste des planètes). Cela aura pour effet de séléctionner la cible. il suffit alors d'appuyer plusieurs fois sur la touche "entrée" pour lancer une attaque.

Note :

Le type de vaisseaux selectionné dépend des paramètres définis dans le menu de droite.

Le nombre de vaisseaux envoyé dépend de la RVal (définissable dans les options d'OGL).

Une fois la cible attquée, la cible suivante (dans la liste de cibles) prendra alors le drapeau automatiquement et sera alors à son tour séléctionnable en utilisant la touche "t". Cela permet de piller rapidement les cibles de la liste.

# Tableau de rapports d'espionnage
OGlight peut lire les données de vos rapports d'espionnage afin de les trier dans un tableau.

![image](https://user-images.githubusercontent.com/1087731/189495628-bcee5886-3d3b-436a-9bc5-675f1aff58c0.png)


Dans ce tableau, cliquer sur le nom du joueur permet d'ouvrir le détail complet du rapport.

Il est possible de marquer les cibles directement dans le tableau.

Notes :

- Cette fonctionnalité est désactivable dans les options d'OGL.
- Le script ne peut trier que les rapports affichés. Il est donc conseillé de définir le nombre de messages par page au maximum (50) directement dans les options d'OGame (Options / Affichage / Messages).
- Dans les options d'OGLight, il est possible d'activer/désactiver la suppression automatique des rapports "inintéressants". Un rapport est considéré comme "inintéressant" si les ressources pillables sont inférieures à la RVal (voir les options d'OGLight) ET qu'il n'y a pas de flotte à quai.

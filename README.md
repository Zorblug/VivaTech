﻿Démonstration du kit interactivité pour BroadSign
========

Ce projet démontre plusieurs cas d'usages des *trigger* sous __BroadSign__ et des possibilités d'interaction entre un téléphone 
et un afficheur digitale.

1. Télécommande afin d'afficher une campagne à la demande.
2. Jeux multi-joueur sur un écran.
3. Jeux multi-joueur multi-éran
4. Tag NFC synchronisés avec une campagne
  1. Tag avec url
  2. Tag avec une connections Wifi
  3. Tag avec position geo-localisée
  4. Tag avec VCARD
5. Usage du kit de reconnaissance facial __OMRON__  

Modification et customisation :
========

Lancement de l'application 
DEBUG=jcd* BROADSIGN_IP=192.168.2.1 node server.js

Mise en place en poduction : 

cd /mnt/sda1/arduino/game
YUN_MODE=1 BROADSIGN_IP=192.168.2.1 MODE_ENV=production node server.js
ou
YUN_MODE=1 BROADSIGN_IP=192.168.2.1 MODE_ENV=production forever start server.js




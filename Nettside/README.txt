Les dette før du tester plattformen:

Det første du må gjøre for å kunne ta i bruk plattformen er å laste opp følgende koder til din Raspberry Pi:
server_no_encrypt.js
chartoperation.js
socket.js
style.css
index.html
For å gjøre dette kan kodene legges inn i raspberryen over FTP.

Etter du har gjort det, må serveren og nettsiden startes. For å starte serveren skriver du følgende:
node Tjener/server_no_encrypt.js
For å starte nettsiden skriver du følgende:
sudo systemctl start nginx

Nå er server og nettsiden din klar. Det som gjenstår er å laste opp arduino-koden til din ESP32.
Dette gjør du ved å åpne filen ESP32_SMARTHUS_PROSJEKT_2020.ino i Arduino IDE. 
Deretter laster du opp koden til din ESP32.

Nå kan åpne seriemonitoren i Arduino IDE, og følge med på hva som skjer. Deretter kan du taste inn IP-adressen til nettsiden,
og se hva som skjer der. Før du får tilgang der må du lage deg en ny bruker, og da trenger du registreringsnøkkelen. Den er:
passord
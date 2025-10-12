# MinfoAi

Un bot Discord completo, semplice da configurare e pronto all’uso. MinfoAi offre moderazione avanzata, gamification/XP, welcome/goodbye con anteprime, gestione permessi, info server, giveaway, musica, verifica utenti, e una UI in-chat minimale e accessibile per configurare tutto senza uscire da Discord.

## ✨ Panoramica
- Obiettivo: fornire un assistente all‑in‑one con comandi chiari e una “dashboard” in-chat (Setbot) che consente a chiunque di impostare il bot in pochi clic.
- Punti di forza: semplicità, sicurezza, performance, UX pulita e messaggi in Embed coerenti.

---

## 🧠 Funzionalità principali

1) Dashboard di benvenuto (Welcome) e Goodbye
- Messaggi di Benvenuto/Arrivederci con Embed personalizzabili (testo, immagine, colore, mention, canale dedicato)
- Anteprima live: le modifiche si vedono subito nell’Embed di preview
- Stato ON/OFF per attivare/disattivare rapidamente

2) Gamification / XP e Livelli
- XP per messaggi con cooldown anti‑farm
- Livelli e ruoli premio quando si raggiungono determinate soglie
- Leaderboard e contatori, opzionali e non invasivi

3) Moderazione
- Automod base (flood/link/mass mention)
- Azioni: warn/kick/ban/mute (dove implementate) e cancellazione messaggi
- Log eventi su console e, opzionalmente, canale dedicato

4) Permessi e Sicurezza
- Verifica rapida con pulsante “Verify” (assegna ruolo, log opzionale)
- Controlli dei permessi del bot prima di eseguire azioni critiche

5) Info Server e Utilità
- Comandi informativi (es. info bot/server)
- Stato del bot (botstatus)

6) Giveaway (sezione dedicata)
- Creazione, durata, numero vincitori, reroll

7) Musica (sezione dedicata)
- Player con coda/loop/skip/filters (se abilitati nella repo)

8) Logging
- Logger in console colorato e leggibile

---

## 🗂 Struttura del progetto

Percorsi principali (semplificati):

- src/
  - bot.js, index.js: bootstrap del client, avvio e registrazione handler
  - commands/: slash commands principali (botstatus, info, moderate, permission, setbot)
  - interactions/
    - interactionHandler.js: router per component/modals
    - setbot/: moduli di configurazione UI (welcome, goodbye, moderation, music, giveaway, verification, gamification)
  - events/: handler evento (guildMemberAdd/Remove, interactionCreate, messageCreate, welcome/goodbye/giveaway/verification/log)
  - gamification/: logica XP e handler
  - moderation/, music/, giveaway/: moduli specifici (se presenti)
  - database/: db.js e models/ (se si usa persistenza)
  - utils/, logs/: utilità e logging
- scripts/deploy-commands.js: registrazione comandi
- .env.example: variabili di ambiente

Nota: alcuni moduli possono essere opzionali o disattivati a seconda della configurazione effettiva della repo.

---

## ⚙️ Installazione e avvio

Requisiti
- Node.js 18+ (consigliato 18 LTS o superiore)
- NPM o PNPM/Yarn
- Token bot Discord + Client ID (e, facoltativo, GUILD_ID per registrazione comandi a livello server durante lo sviluppo)
- (Opzionale) MongoDB se si vuole persistenza per XP/config

Passi
1) Clona la repo
   git clone https://github.com/Fl4chi/MinfoAi.git
   cd MinfoAi
2) Installa le dipendenze
   npm install
3) Configura l’ambiente
   - Copia .env.example in .env
   - Imposta le variabili richieste (es. DISCORD_TOKEN, CLIENT_ID, GUILD_ID opzionale, DB_URI se usi Mongo)
4) Registra i comandi (sviluppo)
   node scripts/deploy-commands.js
5) Avvia il bot
   npm start
   (in alternativa: node src/index.js)

File .env (esempio)
- DISCORD_TOKEN=...
- CLIENT_ID=...
- GUILD_ID=... (opzionale per dev)
- DB_URI=... (opzionale per XP/config persistenti)

---

## 📦 Dipendenze principali

Controlla package.json per la lista completa. Tipicamente:
- discord.js e @discordjs/rest: core del bot e registrazione comandi
- dotenv: gestione variabili ambiente
- mongoose (opzionale): persistenza dati (XP, configurazioni)
- Altre librerie per musica/giveaway/log secondo i moduli presenti

Suggerimento: mantieni le versioni aggiornate e verifica i peer requirements di discord.js.

---

## 🎯 UI e Accessibilità (in‑chat)

- Tutta la configurazione avviene con componenti Discord (button/select/modal) direttamente in chat
- Messaggi in Embed con gerarchia visiva chiara, colori coerenti e testi brevi
- Anteprima live per welcome/goodbye e schede Setbot tematiche (Moderation, Music, Giveaway, Verification, Gamification)
- Stato e feedback immediati (ON/OFF, canale/ruolo selezionato, errori permessi)
- Accessibile: niente comandi complessi, azioni etichettate, testi leggibili anche su mobile

---

## 🚀 Esempi di utilizzo

- Setup rapido
  - Usa /setbot per aprire la dashboard in‑chat
  - Nella scheda Welcome, imposta canale e messaggio di benvenuto e abilita ON
  - Passa alla scheda Gamification per abilitare XP e ruoli premio

- Moderazione
  - Abilita filtri base e definisci azioni (warn/mute/delete) e canale log

- Verifica
  - Pubblica il messaggio “Verify” nel canale scelto; al clic assegna il ruolo previsto

(Screenshot facoltativo: aggiungi immagine della dashboard Setbot in azione)

---

## 🆘 Supporto e contatti

- Apri una Issue su GitHub per bug/feature request
- Autore: @Fl4chi
- Contributi benvenuti via Pull Request (descrivi chiaramente la modifica)

---

## 🛠 Troubleshooting

- Unknown interaction / errore reply già inviato
  - Se l’interazione è già deferita o replied, usa editReply/update invece di reply
- Il bot non scrive nel canale
  - Verifica permessi: ViewChannel, SendMessages, EmbedLinks, ReadMessageHistory
- Il ruolo Verify non viene assegnato
  - Assicurati che il ruolo del bot sia sopra al ruolo da assegnare e che abbia ManageRoles
- I comandi slash non compaiono
  - Controlla CLIENT_ID/GUILD_ID e rilancia lo script di deploy; attendi qualche minuto in global
- XP non aumenta
  - Verifica cooldown, canali esclusi e (se usi DB) la connessione a MongoDB

---

## ❓ FAQ

- Posso disattivare una singola funzionalità?
  - Sì, nelle schede Setbot trovi toggle per ON/OFF; in alternativa rimuovi/ignora i moduli.
- Come cambio la palette colori degli Embed?
  - Personalizza i valori nel modulo UI/tema o direttamente nei file delle interazioni.
- Posso usare il bot su più server?
  - Sì. Consigliato registrare i comandi in global (deploy senza GUILD_ID) dopo i test.

---

## Licenza

Questa repository è rilasciata secondo la licenza indicata nel repository (se presente). In assenza, considerare “All rights reserved” dell’autore.

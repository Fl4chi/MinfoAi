# MinfoAi

MinfoAi è un bot Discord intelligente e completo con AI proprietaria, moderazione avanzata, gamification, musica, giveaway, verifica avanzata e sistemi custom di gestione errori.

## Requisiti
- Node.js >= 18
- Token Discord Bot (`DISCORD_TOKEN`)
- MongoDB URI (`MONGODB_URI`)

## Setup
1. Clona la repo e installa le dipendenze:
   ```bash
   npm install
   ```
2. Crea un file `.env` copiando da `.env.example` e imposta:
   ```env
   DISCORD_TOKEN=...
   MONGODB_URI=...
   PREFIX=!
   NODE_ENV=development
   ```
3. Avvia in sviluppo:
   ```bash
   npm run dev
   ```
   Oppure in produzione:
   ```bash
   npm start
   ```

## Struttura Progetto (base)
- `src/index.js`: bootstrap app, validazione env, connessione MongoDB, avvio bot
- `src/bot.js`: client Discord.js v14, caricamento comandi/eventi modulari
- `src/commands`: comandi (slash e prefix) caricati dinamicamente
- `src/events`: eventi Discord caricati dinamicamente
- `src/utils/loader.js`: helper per caricare comandi ed eventi
- altre cartelle già predisposte per moduli futuri (moderazione, musica, ecc.)

## Note
- Nessuna API di terze parti per l'AI: l'architettura è pronta per moduli AI proprietari.
- Il sistema errori personalizzato sarà in `src/errors` e integrato negli handler.

## Licenza
MIT

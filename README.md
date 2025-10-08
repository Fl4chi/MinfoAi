# MinfoAi

MinfoAi è un bot Discord intelligente e completo con AI proprietaria, moderazione avanzata, gamification, musica, giveaway, verifica avanzata e sistemi custom di gestione errori.

## Funzionalità

### 🎉 Sistema Benvenuto/Addio
- **Messaggi di Benvenuto**: Messaggi personalizzati automatici quando un nuovo membro si unisce al server
- **Messaggi di Addio**: Messaggi personalizzati quando un membro lascia il server
- **Configurazione Flessibile**: Canali personalizzabili tramite variabili d'ambiente
- **Logging Avanzato**: Registrazione dettagliata degli eventi con informazioni complete del membro
- **Embeds Personalizzati**: Messaggi ricchi con avatar, informazioni temporali e statistiche server
- **Gestione Errori**: Gestione robusta degli errori con logging personalizzato
- **Controllo Permessi**: Verifica automatica dei permessi del bot prima dell'invio messaggi

#### Configurazione Variabili Ambiente (Benvenuto/Addio)
```env
# Canale per messaggi di benvenuto
WELCOME_CHANNEL_ID=123456789

# Canale per messaggi di addio  
GOODBYE_CHANNEL_ID=123456789

# Canale per i log degli eventi
LOG_CHANNEL_ID=123456789

# Messaggi personalizzati (opzionali)
WELCOME_MESSAGE="Benvenuto/a {user} nel server **{guild}**! 🎉\n\nSperiamo che tu possa divertirti e rispettare le regole del server."
GOODBYE_MESSAGE="Addio **{username}** 😭\n\nGrazie per aver fatto parte della comunità **{guild}**!\n\nSperiamo di rivederti presto!"
```

#### Placeholder Disponibili
- `{user}` - Menzione dell'utente (<@123456789>)
- `{username}` - Nome utente senza menzione
- `{guild}` - Nome del server
- `{memberCount}` - Numero totale di membri

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
   
   # Configurazione Benvenuto/Addio
   WELCOME_CHANNEL_ID=...
   GOODBYE_CHANNEL_ID=...
   LOG_CHANNEL_ID=...
   ```

3. Avvia in sviluppo:
   ```bash
   npm run dev
   ```
   Oppure in produzione:
   ```bash
   npm start
   ```

## Struttura Progetto

- `src/index.js`: bootstrap app, validazione env, connessione MongoDB, avvio bot
- `src/bot.js`: client Discord.js v14, caricamento comandi/eventi modulari
- `src/commands`: comandi (slash e prefix) caricati dinamicamente
- `src/events`: eventi Discord caricati dinamicamente
  - `src/events/guildMemberAdd.js`: gestore eventi per nuovi membri
  - `src/events/guildMemberRemove.js`: gestore eventi per membri che lasciano
- `src/utils/loader.js`: helper per caricare comandi ed eventi
- `src/errors`: sistema di gestione errori personalizzato integrato
- altre cartelle già predisposte per moduli futuri (moderazione, musica, gamification, giveaway, verifica, ecc.)

## Caratteristiche Tecniche

### Event Handlers Modulari
Il sistema di eventi è completamente modulare con:
- Caricamento automatico degli eventi dalla cartella `src/events`
- Gestione errori integrata per ogni evento
- Logging dettagliato delle operazioni
- Verifica automatica dei permessi del bot

### Sistema di Logging
- Log strutturati per debugging
- Registrazione eventi nei canali Discord configurati
- Gestione errori con stack trace completo
- Informazioni dettagliate su membri (ruoli, date, statistiche)

## Note

- Nessuna API di terze parti per l'AI: l'architettura è pronta per moduli AI proprietari.
- Il sistema errori personalizzato è integrato negli handler eventi.
- Tutti gli eventi sono ottimizzati per prestazioni e modularità.
- Supporto completo per Discord.js v14 con tutte le nuove funzionalità.

## Licenza

MIT

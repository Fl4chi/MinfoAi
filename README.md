# MinfoAi

MinfoAi è un bot Discord intelligente e completo con AI proprietaria, moderazione avanzata, gamification, musica, giveaway, verifica avanzata e sistemi custom di gestione errori.

## ✨ Caratteristiche Principali

### 🎨 Design Premium con Embed Messages
MinfoAi utilizza esclusivamente **messaggi embed premium** per tutte le comunicazioni del bot:
- 🖼️ **Estetica Moderna**: Design professionale con colori accesi e layout curato
- 📊 **Informazioni Dettagliate**: Statistiche server, timestamp, campi organizzati
- 🌈 **Palette Colori**: Purple (#8A2BE2) per benvenuti, Red (#FF6B6B) per addii
- 📱 **Responsive Design**: Ottimizzato per tutti i dispositivi Discord
- 🎯 **Branding Consistente**: Identità visiva MinfoAi in tutti i messaggi

## 📂 Struttura del Progetto

### File Principali
```
MinfoAi/
├── src/
│   ├── bot.js                    # Configurazione principale del bot
│   ├── index.js                  # Entry point dell'applicazione
│   ├── commands/                 # Comandi slash
│   │   ├── info.js              # Comando per profiling utente
│   │   └── setbot.js            # Dashboard configurazione bot
│   ├── events/                   # Event handlers Discord
│   │   ├── interactionCreate.js # Handler interazioni utente
│   │   ├── guildMemberAdd.js    # Gestione nuovi membri
│   │   ├── guildMemberRemove.js # Gestione membri rimossi
│   │   ├── welcomeHandler.js    # Sistema messaggi benvenuto
│   │   ├── goodbyeHandler.js    # Sistema messaggi addio
│   │   ├── giveawayHandler.js   # Gestione giveaway
│   │   └── verificationHandler.js # Sistema verifica membri
│   ├── interactions/             # Handler interazioni complesse
│   │   ├── interactionHandler.js # Gestione interazioni generali
│   │   └── setbot/              # Componenti dashboard setbot
│   ├── gamification/             # Sistema gamification
│   │   └── gamificationHandler.js # Livelli, XP, ricompense
│   ├── moderation/               # Sistema moderazione
│   │   └── moderationHandler.js  # Auto-mod, ban, kick, warn
│   └── music/                    # Sistema musica
│       └── musicHandler.js       # Player musica Discord
├── scripts/                      # Script utility
├── .env.example                  # Template variabili ambiente
├── package.json                  # Dipendenze Node.js
└── start-bot.bat                 # Script avvio Windows
```

## 🚀 Funzionalità

### 1. **Sistema Eventi Discord**
- **Welcome/Goodbye Messages**: Messaggi embed personalizzati per nuovi membri e membri che lasciano
- **Interaction Handler**: Gestione completa di slash commands, buttons, select menus
- **Member Management**: Tracking automatico entrate/uscite membri
- **Giveaway System**: Sistema completo per gestione giveaway con handler dedicato
- **Verification System**: Verifica avanzata membri con sistema anti-bot

### 2. **Comandi Slash**
- `/info` - Profiling dettagliato utente con statistiche e informazioni
- `/setbot` - Dashboard moderna per configurazione bot (UI/UX premium)

### 3. **Gamification**
- Sistema livelli ed esperienza (XP)
- Ricompense automatiche per attività
- Classifiche e statistiche utente
- Badge e achievement personalizzati

### 4. **Moderazione Avanzata**
- Auto-moderazione messaggi
- Sistema warn/kick/ban
- Logging azioni moderazione
- Filtri contenuti personalizzabili

### 5. **Sistema Musica**
- Player musica integrato
- Queue management
- Controlli interattivi (play/pause/skip)
- Supporto multiple piattaforme

## 🛠️ Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/Fl4chi/MinfoAi.git
   cd MinfoAi
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   # Modifica .env con i tuoi token e configurazioni
   ```

4. **Avvia il bot**
   ```bash
   # Linux/Mac
   npm start
   
   # Windows
   start-bot.bat
   ```

## ⚙️ Configurazione

Modifica il file `.env` con le seguenti variabili:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
# Aggiungi altre configurazioni necessarie
```

## 📦 Dipendenze Principali

- `discord.js` - Libreria Discord bot
- `@discordjs/voice` - Sistema audio/musica
- `dotenv` - Gestione variabili ambiente
- Altri package specificati in `package.json`

## 🗑️ Note di Cleanup

### Directory Vuote da Rimuovere
Le seguenti directory contengono solo file `.gitkeep` e possono essere eliminate:
- `src/database/` - Non attualmente utilizzata
- `src/errors/` - Non attualmente utilizzata
- `src/giveaway/` - Funzionalità gestita da event handler
- `src/logs/` - Non attualmente utilizzata
- `src/utils/` - Non attualmente utilizzata
- `src/verification/` - Funzionalità gestita da event handler

### File .gitkeep da Rimuovere
I file `.gitkeep` sono utilizzati per mantenere directory vuote in Git ma non sono necessari quando le directory contengono file reali:
- `src/.gitkeep`
- `src/commands/.gitkeep`
- `src/events/.gitkeep`
- `src/gamification/.gitkeep`
- `src/moderation/.gitkeep`
- `src/music/.gitkeep`

## 📝 Sviluppo

### Aggiungere Nuovi Comandi
1. Crea file in `src/commands/nomecomando.js`
2. Implementa logica comando
3. Il bot registrerà automaticamente il comando

### Aggiungere Nuovi Event Handler
1. Crea file in `src/events/nomeevent.js`
2. Esporta funzione handler
3. Il bot caricherà automaticamente l'event

## 🤝 Contribuire

Contributi, issues e feature requests sono benvenuti!

## 📄 Licenza

Questo progetto è sviluppato da Fl4chi.

## 🔗 Link Utili

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

**MinfoAi** - Bot Discord Intelligente con AI Proprietaria 🤖✨

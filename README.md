# MinfoAi

MinfoAi è un bot Discord intelligente e completo: AI proprietaria, moderazione avanzata, gamification, musica, giveaway, verifica sicura, dashboard interattiva e logging terminale prettificato. Ottimizzato per performance, UX premium e setup guidato.

## ✨ Caratteristiche principali
- 🎨 Design Premium: tutti i messaggi in Embed con palette coerente (Purple #8A2BE2, Red #FF6B6B, Green #43B581, Yellow #FEE75C)
- 🤖 AI Chat & Tools: risposte contestuali, comandi AI, prompt personalizzabili, antispam prompt
- 🛡️ Moderazione: antispam/link/mass mention, warn/kick/ban/mute, automod flessibile
- 🎵 Musica: player stabile (queue, loop, skip, filters), auto-reconnect
- 🎁 Giveaways: creazione, estrazione, reroll, durate e multipli vincitori
- ✅ Verifica: ruoli, canali dedicati, timeouts, captcha opzionale, log eventi
- 🧩 Gamification: XP, livelli, ruoli premio, leaderboard, anti-farm
- 🛠️ Dashboard Setbot: configurazione interattiva per welcome/goodbye/moderation/music/giveaway/verification
- 📈 Logging: logger terminale colorato; activitylog command rimosso (solo output console)
- 🚀 Performance: caching smart, code-splitting handlers, retry/backoff, rate-limit safe

## 📂 Struttura progetto (principale)
```
MinfoAi/
├── src/
│  ├── bot.js                   # Bootstrap client, logger, loaders
│  ├── index.js                 # Entrypoint
│  ├── commands/                # Slash commands
│  │  ├── info.js
│  │  ├── botstatus.js
│  │  ├── moderate.js
│  │  ├── permission.js
│  │  └── setbot.js             # Apertura dashboard configurazioni
│  ├── interactions/
│  │  ├── interactionHandler.js # Router component/modals
│  │  └── setbot/
│  │     ├── welcome.js         # Dashboard Welcome (anteprima live)
│  │     ├── goodbye.js         # Dashboard Goodbye (anteprima live)
│  │     ├── moderation.js      # Dashboard Moderazione
│  │     ├── music.js           # Dashboard Musica
│  │     ├── giveaway.js        # Dashboard Giveaway
│  │     └── verification.js    # Dashboard Verifica + pulsante Verify
│  ├── music/                   # Player
│  ├── moderation/
│  ├── giveaway/
│  ├── gamification/
│  ├── utils/
│  └── logs/                    # Logger prettificato
├── scripts/
│  └── deploy-commands.js       # Registrazione comandi (senza activitylog)
├── .env.example
└── README.md
```

## 🧭 Dashboard Setbot: anteprima live e UX
Tutte le dashboard mostrano un Embed/Preview aggiornato dopo ogni modifica. I pulsanti/select salvano la configurazione e riflettono lo stato reale (ON/OFF, ruolo, canale, colori coerenti). Viene gestito automaticamente il bug reply/editReply: se l’interazione è già risposta/deferita si usa editReply/update, altrimenti reply ephemeral.

Comportamento standard (abstract):
- Se interaction.replied || interaction.deferred => editReply({ embeds, components })
- Se è un component update => interaction.update({ embeds, components })
- Altrimenti => reply({ embeds, components, ephemeral: true })

### Welcome
- Stato: ON/OFF, canale, immagine, messaggio, mention, colore brand (#8A2BE2)
- Pulsanti: Toggle, Imposta Canale, Test, Reset
- Preview: mostra titolo dinamico, footer con server, colore coerente stato

### Goodbye
- Stato: ON/OFF, canale, messaggio, colore (#FF6B6B)
- Pulsanti: Toggle, Imposta Canale, Test, Reset
- Preview: dimostra rimozione con dettagli membro

### Verification
- Stato: ON/OFF, canale verifica, ruolo verificato, log channel, timeout sec
- Pulsanti: Toggle, Set Canale, Set Ruolo, Set Log, Set Timeout, Pubblica Messaggio Verify
- Preview: Embed stato con check ON/OFF; bottone “Verify” (disabled se OFF)
- Interazione Verify: assegna ruolo, logga su canale log (se presente), messaggio ephemeral

### Moderation
- Automod (links, mass mention, flood), action (mute/warn/delete), thresholds
- Log eventi su console e canale (opzionale), anteprima policy

### Music
- Auto-join, default volume, filters predefiniti, annuncio brani nel canale

### Giveaway
- Durata default, premi, n vincitori, canale di default; reroll rapido

### Gamification
- Moltiplicatori XP per canali, cooldown anti-farm, ruoli premio

## 🔐 Permessi & Scopes
Permessi BOT: ViewChannel, SendMessages, EmbedLinks, ReadMessageHistory, ManageRoles (per verifica), ManageChannels (se pubblica messaggi in canali lockati).
Scopes OAuth (se usi flusso web esterno): identify, guilds, guilds.members.read.

## 🧰 Deploy comandi (senza activitylog)
Lo script scripts/deploy-commands.js registra solo i comandi essenziali (setbot, info, moderate, ecc.). È stata rimossa ogni traccia del comando activitylog dalla registrazione e dal codice.

Esempio snippet (concetto):
```js
// ... build data
const data = [setbot, info, botstatus, moderate, permission];
await rest.put(Routes.applicationCommands(CLIENT_ID), { body: data });
console.log("✓ Slash commands deployed (no activitylog)");
```

## ⚙️ Performance & Stabilità
- Safe rate limits con backoff, retry sugli errori transient
- Cache locale per config (Map) + persistenza (Mongo opzionale)
- Controlli permessi bot canale prima di inviare messaggi
- Gestione errori centralizzata (utils/errors)

## 🚀 Setup rapido
1) Clona repo e copia .env.example in .env
2) Imposta TOKEN, CLIENT_ID, GUILD_ID opzionale per registrazioni guild-scoped
3) npm i
4) node scripts/deploy-commands.js
5) Avvia: npm start (o node src/index.js)

## ❓ FAQ
- Il bottone Verify non assegna ruolo?
  - Assicurati che il bot sia più in alto del ruolo da assegnare e che il canale log sia accessibile.
- La dashboard non si aggiorna?
  - Verifica che il bot usi update/editReply a seconda dello stato dell’interazione; se ricevi “Unknown interaction” probabilmente stai facendo reply dopo defer.
- Posso cambiare i colori degli embed?
  - Sì, vedi utils/theme.js o i campi color nei file dashboard.

## 🙌 Credits
- Sviluppo: Fl4chi
- Contributi: community
- Librerie: discord.js, @discordjs/rest, mongoose (opzionale), music libs

---
MinfoAi: il tuo assistente Discord all-in-one, con dashboard elegante e performance di livello.

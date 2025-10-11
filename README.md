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
```

## 🔐 Verifica Utenti (Dashboard Setbot)
La verifica è gestita dalla dashboard Setbot (interactions/setbot/verification.js) e dall'handler eventi (events/verificationHandler.js). Il flusso è pensato per garantire la sicurezza e il rispetto dei permessi.

### Permessi Richiesti
Per funzionare correttamente, il bot e (se usato OAuth esterno) l'utente devono consentire i seguenti permessi:

- Permessi BOT (nel canale di verifica):
  - ViewChannel (Vedere canali)
  - SendMessages (Inviare messaggi)
  - EmbedLinks (Inserire link incorporati)
  - ReadMessageHistory (Leggere cronologia messaggi)
  - ManageRoles (Gestire ruoli) — necessario per assegnare il ruolo verificato

- Scopes OAuth Utente (se si usa un flusso web esterno per la verifica):
  - identify — accesso a username, avatar, discriminator, user id
  - guilds — elenco server dell’utente (sapere server)
  - guilds.members.read — leggere info membro (nick, ruoli, joined_at, pending, nitro, flags)
  - (opzionale) guilds.join — per far unire l’utente a un server tramite OAuth, se previsto

Nota: Di default la verifica tramite bottone dentro Discord non usa OAuth esterno; i campi utente (username, avatar) sono letti tramite l’oggetto `interaction.member/user`.

### Flusso di Verifica
1. Configurazione da dashboard Setbot:
   - Abilitazione sistema verifica
   - Selezione canale di verifica
   - Selezione ruolo “Verificato” da assegnare
   - Scelta tipo (bottone/captcha/reazione) — default bottone
   - Invio messaggio di verifica nel canale selezionato
2. Il bot esegue un controllo permessi nel canale di verifica e mostra diagnostica in dashboard se mancano permessi.
3. L’utente clicca “Verifica” nel messaggio:
   - Il bot controlla che il ruolo esista e che possa gestirlo (gerarchia ruoli + ManageRoles)
   - Il bot assegna il ruolo configurato all’utente
   - Messaggio di conferma in DM/ephemeral
4. Log opzionali e messaggi di benvenuto sono gestiti dall’handler eventi.

### Validazioni e Sicurezza
- Controllo permessi bot nel canale di verifica prima dell’invio del pannello
- Controllo gerarchia ruoli e permesso ManageRoles prima di assegnare il ruolo
- Diagnostica in dashboard: indica se mancano permessi chiave nel canale
- Gestione errori con messaggi chiari e localizzati in italiano

### Troubleshooting
- “Mancano permessi: ViewChannel/SendMessages/EmbedLinks/ReadMessageHistory/ManageRoles”
  - Soluzione: Verifica i permessi del bot sul canale di verifica e che il ruolo del bot sia sopra il ruolo “Verificato”.
- “Il bot non può assegnare questo ruolo”
  - Soluzione: Alza il ruolo del bot sopra il ruolo da assegnare e abilita “Gestire ruoli”.


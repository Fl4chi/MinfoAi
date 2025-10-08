# MinfoAi
MinfoAi è un bot Discord intelligente e completo con AI proprietaria, moderazione avanzata, gamification, musica, giveaway, verifica avanzata e sistemi custom di gestione errori.

## ✨ Embed Message Style
**MinfoAi** utilizza esclusivamente **messaggi embed premium** per tutte le comunicazioni del bot, garantendo:
- 🎨 **Estetica Premium**: Design moderno con colori accesi e layout professionale
- 🖼️ **Elementi Visivi**: Avatar utente, thumbnail, banner personalizzati
- 📊 **Informazioni Dettagliate**: Statistiche server, timestamp, campi organizzati
- 🌈 **Palette Colori**: Purple (#8A2BE2) per benvenuti, Red (#FF6B6B) per addii
- 📱 **Responsive Design**: Ottimizzazione per tutti i dispositivi Discord
- 🎯 **Branding Consistente**: Identità visiva MinfoAi in tutti i messaggi

### Caratteristiche Embed Style:
• **Author**: Logo e nome bot MinfoAi  
• **Title**: Titoli descrittivi con emoji  
• **Description**: Testo formattato con markdown  
• **Fields**: Informazioni organizzate in colonne  
• **Thumbnail**: Avatar utente dinamico  
• **Image**: Banner personalizzati per contesto  
• **Footer**: Informazioni aggiuntive e timestamp  
• **Color**: Palette cromatica premium

## Funzionalità

### 🎉 Sistema Benvenuto/Addio
• **Messaggi di Benvenuto**: Messaggi embed premium automatici quando un nuovo membro si unisce al server  
• **Messaggi di Addio**: Messaggi embed personalizzati quando un membro lascia il server  
• **Configurazione Dashboard**: Canali personalizzabili tramite dashboard interattiva `/setbot`  
• **Logging Avanzato**: Registrazione dettagliata degli eventi con informazioni complete del membro  
• **Embeds Premium**: Messaggi ricchi con avatar, statistiche server, timestamp e design moderno  
• **Gestione Errori**: Gestione robusta degli errori con logging personalizzato  
• **Controllo Permessi**: Verifica automatica dei permessi del bot prima dell'invio messaggi  
• **Statistiche Real-time**: Contatori membri, utenti online, boost server  
• **Design Responsivo**: Ottimizzato per desktop e mobile Discord

#### Configurazione
**Tutti i canali (benvenuto, addio, log) vengono configurati esclusivamente tramite la dashboard `/setbot`**. Non sono più necessarie variabili d'ambiente per i canali.

#### Stile Embed Premium Implementato
• **Welcome Embed**: Purple premium (#8A2BE2) con statistiche server, avatar utente, link utili  
• **Goodbye Embed**: Warm red (#FF6B6B) con tempo trascorso, ricordi condivisi, statistiche

## 🎛️ Dashboard & Configurazione Interattiva
MinfoAi include una dashboard interattiva completa accessibile tramite il comando `/setbot` che permette di configurare tutte le funzionalità del bot in modo semplice e intuitivo.

### 🚀 Comando /setbot
Il comando `/setbot` apre una dashboard ephemeral (visibile solo all'utente che la richiede) con sfondo azzurro chiaro, contenente:
• Embed principale con descrizione delle categorie disponibili  
• SelectMenu per scegliere la categoria da configurare  
• Bottoni per aggiornare la dashboard o richiedere aiuto

#### Categorie Configurabili:
1. **👋 Benvenuti**
   - Imposta canale di benvenuto
   - Personalizza messaggio con variabili dinamiche
   - Configura colore embed
   - Abilita ruolo automatico al join
   - Attiva/disattiva immagini di benvenuto
   - Test messaggio

2. **👋 Addii**
   - Imposta canale di addio
   - Personalizza messaggio di addio
   - Configura colore embed
   - Test messaggio

3. **🎵 Musica**
   - Imposta canale comandi musicali
   - Configura volume predefinito
   - Abilita/disabilita modo DJ
   - Imposta limiti coda per utente

4. **🛡️ Moderazione**
   - Abilita auto-moderazione (anti-spam/flood)
   - Configura filtro parole proibite
   - Imposta canale log moderazione
   - Configura sistema warn progressivo

5. **🎮 Gamification**
   - Abilita sistema XP e livelli
   - Configura ruoli reward per livello
   - Imposta canale annunci level-up
   - Configura boost XP
   - Personalizza leaderboard

6. **🎁 Giveaway**
   - Crea nuovo giveaway
   - Imposta canale default giveaway
   - Configura ruolo ping notifiche
   - Imposta requisiti partecipazione
   - Visualizza giveaway attivi

### 🔧 Struttura File Dashboard
```
src/
├── commands/
│   └── setbot.js          # Comando slash principale /setbot
└── interactions/
    ├── interactionHandler.js  # Gestore centrale interazioni
    └── setbot/
        ├── welcome.js         # Handler configurazione benvenuti
        ├── goodbye.js         # Handler configurazione addii
        ├── music.js           # Handler configurazione musica
        ├── moderation.js      # Handler configurazione moderazione
        ├── gamification.js    # Handler configurazione gamification
        └── giveaway.js        # Handler configurazione giveaway
```

### 💡 Caratteristiche Dashboard
• **Messaggi Ephemeral**: Tutti i messaggi della dashboard sono visibili solo all'utente che la richiede (sfondo azzurrino)  
• **Navigazione Intuitiva**: SelectMenu e bottoni per navigare facilmente tra le categorie  
• **Configurazione Real-time**: Le modifiche vengono salvate automaticamente nel database  
• **Stato Visibile**: Ogni categoria mostra lo stato attuale della configurazione  
• **Bottone "Torna Indietro"**: Presente in ogni sotto-menu per tornare al menu principale  
• **Variabili Dinamiche**: Supporto per variabili come {user}, {username}, {server}, {memberCount}  
• **Anteprima**: Possibilità di testare le configurazioni prima di attivarle

### 🎨 Stile Embed Dashboard
Ogni categoria ha un colore distintivo:
• **Benvenuti**: Verde primavera (#00FF7F)  
• **Addii**: Rosso (#FF4444)  
• **Musica**: Viola (#9B59B6)  
• **Moderazione**: Rosso scuro (#E74C3C)  
• **Gamification**: Giallo oro (#F1C40F)  
• **Giveaway**: Rosa (#E91E63)  
• **Dashboard principale**: Blu Discord (#5865F2)

### 📝 Esempio Utilizzo
1. Utente esegue `/setbot`
2. Appare messaggio ephemeral con dashboard principale
3. Utente seleziona "Benvenuti" dal SelectMenu
4. Si apre nuovo messaggio ephemeral con opzioni di configurazione benvenuto
5. Utente configura canale, messaggio, colori, ecc.
6. Clicca "Torna Indietro" per tornare al menu principale
7. Seleziona altra categoria per continuare la configurazione

### ⚙️ Requisiti Permessi
• Solo **Amministratori** possono utilizzare il comando `/setbot`  
• Verifica automatica permessi prima dell'esecuzione

## Requisiti
• Node.js >= 18  
• Token Discord Bot (DISCORD_TOKEN)  
• MongoDB URI (MONGODB_URI)

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
   **Nota**: I canali di benvenuto, addio e log non vanno più configurati nel file `.env`. Usa la dashboard `/setbot` per configurarli.

3. Avvia in sviluppo:
   ```bash
   npm run dev
   ```
   Oppure in produzione:
   ```bash
   npm start
   ```

## 🎨 Embed Message Style Features

### Welcome Messages
• **Colore**: Purple Premium (#8A2BE2)  
• **Elementi**: Avatar utente, statistiche server, link utili  
• **Informazioni**: Data unione, membri totali, utenti online, boost  
• **Design**: Thumbnail utente, banner benvenuto, footer informativo

### Goodbye Messages
• **Colore**: Warm Red (#FF6B6B)  
• **Elementi**: Statistiche permanenza, ricordi condivisi  
• **Informazioni**: Giorni nel server, età account, data unione  
• **Design**: Messaggio emotivo, banner addio, footer personalizzato

### Logging System
• **Embeds Amministrativi**: Per tracking eventi interni  
• **Informazioni Dettagliate**: ID utente, timestamp, statistiche  
• **Colori Specifici**: Verde per join, rosso per leave

## 📝 Note Tecniche
• Tutti i messaggi del bot utilizzano esclusivamente Discord Embeds  
• Nessun messaggio di testo semplice viene inviato dal bot  
• Design premium e professionale per ogni interazione  
• Compatibilità completa con tutti i client Discord  
• Branding MinfoAi consistente in tutta l'esperienza utente  
• **Configurazione canali**: Completamente gestita tramite dashboard `/setbot` (non più via variabili d'ambiente)

---

MinfoAi - Bot Discord Premium con Embed Message Style avanzato e Dashboard Interattiva

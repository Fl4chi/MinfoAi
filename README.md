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
- **Author**: Logo e nome bot MinfoAi
- **Title**: Titoli descrittivi con emoji
- **Description**: Testo formattato con markdown
- **Fields**: Informazioni organizzate in colonne
- **Thumbnail**: Avatar utente dinamico
- **Image**: Banner personalizzati per contesto
- **Footer**: Informazioni aggiuntive e timestamp
- **Color**: Palette cromatica premium

## Funzionalità

### 🎉 Sistema Benvenuto/Addio
- **Messaggi di Benvenuto**: Messaggi embed premium automatici quando un nuovo membro si unisce al server
- **Messaggi di Addio**: Messaggi embed personalizzati quando un membro lascia il server
- **Configurazione Flessibile**: Canali personalizzabili tramite variabili d'ambiente
- **Logging Avanzato**: Registrazione dettagliata degli eventi con informazioni complete del membro
- **Embeds Premium**: Messaggi ricchi con avatar, statistiche server, timestamp e design moderno
- **Gestione Errori**: Gestione robusta degli errori con logging personalizzato
- **Controllo Permessi**: Verifica automatica dei permessi del bot prima dell'invio messaggi
- **Statistiche Real-time**: Contatori membri, utenti online, boost server
- **Design Responsivo**: Ottimizzato per desktop e mobile Discord

#### Configurazione Variabili Ambiente (Benvenuto/Addio)
```env
# Canale per messaggi di benvenuto
WELCOME_CHANNEL_ID=123456789
# Canale per messaggi di addio  
GOODBYE_CHANNEL_ID=123456789
# Canale per i log degli eventi
LOG_CHANNEL_ID=123456789
```

#### Stile Embed Premium Implementato
- **Welcome Embed**: Purple premium (#8A2BE2) con statistiche server, avatar utente, link utili
- **Goodbye Embed**: Warm red (#FF6B6B) con tempo trascorso, ricordi condivisi, statistiche
- **Log Embed**: Colori specifici per tracking amministrativo eventi
- **Design Elements**: Thumbnails, banners, footer informativi, timestamp dinamici

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

## 🎨 Embed Message Style Features

### Welcome Messages
- **Colore**: Purple Premium (#8A2BE2)
- **Elementi**: Avatar utente, statistiche server, link utili
- **Informazioni**: Data unione, membri totali, utenti online, boost
- **Design**: Thumbnail utente, banner benvenuto, footer informativo

### Goodbye Messages  
- **Colore**: Warm Red (#FF6B6B)
- **Elementi**: Statistiche permanenza, ricordi condivisi
- **Informazioni**: Giorni nel server, età account, data unione
- **Design**: Messaggio emotivo, banner addio, footer personalizzato

### Logging System
- **Embeds Amministrativi**: Per tracking eventi interni
- **Informazioni Dettagliate**: ID utente, timestamp, statistiche
- **Colori Specifici**: Verde per join, rosso per leave

## 📝 Note Tecniche

- Tutti i messaggi del bot utilizzano **esclusivamente Discord Embeds**
- **Nessun messaggio di testo semplice** viene inviato dal bot
- Design **premium e professionale** per ogni interazione
- **Compatibilità completa** con tutti i client Discord
- **Branding MinfoAi** consistente in tutta l'esperienza utente

---

*MinfoAi - Bot Discord Premium con Embed Message Style avanzato*

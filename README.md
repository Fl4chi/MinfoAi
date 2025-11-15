# 🤝 MinfoAI v4.0 - Partnership Bot

[![version](https://img.shields.io/badge/version-4.0.0-blue)](https://github.com/Fl4chi/MinfoAi)
[![node.js](https://img.shields.io/badge/node.js-18+-green)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)

> Bot Discord moderno con sistema partnership innovativo - Semplice, veloce ed efficace

## 📋 Indice
- [Overview](#overview)
- [Caratteristiche](#caratteristiche)
- [Installazione](#installazione)
- [Comandi](#comandi)
- [Sistema Coins](#sistema-coins)
- [Configurazione](#configurazione)

## 🎯 Overview

MinfoAI v4.0 è stato completamente ridisegnato per concentrarsi sul sistema partnership. Abbiamo rimosso la complessità di SkyForce e creato un bot **10x più semplice e veloce**.

### Perché v4.0?
- ❌ SkyForce: 3 partnership ogni 3 giorni = LENTO
- ✅ MinfoAI v4.0: 1 partnership ogni 2 ore = VELOCE
- ❌ SkyForce: Setup complesso con chain obbligatorie
- ✅ MinfoAI v4.0: Setup in 2 minuti, zero configurazione
- ❌ SkyForce: Coins inutili senza valore
- ✅ MinfoAI v4.0: Coins con rewards reali e spendibili

## ✨ Caratteristiche

### 🚀 Setup Velocissimo
- ⏱️ **2 minuti** per iniziare (vs 30 minuti di SkyForce)
- 🎯 Solo **3 campi** da compilare
- ❌ **Zero prerequisiti** (no 100+ membri richiesti)
- ✅ **Attivazione immediata**

### 🤖 Automazione Completa
- 🔄 **Auto-send**: Partnership automatiche ogni 2 ore
- ✅ **Auto-accept**: Accetta automaticamente partnership di qualità
- 🎯 **Smart matching**: Algoritmo intelligente per trovare server compatibili
- 📊 **Analytics real-time**: Statistiche sempre aggiornate

### 💰 Sistema Coins
Guadagna coins quando gli utenti:
- 👤 Entrano nel tuo server tramite partnership: **+1 coin**
- 💬 Rimangono attivi (5+ messaggi): **+1 coin/settimana**
- 🎖️ Ricevono ruoli: **+5 coins**
- ⏰ Rimangono 7 giorni: **+10 coins**
- 🏆 Rimangono 30 giorni: **+50 coins**

### 🎁 Usa i Coins Per
- 🚀 **Partnership Boost** (50 coins): Ricevi 2-3x più partnership
- 🎖️ **Badge Verified Partner** (100 coins): Badge esclusivo
- ⚡ **2x Coins Multiplier** (200 coins): Guadagna il doppio per 7 giorni
- ⭐ **Featured Listing** (300 coins): In homepage del bot per 3 giorni
- 🏅 **Leaderboard Top 50** (500 coins): Visibilità globale

## 📦 Installazione

### Requisiti
- Node.js 18+
- MongoDB (locale o Atlas)
- Bot Discord token

### Setup Rapido
```bash
# Clona repository
git clone https://github.com/Fl4chi/MinfoAi.git
cd MinfoAi

# Installa dipendenze
npm install

# Configura .env
cp .env.example .env
# Modifica .env con i tuoi dati

# Avvia bot
npm start
```

### Configurazione .env
```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id
MONGODB_URI=mongodb://localhost:27017/minfoai
```

## 🎮 Comandi

### `/partner-setup`
🔧 Setup iniziale (2 minuti)
```
Parametri:
- canale: Canale per ricevere partnerships
- descrizione: Descrivi il tuo server (max 200 caratteri)
- categoria: Gaming/Comunità/Studio/Creatività/Altro
```

### `/partner-send`
📤 Invia partnership manualmente
- Cooldown: 2 ore
- Trova automaticamente server compatibili
- Invia embed professionale

### `/partner-auto [on/off]`
🤖 **NOVITÀ**: Automazione completa
- Attiva/disattiva auto-send
- Partnership automatiche ogni 2-4 ore
- Crescita 24/7 passiva

### `/partner-stats`
📊 Dashboard statistiche
Mostra:
- Partnership inviate/ricevute oggi
- Utenti raggiunti (stima)
- Tier attuale (Basic/Growth/Premium)
- Prossima partnership disponibile
- Crescita membri (% vs settimana scorsa)

### `/partner-preferences`
⚙️ Gestisci preferenze
- 🤖 Auto-accept: ON/OFF
- 🔔 Notifiche: ON/OFF
- ⏸️ Pausa: ON/OFF
- 🎯 Categoria preferita
- 👤 Min membri partner

### `/partner-blacklist`
🚫 Blocca/sblocca server (max 10)
```
/partner-blacklist add [server-id]  # Blocca
/partner-blacklist remove [server-id]  # Sblocca
/partner-blacklist list  # Mostra lista
```

## 🏆 Sistema Tier

### Basic (Gratuito)
- 1 partnership ogni 2 ore (12/giorno)
- Stats basiche
- Tracking coins

### Growth (50 coins O €1.99/mese)
- 1 partnership ogni 1 ora (24/giorno) - **2x veloce**
- +20% coins guadagnati
- Featured 3 giorni/mese

### Premium (200 coins O €4.99/mese)
- 1 partnership ogni 30 min (48/giorno) - **4x veloce**
- +50% coins guadagnati
- Featured 7 giorni/mese
- API access + Webhook
- Partnership insurance

## 🛠️ Tecnologie

- **Discord.js v14**: API Discord moderna
- **MongoDB**: Database NoSQL per scalabilità
- **Node-cron**: Automazione partnerships
- **Mongoose**: ODM per MongoDB

## 📁 Struttura Progetto

```
MinfoAi/
├── src/
│   ├── commands/
│   │   └── partnership/
│   │       ├── setup.js
│   │       ├── send.js
│   │       ├── auto.js
│   │       ├── stats.js
│   │       ├── preferences.js
│   │       └── blacklist.js
│   ├── database/
│   │   ├── connection.js
│   │   └── partnershipSchema.js
│   ├── handlers/
│   │   ├── partnershipHandler.js
│   │   ├── commandHandler.js
│   │   └── eventHandler.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── guildMemberAdd.js
│   ├── utils/
│   │   ├── embedBuilder.js
│   │   └── logger.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Deploy

### Deploy su VPS
```bash
# Con PM2
npm install -g pm2
pm2 start src/index.js --name minfoai
pm2 save
```

### Deploy su Heroku
```bash
heroku create minfoai-bot
heroku addons:create mongolab
git push heroku main
```

## 📝 Changelog

### v4.0.0 (15 Nov 2025) - MAJOR RELEASE
- ✅ Sistema partnership completamente ridisegnato
- ✅ Rimosso AI e features complesse
- ✅ Aggiunto auto-send partnerships
- ✅ Aggiunto sistema coins con rewards reali
- ✅ Cooldown ridotto a 2 ore (da 3 giorni)
- ✅ Setup semplificato (2 minuti)
- ✅ Smart matching algorithm
- ✅ Auto-accept intelligente
- ✅ Dashboard statistics
- ✅ Sistema tier (Basic/Growth/Premium)

## 🤝 Supporto

- 📧 Email: fl4chi@example.com
- 💬 Discord: [Server di supporto](#)
- 🐛 Issues: [GitHub Issues](https://github.com/Fl4chi/MinfoAi/issues)

## 📄 Licenza

MIT License - Vedi [LICENSE](LICENSE) per dettagli

## 🙏 Credits

Creato da **Fl4chi** con ❤️

Ispirato da SkyForce ma **10x migliore**

---

⭐ Se ti piace questo progetto, lascia una star su GitHub!

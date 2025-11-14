# MinfoAi Installation & Setup Guide

Guida completa per l'installazione e configurazione di MinfoAi con il nuovo sistema AI e database MongoDB.

## Prerequisiti

- Node.js >= 18.0.0
- MongoDB (Cloud Atlas o locale)
- Discord Bot Token
- HuggingFace API Key (opzionale, per AI open-source)

## Passo 1: Clone del Repository

```bash
git clone https://github.com/Fl4chi/MinfoAi.git
cd MinfoAi
npm install
```

## Passo 2: Configurazione delle Variabili Ambientali

Copia il file `.env.updated` in `.env` e compila con i tuoi dati:

```bash
cp .env.updated .env
```

Edita `.env` con i tuoi valori:

```env
DISCORD_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/minfoai
AI_MODEL=huggingface
HUGGINGFACE_API_KEY=your_api_key_here
```

## Passo 3: Setup di MongoDB

### Opzione A: MongoDB Atlas (Cloud)

1. Visita [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un account gratuito
3. Crea un nuovo cluster M0 (free tier)
4. Copia la connection string
5. Aggiungi al file `.env`

### Opzione B: MongoDB Locale

```bash
# Windows
mongo

# Linux/Mac
mongod
```

La stringa di connessione sarà: `mongodb://localhost:27017/minfoai`

## Passo 4: Installazione delle Dipendenze

```bash
npm install discord.js mongoose langchain
npm install langchain @langchain/core @langchain/community
```

## Passo 5: Avvio del Bot

### Development

```bash
npm run dev
```

### Production

```bash
node src/index.js
```

## Verifica dell'Installazione

1. Bot dovrebbe apparire online su Discord
2. Prova il comando `/help` nel server
3. Controlla i log per verificare:
   - Connessione MongoDB OK
   - Caricamento moduli AI OK
   - Bot pronto per i comandi

## Troubleshooting

### Errore: "DISCORD_TOKEN is not set"
- Verifica che il file `.env` esista
- Controlla che DISCORD_TOKEN sia presente

### Errore: "Cannot connect to MongoDB"
- Verifica la MONGODB_URI nel `.env`
- Controlla che MongoDB sia in esecuzione
- Per Atlas: aggiungi il tuo IP alla whitelist

### Errore: "AI model not found"
- Verifica la HuggingFace API Key
- Assicurati che AI_MODEL sia set correttamente

## Funzionalità Nuove

### Database Strutturato
Ogni utente ha un profilo dettagliato con:
- Stats di gamification (XP, level, coins)
- Storico AI interactions
- Log attività
- Moderation data
- Preferenze personalizzate

### AI Intelligente
- Memoria conversazionale
- Profilazione utente
- Analisi sentiment
- Integrazione LangChain
- Supporto modelli open-source (HuggingFace)

## Comandi Utili

```bash
# Mostra i log
npm run logs

# Deployment su produzione
npm run deploy

# Lint e formato codice
npm run lint
```

## Supporto e Documentazione

Per ulteriori informazioni vedi:
- [README.md](README.md) - Overview del progetto
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment avanzato
- [GUILDCONFIG_IMPLEMENTATION.md](GUILDCONFIG_IMPLEMENTATION.md) - Configurazione guild

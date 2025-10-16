# MinfoAi

Un bot Discord completo, semplice da configurare e pronto all’uso. MinfoAi offre moderazione avanzata, livelli/XP, welcome/goodbye con anteprime, gestione permessi, info server, giveaway, musica, verifica utenti, automazioni, moduli AI, e una UI in‑chat (Setbot) per configurare tutto senza dashboard esterne.

---

## ✨ Panoramica
- Obiettivo: fornire un assistente all‑in‑one con comandi chiari e una “dashboard” in‑chat che consente a chiunque di impostare il bot in pochi clic.
- Punti di forza: semplicità, sicurezza, performance, UX pulita e messaggi in Embed coerenti.
- Architettura: bot Discord.js + moduli modulari, persistenza configurazioni su file/DB, job scheduler, handler eventi/command, supporto cog-based (struttura a moduli caricabili).

---

## 📦 Requisiti
- Node.js 18+ (consigliato LTS)
- NPM o PNPM
- Un bot Discord con token e privilegi di intent adeguati (SERVER MEMBERS, MESSAGE CONTENT se richiesto dai moduli)
- Opzionale: chiavi API per moduli AI/Musica (es. OpenAI, ElevenLabs, YouTube/Spotify), provider immagini (Unsplash) e servizi antispam

---

## 🚀 Setup rapido
1) Clona il repo
```
git clone https://github.com/Fl4chi/MinfoAi
cd MinfoAi
```
2) Installa le dipendenze
```
npm install
```
3) Configura l’ambiente
- Copia .env.example in .env e compila:
```
DISCORD_TOKEN=...
CLIENT_ID=...
GUILD_ID=...(opzionale per comandi guild)
DATABASE_URL=...(se usi DB)
OPENAI_API_KEY=...(se usi moduli AI)
YOUTUBE_API_KEY=...(modulo musica)
```
4) Avvia in sviluppo
```
npm run dev
```
5) Avvia in produzione
```
npm run build && npm start
```

---

## 🧩 Struttura del progetto (cog-based)
- src/
  - index.ts/js: bootstrap client, handler eventi, registrazione comandi
  - commands/: comandi slash e messaggio, strutturati per modulo
  - modules/ (cogs): ogni cartella è un modulo caricabile/disattivabile
    - moderation/
    - xp/
    - welcome/
    - goodbye/
    - music/
    - giveaway/
    - verification/
    - info/
    - automations/
    - ai/
  - config/: schema, validazione, default
  - services/: integrazioni esterne (API), storage, scheduler
  - utils/: helper comuni (embeds, paginazione, permessi)

Ogni “cog” esporta:
- data: metadati (nome, descrizione, permessi richiesti)
- enable/disable: lifecycle per attivazione
- commands[]: definizioni e handler
- events[]: listener dedicati

---

## 🔧 Configurazione in‑chat (Setbot)
- /setbot apri la UI in‑chat con embed, pulsanti e select menu
- Sezioni configurabili: canali, ruoli, permessi, messaggi template, limiti rate, azioni auto, preferenze moduli
- Salvataggio immediato con conferma e anteprima messaggi (welcome/goodbye)

---

## 🧠 Moduli e funzionalità dettagliate
1) Welcome & Goodbye
- Messaggi embedded personalizzabili (testo, immagine, colore, mention, DM opzionali)
- Image banner dinamico (avatar utente, nome server) se abilitato
- Log di join/leave in canale staff

2) Moderazione
- /ban, /kick, /mute, /timeout, /warn, /clear con motivi, durate, prove
- Automod: anti‑spam, anti‑link, anti‑caps, filtri parole, slowmode mirato
- Case system: ID caso, log, export CSV/JSON

3) Verifica utenti
- Ruolo “Verified”, captcha/quiz, DM onboarding, scadenze

4) XP/Leveling (Gamification)
- XP per messaggi/voice, antispam XP
- Premi ruolo automatici per soglie livello
- Leaderboard con paginazione

5) Giveaway
- Creazione, durata, numero vincitori, reroll, requisiti (ruolo, presenza)
- Annunci automatici, DM ai vincitori, storicizzazione

6) Musica
- Play/queue/skip/stop/loop, supporto YouTube/Spotify links
- Filtro volume, auto‑leave, salvataggio playlist server

7) Info & Utility
- /serverinfo, /userinfo, /roleinfo, /botinfo
- Poll, reminders, afk, role menus, reaction roles

8) Automazioni
- Ruoli auto su join, saluti automatici, messaggi ricorrenti (scheduler)
- Backup configurazioni, esportazione/importazione

9) Moduli AI
- /ask, /summarize, /translate, /image, /tts (in base alle chiavi API)
- Moderazione contenuti AI‑assistita (classificatori)

---

## 🧪 Esempi di utilizzo (Slash commands)
- /setbot → apre la dashboard in‑chat
- /welcome set channel:#benvenuto message:"Ciao {user}!" image:"url" color:#00A3FF
- /goodbye set channel:#arrivederci message:"{user} ha lasciato"
- /moderation ban @utente reason:"spam"
- /xp leaderboard
- /giveaway start duration:1d winners:2 prize:"Nitro"
- /music play query:"lofi"
- /ai ask prompt:"Spiega come funziona MinfoAi"

Placeholder support comuni:
- {user} {user_id} {server} {member_count} {channel}

---

## 🛠️ Troubleshooting
- Bot non risponde ai comandi:
  - Controlla DISCORD_TOKEN e intent nel Developer Portal
  - Assicurati che i comandi slash siano registrati (log avvio). Se serve, re‑deploy commands.
- Errori musica:
  - Verifica YOUTUBE_API_KEY o provider player; problemi regionali possono impedire playback
- Permessi mancanti:
  - Il bot deve avere permessi su canali target (Send Messages, Embed Links, Manage Roles se necessario)
- Timeout/ratelimit:
  - Riprova o aumenta backoff; verifica antispam interno

Log e diagnostica:
- Avvia con DEBUG=1 per log verbosi; usa /debug per stato moduli

---

## ❓ FAQ
- Posso usare il bot senza dashboard web?
  Sì, la dashboard è in‑chat (Setbot). Nessuna pagina esterna richiesta.
- Posso disattivare moduli?
  Sì, ogni cog è abilitabile/disabilitabile e caricabile a caldo ove supportato.
- Supporta più server?
  Sì, configurazioni per‑guild con fallback globali.
- Serve Message Content intent?
  Solo per alcune feature (es. XP per messaggi non‑slash); valutare privacy.

---

## 🧱 Sicurezza e permessi
- Principio del minimo privilegio: concedi solo ciò che serve
- Sanitizzazione input, rate limit per utente/canale, audit dei comandi critici

---

## 🗂️ Note sulla Dashboard (in‑chat)
- Navigazione a schede: Welcome, Moderazione, XP, Musica, Giveaway, Verifica, AI, Automazioni, Impostazioni
- Componenti: Buttons, SelectMenu, Modal per testi lunghi, Preview live
- Undo/Redo configurazioni recenti, conferme prima di azioni impattanti (es. purge)

---

## 🧩 Estendibilità
- Aggiungere un nuovo modulo:
  1. Crea src/modules/nuovoModulo/
  2. Esporta data, enable/disable, commands[], events[]
  3. Registra il cog in src/index e in config

---

## 🏗️ Deployment
- Guide in DEPLOYMENT.md (PM2/Docker, variabili ambiente, healthcheck)
- Migrazioni DB con script npm

---

## 🤝 Contributi
- Issue e PR sono benvenuti. Segui il template e la guida di stile.

## 📜 Licenza
- MIT (o vedi LICENSE se presente)

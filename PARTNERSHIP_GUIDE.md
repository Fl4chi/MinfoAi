# MinfoAi Partnership System Guide

## Overview

MinfoAi Partnership è un sistema avanzato che permette ai server Discord di collaborare e costruire network di comunità con vantaggi esclusivi, condivisione di ban list e analytics.

## Partnership Tiers

### Bronze (Gratuito)
- Bonus XP: 5%
- Bonus Coins: 3%
- Referral Tracking
- Ban List Sharing
- Basic Analytics

### Silver (Consigliato)
- Bonus XP: 10%
- Bonus Coins: 7%
- Cross-Server Events
- Exclusive Role
- Advanced Analytics

### Gold (Pro)
- Bonus XP: 15%
- Bonus Coins: 12%
- Priority Support
- Custom Branding
- Special Badge

### Platinum (Elite)
- Bonus XP: 25%
- Bonus Coins: 20%
- Dedicated Manager
- Network Priority
- Custom Prefix

## Come Richiedere una Partnership

1. **Invia Richiesta**
   ```
   /partnership request [server_id_partner] [description]
   ```

2. **Completa il Form**
   - Nome Server
   - Icona Server
   - Descrizione
   - Numero Membri
   - Link Invito

3. **Attendi Approvazione**
   - Un admin esaminerà la richiesta
   - Riceverai notifica di accettazione/rifiuto

4. **Accetta Termini**
   - Leggi l'agreement di partnership
   - Conferma accettazione

## Funzionalità

### Ban List Sharing
Condividi la lista di ban tra server partner per proteggere la comunità:
- Tracking automatico di ban condivisi
- Verifica automatica di nuovi membri
- Sincronizzazione in tempo reale

### Referral System
Guadagna bonus quando inviti utenti da server partner:
- 50 coins per referral completato
- Tracking di conversioni
- Analytics dettagliati

### Cross-Server Events
Organizza eventi con server partner:
- Giveaway condivisi
- Competizioni
- Community Hangout

### Trust Score
Ogni partnership ha un trust score (0-100):
- Inizio: 50
- Violazioni: -5 (low), -15 (medium), -30 (high)
- Auto-sospensione sotto 20

## Partnership Management

### Comandi

```
# Visualizza partnership attive
/partnership list

# Dettagli partnership
/partnership info [partnership_id]

# Analytics
/partnership analytics [partnership_id]

# Gestione ban
/partnership ban-share [user_id] [reason]

# Termina partnership
/partnership end [partnership_id] [reason]

# Report violazione
/partnership report [partnership_id] [violation_type] [description]
```

## Best Practices

1. **Comunicazione**
   - Comunica con il partner prima di azioni importanti
   - Scambia contatti dei staff
   - Organizza riunioni periodiche

2. **Ban List Sharing**
   - Condividi solo ban legittimi
   - Includi sempre evidenza
   - Documenta bene il motivo

3. **Community Growth**
   - Promuovi partner nei canali appropriati
   - Organizza eventi congiunti
   - Scambia contenuti

4. **Violazioni da Evitare**
   - Spam nei server partner
   - Ban list non autorizzati
   - Conflitti tra staff
   - Abuso di bonus

## Cosa Accade in Caso di Violazione

- **Warning**: First violation - notifica
- **Mute**: Second violation - sospensione 24h
- **Suspension**: Trust < 20 - sospensione automatica
- **Termination**: Violazioni gravi - fine partnership

## Support

Per aiuto con le partnership:
- Join nostro support server
- Contatta un admin
- Usa `/help partnership`

## FAQ

**Q: Quanti partner posso avere?**
A: Illimitati, ma consigliamo 5-10 per qualità

**Q: Posso cambiare tier?**
A: Sì, contatta admin per upgrade/downgrade

**Q: Cosa succede se il partner si dissolve?**
A: Partnership finisce automaticamente

**Q: Posso celare una partnership?**
A: No, tutte le partnership sono pubbliche

**Q: Quali sono i vantaggi per i miei utenti?**
A: XP/Coins bonus, accesso a server partner, eventi esclusivi

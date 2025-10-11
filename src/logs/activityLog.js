const fs = require('fs');
const path = require('path');

// Path per il file di log delle attività
const LOG_FILE_PATH = path.join(__dirname, 'activity.jsonl');

/**
 * Inizializza il file di log se non esiste
 */
function initLogFile() {
    if (!fs.existsSync(LOG_FILE_PATH)) {
        fs.writeFileSync(LOG_FILE_PATH, '', 'utf8');
        console.log('[ActivityLog] File di log inizializzato:', LOG_FILE_PATH);
    }
}

/**
 * Registra un'attività nel log
 * @param {string} type - Tipo di attività (es. 'command', 'event', 'error')
 * @param {string} action - Azione specifica eseguita
 * @param {Object} details - Dettagli aggiuntivi dell'attività
 */
function logActivity(type, action, details = {}) {
    try {
        initLogFile();

        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            action,
            details,
            user: details.userId || details.username || 'System',
            guild: details.guildId || details.guildName || 'Global'
        };

        // Aggiungi una riga JSONL (JSON Lines)
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(LOG_FILE_PATH, logLine, 'utf8');

        // Log opzionale in console per debugging
        if (process.env.DEBUG_LOGS === 'true') {
            console.log('[ActivityLog]', logEntry);
        }
    } catch (error) {
        console.error('[ActivityLog] Errore durante la scrittura del log:', error);
    }
}

/**
 * Legge tutte le attività dal log
 * @param {number} limit - Numero massimo di attività da leggere (default: tutte)
 * @param {string} filterType - Filtra per tipo di attività (opzionale)
 * @returns {Array} Array di oggetti log
 */
function readActivities(limit = null, filterType = null) {
    try {
        initLogFile();

        if (!fs.existsSync(LOG_FILE_PATH)) {
            return [];
        }

        const fileContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        let activities = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                console.error('[ActivityLog] Errore parsing riga:', e);
                return null;
            }
        }).filter(entry => entry !== null);

        // Filtra per tipo se specificato
        if (filterType) {
            activities = activities.filter(activity => activity.type === filterType);
        }

        // Limita il numero di risultati se specificato
        if (limit && limit > 0) {
            activities = activities.slice(-limit);
        }

        return activities;
    } catch (error) {
        console.error('[ActivityLog] Errore durante la lettura del log:', error);
        return [];
    }
}

/**
 * Cancella il log delle attività
 * @param {boolean} backup - Se true, crea un backup prima di cancellare
 */
function clearLog(backup = true) {
    try {
        if (backup && fs.existsSync(LOG_FILE_PATH)) {
            const backupPath = path.join(
                __dirname,
                `activity_backup_${Date.now()}.jsonl`
            );
            fs.copyFileSync(LOG_FILE_PATH, backupPath);
            console.log('[ActivityLog] Backup creato:', backupPath);
        }

        fs.writeFileSync(LOG_FILE_PATH, '', 'utf8');
        console.log('[ActivityLog] Log cancellato');
        return true;
    } catch (error) {
        console.error('[ActivityLog] Errore durante la cancellazione del log:', error);
        return false;
    }
}

/**
 * Ottieni statistiche sulle attività
 * @returns {Object} Oggetto con statistiche
 */
function getStats() {
    try {
        const activities = readActivities();
        const stats = {
            total: activities.length,
            byType: {},
            lastActivity: activities.length > 0 ? activities[activities.length - 1] : null,
            firstActivity: activities.length > 0 ? activities[0] : null
        };

        activities.forEach(activity => {
            if (!stats.byType[activity.type]) {
                stats.byType[activity.type] = 0;
            }
            stats.byType[activity.type]++;
        });

        return stats;
    } catch (error) {
        console.error('[ActivityLog] Errore durante il calcolo delle statistiche:', error);
        return { total: 0, byType: {}, lastActivity: null, firstActivity: null };
    }
}

module.exports = {
    logActivity,
    readActivities,
    clearLog,
    getStats,
    initLogFile
};

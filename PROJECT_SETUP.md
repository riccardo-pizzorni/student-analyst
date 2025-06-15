# Project Setup and Deployment Guide (Aggiornato)

## Variabili d'Ambiente

### Variabili richieste (prefisso VITE_)
- `VITE_DEBUG_MODE`: Abilita/disabilita la modalità debug (es: true)
- `VITE_API_TIMEOUT`: Timeout per le chiamate API (es: 20000)
- `VITE_APIKey_ALPHA_VANTAGE`: Chiave API Alpha Vantage (es: W85EESBOTZMGP1M)
- `VITE_BACKEND_URL`: URL del backend (es: https://student-analyst.onrender.com)

### Dove configurarle
- **Vercel**: Settings > Environment Variables (puoi importare un file .env o aggiungerle manualmente)
- **Render**: Environment > Add Environment Variable

## Deployment Platforms

### Vercel
- Usato per il frontend
- Deploy automatico da GitHub (ramo master/main)
- Variabili d'ambiente da configurare come sopra
- Puoi importare direttamente un file `.env`
- Build command: `npm run build`
- Output directory: `.next` (per Next.js) o `dist` (per Vite)

### Render
- Usato per il backend (e/o frontend se necessario)
- Deploy automatico da GitHub
- Possibilità di rollback alle versioni precedenti direttamente dalla dashboard
- L'istanza gratuita va in sleep dopo inattività, causando un ritardo al primo accesso
- URL del backend da usare come variabile d'ambiente nel frontend

## GitHub Repository
- Branch principale: `master` (o `main`)
- Deploy automatici su push
- Protezione branch consigliata

## Note pratiche
- Se il sito non si aggiorna dopo un push:
  - Controlla che il deploy sia partito su Vercel/Render
  - Verifica che le variabili d'ambiente siano corrette e aggiornate
  - Se serve, fai rollback o ridisconnetti/riconnetti il repo
- Se usi istanze gratuite su Render, considera il ritardo dovuto allo sleep
- Puoi vedere i log di deploy e fare troubleshooting direttamente dalle dashboard di Vercel e Render
- L'URL del backend (Render) va inserito come variabile d'ambiente nel frontend (Vercel)

## Troubleshooting
1. **Deploy non aggiornato**:
   - Controlla la connessione GitHub
   - Verifica variabili d'ambiente
   - Consulta i log di build
   - Prova a ridisconnettere e riconnettere il repo
2. **API non funzionanti**:
   - Verifica la chiave API
   - Controlla la variabile `VITE_BACKEND_URL`
   - Consulta i log del backend su Render
3. **Build fallita**:
   - Controlla errori TypeScript o dipendenze mancanti
   - Verifica tutte le variabili d'ambiente
   - Consulta i log di build

---

**Questa documentazione è aggiornata con le informazioni reali di deploy e configurazione viste nelle dashboard di Vercel e Render.** 
# 🤖 Ansluta Riksdag & Regering MCP till ChatGPT

En steg-för-steg guide för att koppla din Riksdag & Regering MCP-server till ChatGPT.

---

## ✅ Förhandskrav

- **ChatGPT Plus** eller **ChatGPT Pro** prenumeration
- MCP-servern måste vara live på: https://riksdag-regering-ai.onrender.com

---

## 📋 Steg 1: Aktivera MCP i ChatGPT

1. Öppna **ChatGPT** i din webbläsare: https://chat.openai.com
2. Klicka på din **profil** (nedre vänstra hörnet)
3. Välj **Settings** (Inställningar)
4. Gå till **Beta features** (Beta-funktioner)
5. Aktivera **"Model Context Protocol"**

![Enable MCP](https://placeholder-for-screenshot.png)

---

## 🔌 Steg 2: Lägg till MCP-servern

### Via ChatGPT Gränssnittet

1. Starta en ny konversation i ChatGPT
2. Klicka på **🔌 ikonen** (eller **"+" knappen** för nya verktyg)
3. Välj **"Add MCP Server"** eller **"Connect to MCP"**
4. Fyll i följande information:

```
Name: Riksdag & Regering
URL: https://riksdag-regering-ai.onrender.com/mcp
Authentication: None (lämna tom)
```

5. Klicka **"Save"** eller **"Connect"**

---

## 🧪 Steg 3: Testa Anslutningen

Skriv följande frågor till ChatGPT för att testa:

### Test 1: Lista verktyg
```
Vilka verktyg har du tillgång till från Riksdag & Regering?
```

**Förväntat svar:** ChatGPT ska lista alla 27 tillgängliga verktyg.

### Test 2: Sök propositioner
```
Kan du söka efter alla propositioner om klimat från riksåret 2024/25?
```

**Förväntat svar:** ChatGPT använder `riksdagen_search_documents` verktyget och returnerar relevanta propositioner.

### Test 3: Analysera voteringar
```
Analysera röstmönster för partier kring klimatfrågor under 2024
```

**Förväntat svar:** ChatGPT använder analysverktyg för att undersöka röstdata.

---

## 📚 Exempel på Frågor

### 🔍 Sök och Hämta

```
- Sök alla propositioner om migration från 2024/25
- Hämta dokument med ID H901123
- Lista alla ledamöter från Socialdemokraterna
- Sök debatter om skolan från senaste riksmötet
```

### 📊 Analys

```
- Analysera hur Moderaterna röstat i klimatfrågor 2024
- Jämför partiernas röstmönster kring invandring
- Visa statistik över propositioner per departement
- Analysera trender inom utbildningspolitik senaste året
```

### 🔬 Jämförelser

```
- Jämför Socialdemokraternas och Moderaternas röstmönster
- Analysera skillnader mellan Riksdagens och Regeringens förslag om klimat
- Jämför två ledamöters rösthistorik
```

### 🏛️ Regeringen

```
- Sök alla SOU-rapporter om vård
- Hämta proposition 2023/24:100
- Lista alla departementsserier från Finansdepartementet
- Analysera regeringens förslag inom miljöområdet
```

---

## 🛠️ Tillgängliga Verktyg (27 st)

### Riksdagen - Sök (5)
- `riksdagen_search_documents` - Sök dokument
- `riksdagen_search_debatter` - Sök debatter
- `riksdagen_search_voteringer` - Sök voteringar
- `riksdagen_search_personer` - Sök personer
- `riksdagen_search_ledamoter` - Sök ledamöter

### Riksdagen - Hämta (5)
- `riksdagen_fetch_document` - Hämta dokument med ID
- `riksdagen_fetch_debatt` - Hämta debatt med ID
- `riksdagen_fetch_votering` - Hämta votering med ID
- `riksdagen_fetch_person` - Hämta person med ID
- `riksdagen_fetch_ledamot` - Hämta ledamot med ID

### Riksdagen - Analys (6)
- `riksdagen_analyze_voting_patterns` - Analysera röstmönster
- `riksdagen_analyze_document_sentiment` - Sentiment-analys
- `riksdagen_analyze_party_distribution` - Partifördelning
- `riksdagen_analyze_member_activity` - Ledamotaktivitet
- `riksdagen_analyze_document_stats` - Dokumentstatistik
- `riksdagen_analyze_trends` - Trendanalys

### Riksdagen - Jämför (4)
- `riksdagen_compare_party_votes` - Jämför partiröstningar
- `riksdagen_compare_members` - Jämför ledamöter
- `riksdagen_compare_parties` - Jämför partier
- `riksdagen_compare_versions` - Jämför dokumentversioner

### Regeringen - Sök (3)
- `regeringen_search_propositioner` - Sök propositioner
- `regeringen_search_sou` - Sök SOU
- `regeringen_search_ds` - Sök Ds

### Regeringen - Hämta (3)
- `regeringen_fetch_proposition` - Hämta proposition
- `regeringen_fetch_sou` - Hämta SOU
- `regeringen_fetch_ds` - Hämta Ds

### Aggregate (1)
- `aggregate_riksdag_regering_data` - Aggregera data från båda källor

---

## 📖 Resurser (5 st)

ChatGPT har också tillgång till metadata-resurser:

- `riksdagen://dokument-types` - Dokumenttyper (prop, mot, etc.)
- `riksdagen://party-info` - Partiinformation
- `riksdagen://organ-info` - Organs-information
- `regeringen://dokument-types` - Regeringens dokumenttyper
- `api://info` - API-information och statistik

---

## ⚙️ Avancerade Inställningar

### Timeout
Om queries tar lång tid, kan du justera timeout:
```
Timeout: 30000ms (30 sekunder)
```

### Rate Limiting
Servern har rate limiting:
- **100 requests per 15 minuter** per IP-adress

---

## 🐛 Felsökning

### Problem: ChatGPT säger "Cannot connect to MCP server"

**Lösning:**
1. Kontrollera att URL:en är korrekt: `https://riksdag-regering-ai.onrender.com/mcp`
2. Testa manuellt med cURL:
   ```bash
   curl -X POST https://riksdag-regering-ai.onrender.com/mcp \
     -H "Content-Type: application/json" \
     -d '{"method":"tools/list"}'
   ```
3. Kolla server status: https://riksdag-regering-ai.onrender.com/health

### Problem: "Authentication required"

**Lösning:**
- Servern kräver **INGEN** autentisering
- Lämna **Authentication** fältet **tomt** eller välj **"None"**

### Problem: "Request timeout"

**Lösning:**
- Render free tier kan "sova" efter inaktivitet (första requesten tar 30-60s)
- Testa igen efter 1 minut
- Upgradera till betald plan för instant responses

### Problem: Verktyg visas inte

**Lösning:**
1. Koppla från och anslut igen
2. Starta en ny konversation
3. Skriv: "Vilka MCP-servrar är anslutna?"

---

## 🔐 Säkerhet & Integritet

### Vad delas med servern?
- **Endast data du explicit frågar om** skickas till MCP-servern
- Inga personliga uppgifter från ChatGPT-konversationen delas

### Är servern säker?
- ✅ HTTPS-krypterad kommunikation
- ✅ Öppen källkod: https://github.com/KSAklfszf921/Riksdag-Regering.AI
- ✅ Read-only access till offentliga data
- ✅ Ingen lagring av queries eller svar

### Data från offentliga källor
All data kommer från:
- **Sveriges Riksdag** (data.riksdagen.se)
- **Regeringskansliet** (regeringen.se)

Ingen privat eller känslig information exponeras.

---

## 💡 Tips & Tricks

### Kombinera flera verktyg
```
Sök alla propositioner om skolan från 2024/25,
och analysera sedan partiernas röstmönster kring dessa propositioner
```

### Jämför över tid
```
Jämför hur Socialdemokraterna röstat om klimat 2020 vs 2024
```

### Få sammanhang
```
Hämta proposition 2024/25:1 och förklara dess huvudpunkter i enkla termer
```

### Använd filter
```
Sök dokument från Finansutskottet (FiU) om skatter
```

---

## 📞 Support

**Problem med anslutningen?**
- GitHub Issues: https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues

**Dokumentation:**
- Webbsida: https://riksdag-regering-ai.onrender.com
- README: https://github.com/KSAklfszf921/Riksdag-Regering.AI

**Server Status:**
- Health: https://riksdag-regering-ai.onrender.com/health

---

## 🎯 Nästa Steg

Nu när du är ansluten, prova att:

1. **Utforska data** - Sök efter dokument som intresserar dig
2. **Analysera politik** - Undersök röstmönster och partipolitik
3. **Jämför förslag** - Se skillnader mellan Riksdag och Regering
4. **Följ lagstiftning** - Håll koll på nya propositioner

**Lycka till med dina politiska analyser!** 🇸🇪

---

**Version:** 2.0.0
**Senast uppdaterad:** 2025-11-19

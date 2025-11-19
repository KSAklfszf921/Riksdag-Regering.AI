# Användningsguide - Riksdag-Regering MCP Server

Denna guide visar praktiska exempel på hur du använder MCP servern för att arbeta med svensk politisk data.

## Innehåll

- [Grundläggande sökning](#grundläggande-sökning)
- [Avancerad analys](#avancerad-analys)
- [Jämförelser](#jämförelser)
- [Resources](#resources)
- [Användarfall](#användarfall)

## Grundläggande sökning

### Hitta specifika ledamöter

**Exempel 1: Sök efter alla socialdemokrater**
```
Använd verktyget search_ledamoter med:
- parti: "S"
- limit: 100
```

**Exempel 2: Hitta ledamöter från Stockholm**
```
Använd verktyget search_ledamoter med:
- valkrets: "Stockholm"
```

**Exempel 3: Sök efter en ledamot vid namn**
```
Använd verktyget search_ledamoter med:
- namn: "Löfven"
```

### Söka dokument

**Exempel 1: Hitta alla motioner om klimat**
```
Använd verktyget search_dokument med:
- titel: "klimat"
- doktyp: "mot"
- limit: 50
```

**Exempel 2: Alla propositioner från 2024**
```
Använd verktyget search_dokument med:
- doktyp: "prop"
- from_date: "2024-01-01"
- to_date: "2024-12-31"
```

**Exempel 3: Dokument från Finansutskottet**
```
Använd verktyget search_dokument med:
- organ: "FiU"
```

### Söka anföranden

**Exempel 1: Hitta alla anföranden om migration**
```
Använd verktyget search_anforanden med:
- text: "migration"
- limit: 30
```

**Exempel 2: Anföranden av en specifik talare**
```
Använd verktyget search_anforanden med:
- talare: "Andersson"
- from_date: "2024-01-01"
```

### Söka voteringar

**Exempel 1: Hitta voteringar om budget**
```
Använd verktyget search_voteringar med:
- titel: "budget"
```

**Exempel 2: Alla voteringar senaste månaden**
```
Använd verktyget search_voteringar med:
- from_date: "2024-10-01"
- to_date: "2024-10-31"
```

### Söka i Regeringskansliets dokument

**Exempel 1: Pressmeddelanden om ekonomi**
```
Använd verktyget search_regering med:
- dataType: "pressmeddelanden"
- titel: "ekonomi"
```

**Exempel 2: Alla propositioner från Finansdepartementet**
```
Använd verktyget search_regering med:
- dataType: "propositioner"
- departement: "Finansdepartementet"
```

**Exempel 3: Statens offentliga utredningar (SOU)**
```
Använd verktyget search_regering med:
- dataType: "sou"
- from_date: "2024-01-01"
```

## Avancerad analys

### Partianalys

**Exempel 1: Analysera partifördelning i hela Riksdagen**
```
Använd verktyget analyze_partifordelning utan parametrar
```

**Exempel 2: Partifördelning i en specifik valkrets**
```
Använd verktyget analyze_partifordelning med:
- valkrets: "Västra Götalands län"
```

### Voteringanalys

**Exempel: Detaljerad analys av en votering**
```
Använd verktyget analyze_votering med:
- votering_id: "8033E74D-8DD4-4D0F-8AD4-6BD6BBA4D4DB"
```

Detta ger dig:
- Röstningsresultat (Ja, Nej, Avstår, Frånvarande)
- Andel Ja-röster
- Partifördelning av röster (om tillgängligt)

### Ledamotanalys

**Exempel: Analysera en ledamots aktivitet**
```
Använd verktyget analyze_ledamot med:
- intressent_id: "0123456789"
- from_date: "2024-01-01"
- to_date: "2024-12-31"
```

Detta visar:
- Antal anföranden
- Antal röstningar
- Röstningsstatistik (Ja, Nej, Avstår, Frånvarande)

### Dokumentstatistik

**Exempel 1: Statistik över alla dokument**
```
Använd verktyget analyze_dokument_statistik utan parametrar
```

**Exempel 2: Motionsstatistik för ett riksmöte**
```
Använd verktyget analyze_dokument_statistik med:
- doktyp: "mot"
- rm: "2024/25"
```

### Trendanalys

**Exempel 1: Antal dokument per månad**
```
Använd verktyget analyze_trend med:
- dataType: "dokument"
- groupBy: "month"
- from_date: "2024-01-01"
- to_date: "2024-12-31"
```

**Exempel 2: Anföranden per vecka**
```
Använd verktyget analyze_trend med:
- dataType: "anforanden"
- groupBy: "week"
- from_date: "2024-09-01"
```

**Exempel 3: Voteringar per år**
```
Använd verktyget analyze_trend med:
- dataType: "voteringar"
- groupBy: "year"
```

## Jämförelser

### Jämföra ledamöter

**Exempel: Jämför två partiledares aktivitet**
```
Använd verktyget compare_ledamoter med:
- intressent_id_1: "0123456789"
- intressent_id_2: "9876543210"
```

Detta visar:
- Antal anföranden för varje ledamot
- Antal röstningar
- Skillnader i aktivitet

### Jämföra partiers röstbeteende

**Exempel: Hur röstade partierna i två liknande voteringar?**
```
Använd verktyget compare_parti_rostning med:
- votering_id_1: "VOTERING-ID-1"
- votering_id_2: "VOTERING-ID-2"
```

### Jämföra Riksdag och Regering

**Exempel: Hitta relaterade dokument om klimat**
```
Använd verktyget compare_riksdag_regering med:
- searchTerm: "klimat"
- limit: 15
```

Detta returnerar:
- Dokument från Riksdagen om klimat
- Propositioner från Regeringen
- Pressmeddelanden från Regeringen

### Jämföra partier

**Exempel: Jämför S och M**
```
Använd verktyget compare_partier med:
- parti_1: "S"
- parti_2: "M"
- from_date: "2024-01-01"
- to_date: "2024-12-31"
```

Detta visar:
- Antal ledamöter per parti
- Antal anföranden
- Antal motioner
- Skillnader mellan partierna

## Resources

### Hämta partiöversikt

```
Läs resursen: riksdagen://partier
```

Detta ger dig en komplett lista över alla partier med antal ledamöter.

### Hämta dokumenttyper

```
Läs resursen: riksdagen://dokument/typer
```

Detta visar alla tillgängliga dokumenttyper och antal dokument per typ.

### Hämta departement

```
Läs resursen: regeringen://departement
```

Detta listar alla departement och antal dokument från varje departement.

### Hämta statistik

```
Läs resursen: riksdagen://statistik
```

Detta ger en sammanställning av all data i systemet:
- Antal ledamöter
- Antal dokument
- Antal anföranden
- Antal voteringar
- Antal pressmeddelanden
- Antal propositioner

## Användarfall

### Användarfall 1: Forskare som studerar klimatpolitik

**Steg 1: Hitta alla dokument om klimat**
```
search_dokument med titel: "klimat"
search_regering med dataType: "propositioner", titel: "klimat"
```

**Steg 2: Analysera trender**
```
analyze_trend med dataType: "dokument", groupBy: "month"
```

**Steg 3: Jämför Riksdag och Regering**
```
compare_riksdag_regering med searchTerm: "klimat"
```

### Användarfall 2: Journalist som granskar partiaktivitet

**Steg 1: Hämta partiöversikt**
```
Läs resursen: riksdagen://partier
```

**Steg 2: Jämför två partier**
```
compare_partier med parti_1: "S", parti_2: "M"
```

**Steg 3: Analysera specifika ledamöter**
```
search_ledamoter med parti: "S"
analyze_ledamot för varje intressant ledamot
```

### Användarfall 3: Medborgare som vill följa en viss fråga

**Steg 1: Sök efter dokument**
```
search_dokument med titel: "migration"
search_regering med dataType: "pressmeddelanden", titel: "migration"
```

**Steg 2: Hitta relaterade anföranden**
```
search_anforanden med text: "migration"
```

**Steg 3: Se hur det röstades**
```
search_voteringar med titel: "migration"
analyze_votering för specifika voteringar
```

### Användarfall 4: Politisk analytiker

**Steg 1: Hämta all statistik**
```
Läs resursen: riksdagen://statistik
```

**Steg 2: Analysera partifördelning**
```
analyze_partifordelning
```

**Steg 3: Analysera dokumentproduktion**
```
analyze_dokument_statistik med olika filter
analyze_trend för att se utveckling över tid
```

**Steg 4: Jämför ledamöter inom samma parti**
```
search_ledamoter med parti: "S"
compare_ledamoter för att jämföra aktivitet
```

## Tips och tricks

### Kombinera flera verktyg

För bästa resultat, kombinera flera verktyg:

1. **Börja brett**: Använd search-verktyg för att hitta relevant data
2. **Fördjupa**: Använd analyze-verktyg för att få insikter
3. **Jämför**: Använd compare-verktyg för att se skillnader och likheter

### Använd datumfilter effektivt

För att analysera specifika perioder:
- Använd `from_date` och `to_date` för att begränsa resultat
- Kombinera med `analyze_trend` för att se utveckling

### Optimera sökning

- Börja med små `limit`-värden och öka vid behov
- Använd specifika filter för att få mer relevanta resultat
- Kombinera flera filter för precisare sökning

### Förstå resultaten

- `analysis`-fältet ger en sammanfattning i text
- Numeriska fält ger exakta siffror för vidare bearbetning
- Resources ger snabb översikt utan behov av filter

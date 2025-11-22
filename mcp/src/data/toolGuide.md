# Användningsguide för Riksdagen & Regeringens MCP-server

Denna guide hjälper dig att förstå och effektivt använda de tillgängliga verktygen för att interagera med data från Riksdagen och Regeringskansliet (via g0v.se).

## Översikt över verktygskategorier

*   **Sökverktyg:** Hitta information baserad på söktermer, datum, typer eller andra kriterier.
*   **Hämtningsverktyg:** Hämta detaljerad information om specifika objekt (t.ex. dokumentinnehåll).
*   **Informationsverktyg:** Hämta metadata och listor över tillgängliga alternativ (t.ex. dokumenttyper, kategorikoder).
*   **Analysverktyg:** Utför aggregerad analys av data.

---

## Riksdagens verktyg (Exempel)

### 1. Sök ledamöter: `search_ledamoter`
Använd för att hitta riksdagsledamöter.

**Parametrar:**
*   `namn`: Namn att söka efter (förnamn eller efternamn)
*   `parti`: Parti (t.ex. S, M, SD, V, MP, C, L, KD)
*   `valkrets`: Valkrets
*   `status`: Status (tjänstgörande, tjänstledig, etc.)
*   `intressent_id`: Ledamots-ID
*   `page`: Sida för paginering (standard: 1)
*   `limit`: Max antal resultat (standard: 50)

**Exempelanvändning:**
```json
{
  "tool_code": "search_ledamoter(namn='Annie Lööf')"
}
```
```json
{
  "tool_code": "search_ledamoter(parti='S', limit=10, page=2)"
}
```
```json
{
  "tool_code": "search_ledamoter(intressent_id='0567039986328', status='tjänstgörande')"
}
```

**Observera om ministrar:** Riksdagens API erbjuder ingen direkt filtrering för "minister"-rollen. För att identifiera ministrar kan du först använda `get_ledamot` med en känd `intressent_id` och sedan undersöka fältet `personuppdrag` i svaret för roller som "Statsråd".

### 2. Sök dokument: `search_dokument`
Sök efter riksdagsdokument som propositioner, motioner, betänkanden, m.m.

**Parametrar (exempel):**
*   `titel`: Titel eller fritext att söka efter
*   `doktyp`: Dokumenttyp (t.ex. mot, prop, bet, skr)
*   `rm`: Riksmöte (t.ex. 2024/25)
*   `from_date`, `to_date`: Datumintervall (YYYY-MM-DD)
*   `limit`: Max antal resultat (standard: 50)

**Exempelanvändning:**
```json
{
  "tool_code": "search_dokument(titel='klimat', doktyp='prop', rm='2024/25', limit=5)"
}
```
```json
{
  "tool_code": "search_dokument(titel='skola', from_date='2023-01-01', to_date='2023-12-31')"
}
```

### 3. Hämta dokumentinnehåll: `get_dokument_innehall`

När du har ett `dok_id` från en sökning kan du hämta hela dokumentets innehåll.



**Parametrar:**

*   `dok_id`: Dokumentets ID



**Exempelanvändning:**

```json

{

  "tool_code": "get_dokument_innehall(dok_id='H301Ub1')"

}

```



### 4. Sök anföranden: `search_anforanden`

Sök efter anföranden från riksdagsledamöter.



**Parametrar:**

*   `talare`: Namn på talare

*   `parti`: Parti

*   `text`: Fritext att söka i anförandet

*   `rm`: Riksmöte (t.ex. 2024/25)

*   `limit`: Max antal resultat



**Exempelanvändning:**

```json

{

  "tool_code": "search_anforanden(talare='Magdalena Andersson', rm='2023/24')"

}

```



```json

{

  "tool_code": "search_anforanden(parti='MP', text='miljö', limit=5)"

}

```

**Observera om anförandetext:** För framtida eller relativt nya protokoll kan fältet `anforandetext` vara tomt då Riksdagens API ännu inte har behandlat eller tillgängliggjort den fullständiga texten. Sökningen och metadata är dock korrekta.



### 5. Sök voteringar: `search_voteringar`

Sök efter voteringar och röster i Riksdagen.



**Parametrar:**

*   `rm`: Riksmöte (t.ex. 2024/25)

*   `parti`: Parti

*   `rost`: Röst (Ja, Nej, Avstår, Frånvarande)

*   `groupBy`: Gruppera resultat efter ('parti', 'valkrets', 'namn')

*   `limit`: Max antal resultat



**Exempelanvändning:**

```json

{

  "tool_code": "search_voteringar(rm='2024/25', parti='S', rost='Ja')"

}

```



```json

{

  "tool_code": "search_voteringar(rm='2023/24', groupBy='parti')"

}

```

**Observera om gruppering:** Vid breda sökningar med `groupBy` (t.ex. endast med `rm`) kan Riksdagens API ibland returnera sammanfattade poster som `parti = "-"`, istället för en detaljerad uppdelning. Detta är ett API-beteende.



### 6. Hämta kalenderhändelser: `get_calendar_events`


Hämta information om debatter, beslut, utskottsmöten och andra aktiviteter.



**Parametrar:**

*   `from`: Från datum (YYYY-MM-DD)

*   `tom`: Till datum (YYYY-MM-DD)

*   `akt`: Aktivitetstyp eller kombinationskod

*   `org`: Organ (UTSK, kammaren etc.)

*   `limit`: Max antal resultat



**Exempelanvändning:**

```json

{

  "tool_code": "get_calendar_events(from='2024-11-25', tom='2024-11-29', org='kammaren')"

}

```



```json

{

  "tool_code": "get_calendar_events(akt='Utskottsmöte', limit=3)"

}

```

**Observera om kalenderdata:** Riksdagens kalender-API kan i vissa fall returnera icke-JSON-innehåll (t.ex. HTML) även när JSON begärs. Verktyget kommer då att kasta ett fel för att indikera att strukturerad data inte kunde hämtas.



---


## Riksdagens Dokument-ID: Struktur och Användning

Varje dokument-ID består av tre olika delar: kod för riksmöte/år, kod för dokumentserie och dokumentbeteckning. Exempelvis `GZ01MJU21`. XML-taggen för dokument-ID är `dok_id`.

Svensk författningssamling (SFS), det vill säga lagar, är ett undantag från standarden. Dokument-ID för SFS:er består av beteckningen "sfs" följt av år och nummer, med bindestreck mellan alla tre delar, t.ex. `sfs-1974-152`.

MCP-serverns verktyg (`get_dokument`, `search_dokument`) använder det fullständiga dokument-ID:t som indata eller returnerar det som del av sökresultaten. Servern har inte separata verktyg för att konstruera ett dokument-ID från dess enskilda delar, men `search_dokument` tillåter sökning med filter som `rm` (riksmöte) och `doktyp` (dokumentserie) som implicit motsvarar delar av dokument-ID:t.

**Kod för riksmöte eller år (De två första tecknen i ett dokument-ID):**

| Tecken | Riksmöte/år |
| ------ | ----------- |
| FT     | 1970        |
| FU     | 1971        |
| FV     | 1972        |
| FW     | 1973        |
| FX     | 1974        |
| FY     | 1975        |
| FZ     | 1975/76     |
| G0     | 1976/77     |
| G1     | 1977/78     |
| G2     | 1978/79     |
| G3     | 1979/80     |
| G4     | 1980/81     |
| G5     | 1981/82     |
| G6     | 1982/83     |
| G7     | 1983/84     |
| G8     | 1984/85     |
| G9     | 1985/86     |
| GA     | 1986/87     |
| GB     | 1987/88     |
| GC     | 1988/89     |
| GD     | 1989/90     |
| GE     | 1990/91     |
| GF     | 1991/92     |
| GG     | 1992/93     |
| GH     | 1993/94     |
| GI     | 1994/95     |
| GJ     | 1995/96     |
| GK     | 1996/97     |
| GL     | 1997/98     |
| GM     | 1998/99     |
| GN     | 1999/2000   |
| GO     | 2000/01     |
| GP     | 2001/02     |
| GQ     | 2002/03     |
| GR     | 2003/04     |
| GS     | 2004/05     |
| GT     | 2005/06     |
| GU     | 2006/07     |
| GV     | 2007/08     |
| GW     | 2008/09     |
| GX     | 2009/10     |
| GY     | 2010/11     |
| GZ     | 2011/12     |
| H0     | 2012/13     |
| H1     | 2013/14     |
| H2     | 2014/15     |
| H3     | 2015/16     |
| H4     | 2016/17     |
| H5     | 2017/18     |
| H6     | 2018/19     |
| H7     | 2019/20     |
| H8     | 2020/21     |
| H9     | 2021/22     |
| HA     | 2022/23     |
| HB     | 2023/24     |
| HC     | 2024/25     |
| ZZ     | Fallback    |

**Kod för dokumentserie (Det tredje och fjärde tecknet i ett dokument-ID):**

| Tecken | Dokumentserie                        |
| ------ | ------------------------------------ |
| 01     | Betänkande eller utlåtande           |
| 02     | Motion                               |
| 03     | Proposition eller regeringsskrivelse |
| 04     | Framställning eller redogörelse      |
| 05     | Yttrande                             |
| 06     | Fakta-pm                             |
| 09     | Kammarens protokoll                  |
| 10     | Interpellation                       |
| 11     | Skriftlig fråga                      |
| 12     | Svar på skriftlig fråga              |
| 0A     | EU-nämndens stenografiska uppteckningar |
| 0H     | Sammanställning                      |
| 0I     | Kammarens föredragningslista         |
| 0J     | Kammarens talarlista                 |
| 0K     | Riksdagsskrivelse                    |
| 0L     | Kallelse och föredragningslista      |
| 0M     | Ministerråd                          |
| 0N     | EU-nämndens bilaga                   |
| 0W     | Rapport från riksdagen (rfr)         |
| A1     | Utskottsdokument                     |
| A2     | EU-nämndens dokument                 |
| A3     | Utskottsmöte                         |
| A4     | Skriftligt samråd                    |
| A5     | Utredning från Riksdagsförvaltningen (urf) |
| A6     | Utredning från riksdagen (urd)       |
| B1     | Kommittédirektiv (dir)               |
| B2     | Kommittéberättelse (komm)            |
| B3     | Statens offentliga utredning (sou)   |
| B4     | Departementsserien (ds)              |
| B5     | Riksrevisionens granskningsrapport (rir) |
| B6     | EU-förslag (kom)                     |
| C1     | Kammaraktivitet                      |
| C2     | Sammankomst utanför kammaren        |
| C3     | Votering                             |
| C4     | Övriga kalenderhändelse              |
| CC     | Bilaga                               |
| D1     | Sammanställning                      |
| ZZ     | Fallback                             |

**Dokumentbeteckning (Det femte tecknet och alla tecken därefter):**

Hur dokumentbeteckningen ser ut beror på vilken dokumentserie dokumentet ingår i. Exempelvis:
*   För betänkanden (dokumentseriekod 01) och motioner (dokumentseriekod 02) är dokumentbeteckningen utskottsbeteckning och löpnummer (t.ex. `AU1`).
*   För interpellationer (10), skriftliga frågor (11), svar på skriftliga frågor (12) är det ett löpnummer (t.ex. `123`).
*   För dokumentserier som utredningar från Riksdagsförvaltningen (A5) kan det vara förkortning för dokumentserien och löpnummer (t.ex. `rfr3`).
*   För kammaraktiviteter (C1), sammankomster (C2) och kalenderhändelser (C4) konstrueras beteckningen med datum, en kod för typen av aktivitet (t.ex. `vo` för beslut, `ip` för interpellationsdebatt), och ett löpnummer (t.ex. `H0C120120919vo1`).

För tolkade sändningar (engelska/teckenspråk) läggs `en` eller `tt` till sist i dok_id:t.

---


## Regeringskansliets verktyg (via g0v.se) (Exempel)

### 1. Sök regeringsdokument: `search_regering`
Sök i Regeringskansliets dokument från Regeringskansliet (via g0v.se) som pressmeddelanden, propositioner, SOU, m.m.

**Parametrar:**
*   `title`: Titel att söka efter
*   `departement`: Departement att filtrera på
*   `type`: Dokumenttyp (se `get_g0v_document_types` för tillgängliga typer)
*   `dateFrom`, `dateTo`: Datumintervall (YYYY-MM-DD)
*   `limit`: Max antal resultat (standard: 20)

**Exempelanvändning:**
```json
{
  "tool_code": "search_regering(type='pressmeddelanden', title='budget', limit=3)"
}
```
```json
{
  "tool_code": "search_regering(departement='Finansdepartementet', dateFrom='2024-01-01')"
}
```

### 2. Hämta tillgängliga dokumenttyper: `get_g0v_document_types`
Använd detta verktyg för att få en lista över alla dokumenttyper från Regeringskansliet (via g0v.se) som kan användas med `search_regering`.

**Exempelanvändning:**
```json
{
  "tool_code": "get_g0v_document_types()"
}
```

### 3. Hämta dokumentinnehåll från Regeringskansliet: `get_g0v_document_content`
När du har en `url` från ett dokument från Regeringskansliet (från t.ex. `search_regering`), kan du hämta hela dokumentets innehåll i Markdown-format. Notera att URL:en måste vara den ursprungliga `regeringen.se`-URL:en.

**Parametrar:**
*   `regeringenUrl`: Den ursprungliga URL:en till dokumentet på regeringen.se

**Exempelanvändning:**
```json
{
  "tool_code": "get_g0v_document_content(regeringenUrl='https://www.regeringen.se/pressmeddelanden/2024/01/ny-strategi-for-sveriges-bistand/')"
}
```


### 4. Analysera per departement: `analyze_g0v_by_department`
Få en översikt över dokumentaktivitet per departement från Regeringskansliet (via g0v.se) inom ett givet datumintervall.

**Parametrar:**
*   `dateFrom`: Från datum (YYYY-MM-DD)
*   `dateTo`: Till datum (YYYY-MM-DD)

**Exempelanvändning:**
```json
{
  "tool_code": "analyze_g0v_by_department(dateFrom='2024-01-01', dateTo='2024-03-31')"
}
```

---


## Allmänna tips för effektiv användning

*   **Börja brett och förfina:** Om du är osäker, börja med en bred sökning och använd sedan resultaten för att förfina din nästa fråga.
*   **Använd datumfilter:** Datumparametrar (`from_date`, `to_date`, `dateFrom`, `dateTo`) är kraftfulla för att begränsa sökningar.
*   **Upptäck med `get_g0v_document_types`:** Använd detta verktyg för att se vilka specifika dokumenttyper från Regeringskansliet (via g0v.se) du kan söka efter.
*   **Hämta innehåll med URL:** Efter en sökning, använd den returnerade URL:en för att hämta hela texten av ett intressant dokument.

Denna guide är tänkt att ge dig en grundläggande förståelse. Utforska verktygens fullständiga scheman för att upptäcka alla parametrar.
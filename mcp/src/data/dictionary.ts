/**
 * Data dictionary med definitioner för alla datakällor som MCP servern exponerar.
 */

export const DATA_DICTIONARY = {
  overview: {
    description: 'Riksdag-Regering MCP-servern använder endast offentliga källor från data.riksdagen.se och g0v.se/Regeringskansliet.',
    terms: [
      { term: 'RM', explanation: 'Riksmöte i formatet 2024/25, används för att gruppera dokument per parlamentarisk session.' },
      { term: 'Doktyp', explanation: 'Kortkod för dokumenttyp (mot=motion, prop=proposition, bet=betänkande, skr=skrivelse, ds=departementsserien, sou=statens offentliga utredningar).' },
      { term: 'Intressent ID', explanation: 'Persistent ID som Riksdagen använder för ledamöter.' },
      { term: 'Publicerad_datum', explanation: 'Publiceringsdatum i Regeringskansliets dataset (ISO 8601).' },
    ],
  },
  datasets: [
    {
      id: 'riksdagen_ledamoter',
      title: 'Ledamöter',
      fields: ['intressent_id', 'tilltalsnamn', 'efternamn', 'parti', 'valkrets', 'status', 'bild_url'],
      description: 'Grunddata om nuvarande och historiska ledamöter. Uppdateras dagligen från Riksdagens API.',
      usage: 'Används av search_ledamoter, get_ledamot, analyze_partifordelning, compare_ledamoter.',
    },
    {
      id: 'riksdagen_dokument',
      title: 'Riksdagens dokument',
      fields: ['dok_id', 'doktyp', 'rm', 'beteckning', 'titel', 'datum', 'organ'],
      description: 'Samlar motioner, propositioner, betänkanden m.m. Hämtas via data.riksdagen.se/dokumentlista.',
      usage: 'Bas för search_dokument, get_dokument, analyze_dokument_statistik, global_search.',
    },
    {
      id: 'riksdagen_anforanden',
      title: 'Anföranden',
      fields: ['anforande_id', 'talare', 'parti', 'avsnittsrubrik', 'created_at'],
      description: 'Debattinlägg från kammaren, inklusive statsministerns frågestund och interpellationsdebatter.',
      usage: 'search_anforanden, analyze_ledamot, analyze_parti_activity, global_search.',
    },
    {
      id: 'riksdagen_voteringar',
      title: 'Voteringar',
      fields: ['votering_id', 'rm', 'beteckning', 'punkt', 'created_at', 'ja_roster', 'nej_roster'],
      description: 'Övergripande voteringsomröstningar med totalsiffror.',
      usage: 'search_voteringar, analyze_votering, compare_parti_rostning.',
    },
    {
      id: 'riksdagen_votering_ledamoter',
      title: 'Individuella röster',
      fields: ['votering_id', 'intressent_id', 'parti', 'rost'],
      description: 'Röster per ledamot när data finns tillgänglig. Förs i synk med voteringsloggarna.',
      usage: 'get_votering_roster_summary, compare_parti_rostning, analyze_ledamot.',
    },
    {
      id: 'regeringskansliet_pressmeddelanden',
      title: 'Pressmeddelanden',
      fields: ['document_id', 'titel', 'departement', 'publicerad_datum', 'innehall'],
      description: 'Publicerade pressmeddelanden från regeringen via g0v.se.',
      usage: 'search_regering (pressmeddelanden), summarize_pressmeddelande, get_sync_status.',
    },
    {
      id: 'regeringskansliet_propositioner',
      title: 'Propositioner (RK)',
      fields: ['document_id', 'titel', 'departement', 'publicerad_datum', 'beteckningsnummer'],
      description: 'Regeringens propositioner innan de lämnas till Riksdagen.',
      usage: 'search_regering (propositioner), compare_riksdag_regering.',
    },
  ],
  guidance: [
    'När du filtrerar på datum, använd ISO-formatet YYYY-MM-DD.',
    'Motioner identifieras ofta via beteckning med partisignatur (ex. 2024/25:353 (S)).',
    'Pressmeddelanden och propositioner från regeringen kan sakna Riksmöteskoppling; använd departement/tidsintervall i stället.',
    'Voteringsdata saknar ibland individuella röster; verktygen faller tillbaka på totalsiffror men signalerar när detaljer saknas.',
    'Alla tabeller är read-only i MCP-servern. För skrivoperationer hänvisas till Supabase direkt.',
  ],
};

/* Costanti statiche del dossier: non sono dati modificabili e non stanno
   nel database. Estratte una volta sola da dossier-abbruzzo.html. */

export type StatoNodo = "open" | "work" | "wait" | "block" | "done";

/** Ciclo di rotazione dello stato di un nodo (click sul badge). */
export const CICLO: readonly StatoNodo[] = ["open","work","wait","block","done"] as const;

/** Etichetta leggibile di ogni stato. */
export const STATI: Record<StatoNodo, string> = {
  "open": "da decidere",
  "work": "in lavorazione",
  "wait": "in attesa di Vittoria",
  "block": "da verificare subito",
  "done": "deciso"
};

/** Metriche di rischio per nodo: [livello, etichetta, celle accese, testo]. */
export type Metrica = readonly [level: "hi" | "md" | "lo", label: string, on: number, val: string];
export const RISK: Record<string, readonly Metrica[]> = {
  "n1": [
    [
      "hi",
      "Conseguenza",
      3,
      "Alta — tutela inefficace proprio quando serve"
    ],
    [
      "md",
      "Probabilità",
      2,
      "Media-alta — dipende dal grado di stilizzazione"
    ],
    [
      "lo",
      "Costo di evitarlo",
      1,
      "Basso — una seconda domanda e un archivio d’uso"
    ]
  ],
  "n2": [
    [
      "md",
      "Conseguenza",
      2,
      "Media — costi e passaggi, non perdita del diritto"
    ],
    [
      "hi",
      "Probabilità",
      3,
      "Alta — accade quasi sempre nei progetti nascenti"
    ],
    [
      "lo",
      "Costo di evitarlo",
      1,
      "Basso — si decide oggi in cinque minuti"
    ]
  ],
  "n3": [
    [
      "hi",
      "Conseguenza",
      3,
      "Alta — il nome resta libero fuori dall’Italia"
    ],
    [
      "md",
      "Probabilità",
      2,
      "Media — cresce con la visibilità del progetto"
    ],
    [
      "md",
      "Costo di evitarlo",
      2,
      "Medio — tasse EUIPO entro sei mesi"
    ]
  ],
  "n4": [
    [
      "hi",
      "Conseguenza",
      3,
      "Molto alta — blocca il prodotto-manifesto"
    ],
    [
      "md",
      "Probabilità",
      2,
      "Media — i marchi dismessi hanno spesso eredi attenti"
    ],
    [
      "lo",
      "Costo di evitarlo",
      1,
      "Basso — una visura in banca dati e una liberatoria"
    ]
  ],
  "n5": [
    [
      "md",
      "Conseguenza",
      2,
      "Media — decadenza parziale, non caduta del marchio"
    ],
    [
      "md",
      "Probabilità",
      2,
      "Media — emerge solo in causa o in opposizione"
    ],
    [
      "lo",
      "Costo di evitarlo",
      1,
      "Basso — scrivere le voci con la testa, non copiarle"
    ]
  ],
  "n6": [
    [
      "hi",
      "Conseguenza",
      3,
      "Alta — opposizione o rebranding a progetto avviato"
    ],
    [
      "md",
      "Probabilità",
      2,
      "Media — « Abruzzo » ricorre in molti registri"
    ],
    [
      "lo",
      "Costo di evitarlo",
      1,
      "Basso — una ricerca prima, non dopo"
    ]
  ]
};

/** Sequenza operativa del nodo 07: [titolo, dettaglio]. */
export const SEQ: readonly (readonly [string, string])[] = [
  [
    "Verifica su Pagnanelli",
    "Nodo 04. Se cade, cambia il primo prodotto e con esso il baricentro delle classi."
  ],
  [
    "Ricerca di anteriorità",
    "Nodo 06. Può imporre una stilizzazione diversa o un segno diverso."
  ],
  [
    "Scelta del segno e del titolare",
    "Nodi 01 e 02, alla luce di quanto emerso."
  ],
  [
    "Formulazione delle voci",
    "Nodo 05. Classe per classe, con l’elenco dei prodotti e servizi effettivamente rivendicati."
  ],
  [
    "Deposito italiano",
    "Nodo 03, con la scadenza dei sei mesi di priorità messa a calendario lo stesso giorno."
  ]
];

export type NodoStatico = {
  id: string;
  /** numero mostrato nell'indice e nel titolo, es. "01" */
  n: string;
  /** il nodo mostra la tabella delle classi */
  table: boolean;
  /** il nodo mostra la sequenza operativa */
  seq: boolean;
  /** il nodo ha un secondo blocco di corpo dopo la tabella */
  hasBody2: boolean;
};
export const NODI: readonly NodoStatico[] = [
  {
    "id": "n1",
    "n": "01",
    "table": false,
    "seq": false,
    "hasBody2": false
  },
  {
    "id": "n2",
    "n": "02",
    "table": false,
    "seq": false,
    "hasBody2": false
  },
  {
    "id": "n3",
    "n": "03",
    "table": false,
    "seq": false,
    "hasBody2": false
  },
  {
    "id": "n4",
    "n": "04",
    "table": false,
    "seq": false,
    "hasBody2": false
  },
  {
    "id": "n5",
    "n": "05",
    "table": true,
    "seq": false,
    "hasBody2": true
  },
  {
    "id": "n6",
    "n": "06",
    "table": false,
    "seq": false,
    "hasBody2": false
  },
  {
    "id": "n7",
    "n": "07",
    "table": false,
    "seq": true,
    "hasBody2": false
  }
];

export type ClasseStatica = {
  /** numero della classe di Nizza, usato anche come chiave: classes.<cl>.nt */
  cl: string;
  /** perimetro minimo che la include: 1 Nucleo, 2 Coerente, 3 Esteso */
  lv: 1 | 2 | 3;
  area: string;
  ramo: string;
  flag: "" | "add" | "fix";
};
export const CLASSI: readonly ClasseStatica[] = [
  {
    "cl": "24",
    "lv": 1,
    "area": "Tessili e biancheria per la casa",
    "ramo": "Coperte, plaid, cuscini, tovaglie, runner",
    "flag": ""
  },
  {
    "cl": "35",
    "lv": 1,
    "area": "Vendita al dettaglio e online",
    "ramo": "E-commerce proprietario, B2B, corporate gift",
    "flag": ""
  },
  {
    "cl": "25",
    "lv": 2,
    "area": "Abbigliamento e accessori indossabili",
    "ramo": "Sciarpe, foulard, cappelli",
    "flag": "fix"
  },
  {
    "cl": "18",
    "lv": 2,
    "area": "Borse, pelletteria, valigeria",
    "ramo": "Borse e piccoli accessori",
    "flag": "add"
  },
  {
    "cl": "21",
    "lv": 2,
    "area": "Utensili e recipienti per casa e cucina",
    "ramo": "Ceramiche, vetro, oggetti per la tavola",
    "flag": ""
  },
  {
    "cl": "27",
    "lv": 3,
    "area": "Tappeti, stuoie, arazzi",
    "ramo": "Tessile casa a pavimento e a parete",
    "flag": "add"
  },
  {
    "cl": "20",
    "lv": 3,
    "area": "Mobili e complementi d’arredo",
    "ramo": "Ramo « Casa »",
    "flag": ""
  },
  {
    "cl": "16",
    "lv": 3,
    "area": "Stampe, cartoline, libri, fotografie",
    "ramo": "Certificati, cartoline di provenienza, editoria",
    "flag": "add"
  },
  {
    "cl": "41",
    "lv": 3,
    "area": "Mostre, eventi, attività culturali",
    "ramo": "Ramo « Spaces », parte eventi",
    "flag": ""
  },
  {
    "cl": "42",
    "lv": 3,
    "area": "Design e progettazione d’interni",
    "ramo": "Ramo « Spaces », parte progettuale",
    "flag": ""
  },
  {
    "cl": "43",
    "lv": 3,
    "area": "Noleggio di biancheria da tavola, stoviglie e arredi",
    "ramo": "Allestimenti per matrimoni ed eventi",
    "flag": "fix"
  }
];

/** I tre perimetri preimpostati. */
export const PERIMETRI: readonly (readonly [lv: 1 | 2 | 3, nome: string])[] = [
  [1, "Nucleo"],
  [2, "Coerente"],
  [3, "Esteso"],
];

/** Nome del file dell'allegato, servito staticamente da /public. */
export const ALLEGATO_HREF = "/allegato/business-model-abbruzzo.docx";
export const ALLEGATO_NOME = "Business_Model_abBruzzo_per_registrazione_marchio.docx";

/** Corpo dell'allegato: testo non modificabile, reso così com'era. */
export const ATT = "<h3>Premessa</h3><p><b>Finalità del documento.</b> Quadro ordinato del business model di ab[B]ruzzo, così da poter definire in modo coerente il perimetro di tutela del marchio e procedere alla scelta e alla formulazione delle Classi di Nizza.</p><p><b>Condivisione del progetto.</b> Vittoria ha esaminato il modello e conferma la volontà di sviluppare, progressivamente, i diversi rami di business descritti nel presente documento. La registrazione dovrebbe quindi considerare non soltanto l’attività iniziale legata alle coperte, ma anche le estensioni realisticamente previste per il brand.</p><h3>1. Identità e posizionamento del brand</h3><p>ab[B]ruzzo non nasce come semplice marchio di coperte. È un brand contemporaneo di lifestyle territoriale che recupera oggetti, manifatture, materiali e immaginari dell’Abruzzo e li reinterpreta attraverso design, racconto ed esperienza. La coperta Pagnanelli è il primo prodotto-manifesto, ma non esaurisce il marchio. Il principio del progetto può essere sintetizzato in: Abruzzo → memoria → oggetto → design → racconto → esperienza. La proposta di valore è trasformare elementi autentici della cultura materiale abruzzese in oggetti contemporanei desiderabili, combinando autenticità, storia, estetica e funzione.</p><h3>2. Primo progetto: ab[B]ruzzo / Pagnanelli</h3><p>Il primo capitolo operativo è il recupero delle circa 6.000 coperte rimaste nel magazzino dell’ex fabbrica Pagnanelli. L’idea è non trattarle come semplice stock, ma trasformarle in una collezione limitata e numerata, potenzialmente identificata dal concept « 6000 ». Ogni coperta potrà essere valorizzata con etichetta ab[B]ruzzo, riferimento alla manifattura Pagnanelli, numero progressivo, packaging dedicato, QR code, racconto digitale della fabbrica, fotografie/video e certificato o cartolina di provenienza.</p><h3>3. Rami di business approvati e sviluppo del brand</h3><p>Il progetto è pensato per svilupparsi per collezioni e capitoli coerenti, mantenendo ab[B]ruzzo come master brand. Vittoria ha confermato l’interesse a sviluppare progressivamente i diversi ambiti sotto indicati.</p><div class=\"tbl\"><table><tbody><tr><td>Coperte e tessile casa</td><td>Coperte, plaid, cuscini, tessili, tovaglie, runner, biancheria per la casa e complementi tessili. <em>Core business iniziale e sviluppo naturale.</em></td></tr><tr><td>Moda e accessori</td><td>Sciarpe, foulard, cappelli, borse e piccoli accessori coerenti con l’identità del brand. <em>Espansione di prodotto.</em></td></tr><tr><td>Oggetti e artigianato</td><td>Ceramiche, vetro, legno, oggetti per tavola e casa, piccole produzioni artigianali. <em>Curatela e collaborazioni con artigiani.</em></td></tr><tr><td>Collaborazioni / Editions</td><td>Edizioni limitate con ceramisti, tessitori, illustratori, fotografi, artisti e designer. <em>Il brand agisce anche come curatore.</em></td></tr><tr><td>Hospitality</td><td>Fornitura e vendita a hotel, boutique hotel, B&amp;B, agriturismi, dimore storiche, ristoranti e case vacanza. <em>Le strutture diventano clienti, showroom e punti di vendita.</em></td></tr><tr><td>Corporate gifting</td><td>Prodotti e collezioni destinate a regali aziendali. <em>Canale B2B dedicato.</em></td></tr><tr><td>Spaces / allestimenti</td><td>Allestimenti temporanei per eventi, matrimoni, festival, hotel, shooting, cene, installazioni, mostre e presentazioni. <em>Ramo di servizi da sviluppare progressivamente.</em></td></tr><tr><td>Licensing</td><td>Possibile concessione futura in licenza del marchio. <em>Fonte di ricavo futura.</em></td></tr></tbody></table></div><h3>4. Mercati e clienti</h3><p>Il modello è sia B2C sia B2B. <b>B2C:</b> persone interessate a design, Abruzzo, artigianato, interior, turismo e cultura italiana; turisti; abruzzesi fuori regione e all’estero; pubblico medio/medio-alto; mercato del regalo; abruzzesi nel mondo. <b>B2B:</b> boutique hotel, alberghi, B&amp;B, agriturismi, ristoranti, interior designer, architetti, concept store, negozi di design, wedding/event planner e aziende per corporate gift.</p><h3>5. Canali di vendita e distribuzione</h3><p>Il modello è digital first ma fisicamente presente. L’e-commerce proprietario è il canale principale, affiancato da concept store selezionati, hotel, temporary store, eventi, collaborazioni, pop-up, musei/design shop e corporate gifting. L’obiettivo è evitare una distribuzione indiscriminata e preservare selettività e valore percepito.</p><h3>6. Fonti di ricavo</h3><ul><li>Vendita diretta di prodotti</li><li>Vendita B2B e hospitality</li><li>Capsule collection ed edizioni collaborative</li><li>Corporate gift</li><li>Allestimenti ed eventi</li><li>Licensing futuro del marchio</li></ul><p>Nei primi 12-18 mesi il motore principale resta la vendita di prodotto, con la coperta Pagnanelli come punto di partenza.</p><h3>7. Architettura del marchio</h3><p>Impostazione proposta: un unico master brand, ab[B]ruzzo, sotto il quale costruire collezioni e linee — ab[B]ruzzo / Pagnanelli, / Casa, / Objects, / Editions, / Hospitality, / Spaces. L’impostazione di base è proteggere bene ab[B]ruzzo e utilizzare le denominazioni successive come architettura di collezione, senza necessariamente registrare oggi ogni singola linea come marchio autonomo.</p><h3>8. Quadro per la scelta delle Classi di Nizza</h3><p>Nucleo minimo da esaminare: Classi 24 + 35. Perimetro iniziale più ampio, coerente con i business confermati da Vittoria: 24 + 35 + 25 + 21. Ulteriore valutazione: Classe 20 se si intendono commercializzare mobili/complementi; Classi 41 e 42 se eventi, esperienze, design o progettazione saranno servizi offerti a terzi e non semplici strumenti di marketing.</p><div class=\"tbl\"><table class=\"cls\"><tbody><tr><td>24</td><td>Tessili e biancheria per la casa — <em>essenziale</em></td></tr><tr><td>35</td><td>Servizi commerciali / retail / e-commerce — <em>essenziale</em></td></tr><tr><td>25</td><td>Abbigliamento e accessori indossabili — <em>importante</em></td></tr><tr><td>21</td><td>Oggetti per casa e tavola — <em>importante / espansione</em></td></tr><tr><td>20</td><td>Mobili e complementi d’arredo — <em>da valutare</em></td></tr><tr><td>41</td><td>Attività culturali / eventi — <em>da valutare</em></td></tr><tr><td>42</td><td>Design e progettazione — <em>da valutare</em></td></tr><tr><td>43</td><td>Ospitalità / ristorazione — <em>non prioritaria</em></td></tr></tbody></table></div><h3>10. Deposito del marchio: punti da definire</h3><ul><li>Valutare il deposito del marchio denominativo ab[B]ruzzo</li><li>Valutare separatamente il deposito del marchio figurativo, cioè il logo definitivo</li><li>Definire il titolare del marchio</li><li>Definire il territorio di tutela: Italia e/o Unione europea</li><li>Formulare per ciascuna classe l’elenco dei prodotti e servizi da rivendicare</li><li>Effettuare una ricerca di anteriorità sulle forme ab[B]ruzzo, abbruzzo, abruzzo e varianti</li><li>Valutare distintività e perimetro di tutela, data la presenza del riferimento geografico « Abruzzo »</li></ul><h3>11. Sintesi finale</h3><p>ab[B]ruzzo va protetto come brand destinato a svilupparsi oltre la prima operazione Pagnanelli. Il cuore resta il recupero e la reinterpretazione contemporanea della cultura materiale abruzzese, ma i business approvati comprendono tessile e casa, moda/accessori, oggetti e artigianato, collaborazioni, hospitality B2B, corporate gifting, allestimenti/eventi e, in prospettiva, licensing. La scelta delle Classi di Nizza dovrà quindi essere sufficientemente ampia da accompagnare questo sviluppo, senza rivendicare attività estranee o puramente ipotetiche.</p><p><em>Nota finale del documento ricevuto: la formulazione definitiva delle classi e delle singole voci resta da verificare in sede di deposito.</em></p>";

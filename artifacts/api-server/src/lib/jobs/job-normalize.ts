import crypto from "crypto";
import type { UnifiedJob } from "./job-schema.js";
import _citiesJson from "./cities.json";

// ─── HTML strip ───────────────────────────────────────────────────────────────

/** Strip HTML tags and normalize whitespace from a string. */
export function sanitizeDescription(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Remote detection ─────────────────────────────────────────────────────────

const REMOTE_SIGNALS = [
  "remote", "work from home", "wfh", "home office", "fully remote",
  "distributed", "anywhere", "virtual", "telecommute",
];

export function inferRemoteFlag(title: string, location: string): boolean {
  const text = `${title} ${location}`.toLowerCase();
  return REMOTE_SIGNALS.some((sig) => text.includes(sig));
}

// ─── Employment type ──────────────────────────────────────────────────────────

export function inferEmploymentType(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = raw.toLowerCase();
  if (s.includes("full") || s.includes("permanent")) return "full-time";
  if (s.includes("part")) return "part-time";
  if (s.includes("contract") || s.includes("freelance") || s.includes("temporary")) return "contract";
  if (s.includes("intern")) return "internship";
  return raw.trim();
}

// ─── Country inference ────────────────────────────────────────────────────────

// Stage 1: Complete country name → ISO-2 lookup (all 195 UN member states +
// key territories, with common aliases and native-language names).
const COUNTRY_NAMES: Record<string, string> = {
  // A
  afghanistan: "af", albania: "al", algeria: "dz", andorra: "ad",
  angola: "ao", argentina: "ar", armenia: "am", australia: "au",
  austria: "at", azerbaijan: "az",
  // B
  bahamas: "bs", bahrain: "bh", bangladesh: "bd", barbados: "bb",
  belarus: "by", belgium: "be", belgique: "be", belgie: "be", belgien: "be",
  belize: "bz", benin: "bj", bhutan: "bt", bolivia: "bo",
  "bosnia and herzegovina": "ba", bosnia: "ba", botswana: "bw",
  brazil: "br", brasil: "br", brunei: "bn", bulgaria: "bg",
  "burkina faso": "bf", burundi: "bi",
  // C
  "cabo verde": "cv", "cape verde": "cv", cambodia: "kh", cameroon: "cm",
  canada: "ca", "central african republic": "cf", chad: "td", chile: "cl",
  china: "cn", colombia: "co", comoros: "km", congo: "cg",
  "democratic republic of the congo": "cd", "dr congo": "cd", "drc": "cd",
  "costa rica": "cr", croatia: "hr", cuba: "cu", cyprus: "cy",
  "czech republic": "cz", czechia: "cz",
  // D
  denmark: "dk", danmark: "dk", djibouti: "dj", dominica: "dm",
  "dominican republic": "do",
  // E
  ecuador: "ec", egypt: "eg", "el salvador": "sv",
  "equatorial guinea": "gq", eritrea: "er", estonia: "ee", eswatini: "sz",
  swaziland: "sz", ethiopia: "et",
  // F
  fiji: "fj", finland: "fi", suomi: "fi", france: "fr",
  // G
  gabon: "ga", gambia: "gm", georgia: "ge", germany: "de",
  deutschland: "de", ghana: "gh", greece: "gr", grenada: "gd",
  guatemala: "gt", guinea: "gn", "guinea-bissau": "gw", guyana: "gy",
  // H
  haiti: "ht", honduras: "hn", hungary: "hu",
  // I
  iceland: "is", india: "in", indonesia: "id", iran: "ir", iraq: "iq",
  ireland: "ie", eire: "ie", israel: "il", italy: "it", italia: "it",
  // J
  jamaica: "jm", japan: "jp", jordan: "jo",
  // K
  kazakhstan: "kz", kenya: "ke", kiribati: "ki",
  "north korea": "kp", "south korea": "kr", korea: "kr",
  kosovo: "xk", kuwait: "kw", kyrgyzstan: "kg",
  // L
  laos: "la", latvia: "lv", lebanon: "lb", lesotho: "ls", liberia: "lr",
  libya: "ly", liechtenstein: "li", lithuania: "lt", luxembourg: "lu",
  // M
  madagascar: "mg", malawi: "mw", malaysia: "my", maldives: "mv",
  mali: "ml", malta: "mt", "marshall islands": "mh", mauritania: "mr",
  mauritius: "mu", mexico: "mx",
  micronesia: "fm", moldova: "md", monaco: "mc", mongolia: "mn",
  montenegro: "me", morocco: "ma", mozambique: "mz", myanmar: "mm",
  burma: "mm",
  // N
  namibia: "na", nauru: "nr", nepal: "np", netherlands: "nl",
  nederland: "nl", holland: "nl", "new zealand": "nz", nicaragua: "ni",
  niger: "ne", nigeria: "ng", "north macedonia": "mk", macedonia: "mk",
  norway: "no", norge: "no",
  // O
  oman: "om",
  // P
  pakistan: "pk", palau: "pw", palestine: "ps", panama: "pa",
  "papua new guinea": "pg", paraguay: "py", peru: "pe", philippines: "ph",
  poland: "pl", polska: "pl", portugal: "pt",
  // Q
  qatar: "qa",
  // R
  romania: "ro", russia: "ru", rwanda: "rw",
  // S
  "saint kitts and nevis": "kn", "saint lucia": "lc",
  "saint vincent and the grenadines": "vc", samoa: "ws",
  "san marino": "sm", "sao tome and principe": "st",
  "saudi arabia": "sa", senegal: "sn", serbia: "rs",
  seychelles: "sc", "sierra leone": "sl", singapore: "sg",
  slovakia: "sk", slovenia: "si", "solomon islands": "sb",
  somalia: "so", "south africa": "za", "south sudan": "ss",
  spain: "es", "sri lanka": "lk", sudan: "sd", suriname: "sr",
  sweden: "se", sverige: "se", switzerland: "ch", schweiz: "ch",
  suisse: "ch", svizzera: "ch", syria: "sy",
  // T
  taiwan: "tw", tajikistan: "tj", tanzania: "tz", thailand: "th",
  "timor-leste": "tl", "east timor": "tl", togo: "tg", tonga: "to",
  "trinidad and tobago": "tt", trinidad: "tt", tunisia: "tn",
  turkey: "tr", türkiye: "tr", turkmenistan: "tm", tuvalu: "tv",
  // U
  uganda: "ug", ukraine: "ua",
  "united arab emirates": "ae", uae: "ae",
  "united kingdom": "gb", uk: "gb", "great britain": "gb",
  england: "gb", scotland: "gb", wales: "gb",
  "united states": "us", usa: "us", "u.s.a": "us", "u.s": "us",
  "united states of america": "us",
  uruguay: "uy", uzbekistan: "uz",
  // V
  vanuatu: "vu", venezuela: "ve", vietnam: "vn",
  // Y
  yemen: "ye",
  // Z
  zambia: "zm", zimbabwe: "zw",
  // Key territories often used in job listings
  "hong kong": "hk", "hong kong sar": "hk",
  macau: "mo", macao: "mo",
  "puerto rico": "pr",
};

// Stage 2: 119 K world cities → ISO-2
// Built from GeoNames via all-the-cities (max-population wins for duplicate names).
const CITY_INDEX = new Map<string, string>(
  Object.entries(_citiesJson as Record<string, string>)
);

// Supplemental overrides: aliases and high-value phrases not in the GeoNames dataset,
// or where the dataset's max-population winner is wrong for job-listing context.
// Organised by region; entries here take precedence over the 119K city index.
const CITY_OVERRIDES: Record<string, string> = {

  // ── Global remote signals ────────────────────────────────────────────────────
  // Only truly stateless listings qualify — "Remote, US" is still a US job.
  anywhere: "remote", worldwide: "remote",
  "globally remote": "remote", "remote worldwide": "remote",
  "remote global": "remote", "open to all locations": "remote",

  // ── Europe ───────────────────────────────────────────────────────────────────

  // Belgium — GeoNames often picks small US towns over major Belgian cities
  antwerp: "be",            // GeoNames → Antwerp, Ohio
  ghent: "be",              // dataset only has Flemish "gent"
  bruges: "be",             // dataset has a Bruges in France
  liege: "be", luik: "be", lüttich: "be",
  leuven: "be", louvain: "be",
  mechelen: "be", hasselt: "be", kortrijk: "be",
  ostend: "be", ostende: "be",
  genk: "be", aalst: "be", mons: "be", namur: "be",

  // Germany
  cologne: "de",            // GeoNames → small Italian town
  münchen: "de",            // accented form missing
  nuremberg: "de",          // English vs "nürnberg"
  dusseldorf: "de",         // unaccented vs "düsseldorf"
  frankfurt: "de",          // explicit safety net

  // Switzerland
  zurich: "ch",             // GeoNames has "zürich" with accent
  geneva: "ch",             // GeoNames → Geneva, NY (US)
  genève: "ch",
  berne: "ch",              // alternate spelling of Bern

  // Netherlands
  "the hague": "nl", "den haag": "nl",
  rotterdam: "nl",

  // Poland
  krakow: "pl",             // GeoNames only has "kraków"
  wroclaw: "pl",            // vs "wrocław"
  gdansk: "pl",             // vs "gdańsk"
  poznan: "pl",             // vs "poznań"
  lodz: "pl",               // vs "łódź"

  // Czech Republic
  prague: "cz",

  // Slovakia
  bratislava: "sk",

  // Hungary
  budapest: "hu",

  // Romania
  bucharest: "ro",
  "cluj-napoca": "ro", cluj: "ro",

  // Bulgaria
  sofia: "bg",
  plovdiv: "bg",

  // Serbia
  belgrade: "rs",
  beograd: "rs",

  // Croatia
  zagreb: "hr",

  // Slovenia
  ljubljana: "si",

  // Bosnia
  sarajevo: "ba",

  // North Macedonia
  skopje: "mk",

  // Albania
  tirana: "al",

  // Moldova
  chisinau: "md", chișinău: "md",

  // Ukraine
  kyiv: "ua", kiev: "ua",
  kharkiv: "ua", odessa: "ua", lviv: "ua",

  // Belarus
  minsk: "by",

  // Baltic states (safety net — already in GeoNames but low confidence)
  tallinn: "ee",
  riga: "lv",
  vilnius: "lt",
  kaunas: "lt",

  // Russia
  moscow: "ru",
  "saint petersburg": "ru", "st. petersburg": "ru", "st petersburg": "ru",
  novosibirsk: "ru", yekaterinburg: "ru", ekaterinburg: "ru",

  // Scandinavia / Iceland
  reykjavik: "is",          // missing from GeoNames dataset
  // Sweden
  stockholm: "se",
  gothenburg: "se",         // English name; GeoNames has "göteborg"
  "göteborg": "se",
  malmo: "se", "malmö": "se",
  uppsala: "se",
  linköping: "se", linkoping: "se",
  örebro: "se", orebro: "se",
  västerås: "se", vasteras: "se",
  helsingborg: "se",
  norrköping: "se", norrkoping: "se",
  jönköping: "se", jonkoping: "se",
  umeå: "se", umea: "se",
  // Norway
  oslo: "no",
  bergen: "no",
  trondheim: "no",
  stavanger: "no",
  kristiansand: "no",
  // Finland
  helsinki: "fi",
  tampere: "fi",
  turku: "fi",
  espoo: "fi",
  vantaa: "fi",
  oulu: "fi",
  // Denmark
  copenhagen: "dk",
  aarhus: "dk", "århus": "dk",
  odense: "dk",
  aalborg: "dk",

  // Southern / Mediterranean Europe
  athens: "gr",
  thessaloniki: "gr",
  nicosia: "cy",

  // Luxembourg / Monaco / Liechtenstein
  luxembourg: "lu",         // city name same as country

  // Baltic & Caucasus
  tbilisi: "ge",
  yerevan: "am",
  baku: "az",

  // ── Middle East & Central Asia ────────────────────────────────────────────────

  "tel aviv": "il",
  "abu dhabi": "ae",
  dubai: "ae",
  sharjah: "ae",
  riyadh: "sa", jeddah: "sa", mecca: "sa",
  "al khobar": "sa", dammam: "sa",
  doha: "qa",
  muscat: "om", salalah: "om",
  manama: "bh",
  "kuwait city": "kw",
  amman: "jo",
  beirut: "lb",
  damascus: "sy",
  baghdad: "iq",
  tehran: "ir",
  ankara: "tr",
  istanbul: "tr",

  // Central Asia
  tashkent: "uz",
  samarkand: "uz",
  bishkek: "kg",
  dushanbe: "tj",
  astana: "kz",             // Kazakhstan capital (was Nursultan 2019–2022)
  nursultan: "kz",          // former name still used in older listings
  almaty: "kz",
  ashgabat: "tm",
  ulaanbaatar: "mn",        // Mongolia capital — missing from GeoNames

  // ── South Asia ────────────────────────────────────────────────────────────────

  "new delhi": "in",
  delhi: "in",
  bangalore: "in",          // English name; GeoNames has "bengaluru"
  bombay: "in",             // old name for Mumbai
  mumbai: "in",
  kolkata: "in", calcutta: "in",
  chennai: "in", madras: "in",
  hyderabad: "in",
  pune: "in",
  ahmedabad: "in",
  surat: "in",
  jaipur: "in",
  lucknow: "in",
  karachi: "pk",
  lahore: "pk",
  islamabad: "pk",
  dhaka: "bd",
  chittagong: "bd",
  kathmandu: "np",
  colombo: "lk",
  kabul: "af",

  // ── Southeast & East Asia ─────────────────────────────────────────────────────

  yangon: "mm", rangoon: "mm",
  naypyidaw: "mm",          // Myanmar capital — missing from GeoNames
  "ho chi minh city": "vn", "ho chi minh": "vn",
  hanoi: "vn",
  "kuala lumpur": "my",
  "phnom penh": "kh",
  vientiane: "la",
  "chiang mai": "th",
  bangkok: "th",
  "hong kong": "hk",
  "hong kong sar": "hk",
  macau: "mo", macao: "mo",
  taipei: "tw",
  beijing: "cn",
  shanghai: "cn",
  shenzhen: "cn",
  guangzhou: "cn",
  chengdu: "cn",
  xian: "cn",               // Xi'an — plain ASCII form missing from dataset
  "xi'an": "cn",
  wuhan: "cn",
  chongqing: "cn",
  hangzhou: "cn",
  nanjing: "cn",
  tianjin: "cn",
  tokyo: "jp",
  osaka: "jp",
  seoul: "kr",
  busan: "kr",
  singapore: "sg",
  jakarta: "id",
  surabaya: "id",
  manila: "ph",

  // ── Oceania ───────────────────────────────────────────────────────────────────

  sydney: "au",
  melbourne: "au",
  brisbane: "au",
  perth: "au",
  adelaide: "au",
  canberra: "au",
  "gold coast": "au",
  auckland: "nz",
  wellington: "nz",
  christchurch: "nz",
  suva: "fj",
  "port moresby": "pg",
  "port vila": "vu",        // Vanuatu capital — missing from GeoNames
  "nuku'alofa": "to",       // Tonga capital — missing from GeoNames
  nukualofa: "to",

  // ── Africa ────────────────────────────────────────────────────────────────────

  cairo: "eg",
  alexandria: "eg",
  casablanca: "ma",
  rabat: "ma",
  algiers: "dz",
  tunis: "tn",
  tripoli: "ly",
  khartoum: "sd",
  juba: "ss",
  "addis ababa": "et",
  asmara: "er",
  djibouti: "dj",
  nairobi: "ke",
  mombasa: "ke",
  kampala: "ug",
  kigali: "rw",
  bujumbura: "bi",
  "dar es salaam": "tz",
  dodoma: "tz",
  lusaka: "zm",
  harare: "zw",
  maputo: "mz",
  lilongwe: "mw",
  antananarivo: "mg",
  johannesburg: "za",
  "cape town": "za",
  pretoria: "za",
  durban: "za",
  windhoek: "na",
  gaborone: "bw",
  maseru: "ls",
  mbabane: "sz",
  luanda: "ao",
  kinshasa: "cd",
  brazzaville: "cg",
  abidjan: "ci",
  yamoussoukro: "ci",
  "ivory coast": "ci",
  accra: "gh",
  lagos: "ng",
  abuja: "ng",
  kano: "ng",
  dakar: "sn",
  conakry: "gn",
  freetown: "sl",
  monrovia: "lr",
  bamako: "ml",
  ouagadougou: "bf",
  niamey: "ne",
  "n'djamena": "td",
  bangui: "cf",
  yaounde: "cm",            // Yaoundé — plain ASCII missing from GeoNames
  "yaoundé": "cm",
  douala: "cm",
  libreville: "ga",
  lome: "tg",               // Lomé — plain ASCII missing from GeoNames
  "lomé": "tg",
  "porto-novo": "bj",
  cotonou: "bj",
  malabo: "gq",
  moroni: "km",
  "port louis": "mu",
  victoria: "sc",           // Seychelles capital (context-dependent — also Victoria, BC)

  // ── Americas ─────────────────────────────────────────────────────────────────

  // USA multi-word cities (GeoNames omits spaces or misses plain forms)
  "new york": "us",
  "new york city": "us",
  "los angeles": "us",
  "san francisco": "us",
  "las vegas": "us",
  "salt lake city": "us",
  "kansas city": "us",
  "new orleans": "us",
  "san jose": "us",         // San Jose CA (1M) > San José CR (340K)

  // Canada
  toronto: "ca",
  montreal: "ca",           // "montréal" is correct in GeoNames; plain ASCII missing
  "montréal": "ca",
  vancouver: "ca",
  calgary: "ca",
  edmonton: "ca",
  ottawa: "ca",
  winnipeg: "ca",
  "quebec city": "ca",

  // Mexico
  "mexico city": "mx",
  guadalajara: "mx",
  monterrey: "mx",

  // Caribbean
  havana: "cu",
  "santo domingo": "do",
  "port-au-prince": "ht",

  // Central America
  "guatemala city": "gt",
  "san salvador": "sv",
  managua: "ni",
  tegucigalpa: "hn",
  "panama city": "pa",      // Panama City, Panama (1.5M) > Panama City, FL (36K)

  // South America
  "buenos aires": "ar",
  cordoba: "ar",            // Córdoba, AR (1.3M) — missing from GeoNames
  "córdoba": "ar",
  rosario: "ar",
  bogota: "co",             // GeoNames maps "bogota" → US (Bogota, NJ); Bogotá CO has 10M
  "bogotá": "co",
  medellin: "co",           // GeoNames maps "medellin" → PH; Medellín CO has 2.5M
  "medellín": "co",
  cali: "co",
  caracas: "ve",
  lima: "pe",
  santiago: "cl",
  quito: "ec",
  "la paz": "bo",
  asuncion: "py",           // Asunción — plain ASCII missing from GeoNames
  "asunción": "py",
  montevideo: "uy",
  "sao paulo": "br",
  "são paulo": "br",
  brasilia: "br",           // Brasília — plain ASCII missing from GeoNames
  "brasília": "br",
  "rio de janeiro": "br",
  "belo horizonte": "br",
  salvador: "br",           // Salvador, Bahia — but also "salvador" elsewhere; low confidence
  paramaribo: "sr",
  georgetown: "gy",

  // San Marino (the country) — GeoNames "san marino" maps to a US city
  "san marino": "sm",
};

// US state abbreviations regex ("Jacksonville, FL" → "us")
const US_STATE_ABBREV = /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s*$/i;

/** Look up a phrase (1–3 words) in supplemental overrides then the 119K city index. */
function cityLookup(phrase: string): string | undefined {
  return CITY_OVERRIDES[phrase] ?? CITY_INDEX.get(phrase);
}

export function inferCountry(location: string, queryCountry = ""): string {
  if (!location) return queryCountry; // empty location → fall back to query country

  const loc = location.toLowerCase().trim();

  // 1. Supplemental overrides – exact substring match for multi-word phrases
  for (const phrase of Object.keys(CITY_OVERRIDES)) {
    if (phrase.includes(" ") && loc.includes(phrase)) return CITY_OVERRIDES[phrase];
  }

  // 2. Country name whole-word match
  for (const [name, code] of Object.entries(COUNTRY_NAMES)) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(loc)) return code;
  }

  // 3. N-gram city lookup (3-word → 2-word → 1-word), O(1) per combo
  const tokens = loc.split(/[\s,/()|]+/).filter((t) => t.length >= 2);
  for (let i = 0; i < tokens.length; i++) {
    // Try 3-word phrase
    if (i + 2 < tokens.length) {
      const hit = cityLookup(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
      if (hit) return hit;
    }
    // Try 2-word phrase
    if (i + 1 < tokens.length) {
      const hit = cityLookup(`${tokens[i]} ${tokens[i + 1]}`);
      if (hit) return hit;
    }
    // Try single token
    if (tokens[i].length >= 3) {
      const hit = cityLookup(tokens[i]);
      if (hit) return hit;
    }
  }

  // 4. US state abbreviation fallback ("Jacksonville, FL")
  if (US_STATE_ABBREV.test(location)) return "us";

  // 5. Nothing matched — use the query country as last resort
  return queryCountry;
}

// ─── Seniority ────────────────────────────────────────────────────────────────

export function inferSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/\b(vp|vice president|cto|ceo|coo|chief)\b/.test(t)) return "executive";
  if (/\b(director|head of|principal)\b/.test(t)) return "director";
  if (/\b(senior|sr\.?|lead|staff|architect)\b/.test(t)) return "senior";
  if (/\b(junior|jr\.?|graduate|entry.?level|associate)\b/.test(t)) return "junior";
  if (/\b(intern|trainee|apprentice)\b/.test(t)) return "intern";
  if (/\b(mid|middle|intermediate)\b/.test(t)) return "mid";
  return "";
}

// ─── Location normalization ───────────────────────────────────────────────────

export function normalizeLocation(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ",")
    .trim();
}

// ─── Canonical key ────────────────────────────────────────────────────────────

/**
 * Build a stable canonical key from title + company + location.
 * Falls back to source + externalId when available.
 *
 * The key is a short SHA-256 prefix so it's compact and collision-resistant.
 */
export function buildCanonicalKey(job: {
  title: string;
  company?: string;
  location?: string;
  source?: string;
  externalId?: string;
}): string {
  const { title, company = "", location = "", source, externalId } = job;

  // Prefer source + externalId for ATS jobs (stable, unique)
  if (source && externalId) {
    const raw = `${source}::${externalId}`;
    return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  }

  // Fall back to normalized title + company + location
  const normalized = [title, company, location]
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("::");
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

// ─── Full job normalization helper ────────────────────────────────────────────
// Applies all inference functions to a partially-constructed UnifiedJob

export function applyNormalization(job: UnifiedJob, queryCountry = ""): UnifiedJob {
  const location = normalizeLocation(job.location);
  const description = sanitizeDescription(job.description);
  const remote = job.remote || inferRemoteFlag(job.title, location);
  const employmentType = job.employmentType || inferEmploymentType(job.employmentType);
  const seniority = job.seniority || inferSeniority(job.title);
  const country = job.country || inferCountry(location, queryCountry);
  const canonicalKey = buildCanonicalKey({
    title: job.title,
    company: job.company,
    location,
    source: job.source,
    externalId: job.externalId,
  });

  return {
    ...job,
    location,
    description,
    remote,
    employmentType,
    seniority,
    country,
    metadata: { ...job.metadata, canonicalKey },
  };
}

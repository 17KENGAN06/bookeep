/**
 * SEO copy and helpers shared by the app (DocumentTitle) and the build (vite.config.ts prerender).
 * Keep this file free of `@/` imports and browser globals: Node loads it at build time.
 */

export const SEO_LANGUAGES = ['en', 'fi', 'uk', 'ru', 'pl', 'de', 'fr', 'it', 'es'] as const;
export type SeoLanguage = (typeof SEO_LANGUAGES)[number];

/** The language a URL without `?lang=` shows to crawlers. It is also x-default. */
export const DEFAULT_SEO_LANGUAGE: SeoLanguage = 'en';
export const LANG_QUERY_PARAM = 'lang';

export const SITE_NAME = 'Bookeep';
export const OG_IMAGE_PATH = '/og-image.png';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const LOGO_PATH = '/icon-512.png';

export const OG_LOCALES: Record<SeoLanguage, string> = {
  en: 'en_US',
  fi: 'fi_FI',
  uk: 'uk_UA',
  ru: 'ru_RU',
  pl: 'pl_PL',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
  es: 'es_ES',
};

export type SeoPageKey = 'home' | 'books' | 'about' | 'contact' | 'privacy' | 'subscribe';

/** Public, indexable pages with their own copy. Order is the sitemap order. */
export const SEO_PAGES: { path: string; key: SeoPageKey; changefreq: string; priority: string }[] = [
  { path: '/', key: 'home', changefreq: 'weekly', priority: '1.0' },
  { path: '/books', key: 'books', changefreq: 'daily', priority: '0.9' },
  { path: '/about', key: 'about', changefreq: 'monthly', priority: '0.7' },
  { path: '/subscribe', key: 'subscribe', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', key: 'contact', changefreq: 'yearly', priority: '0.5' },
  { path: '/privacy', key: 'privacy', changefreq: 'yearly', priority: '0.3' },
];

type PageCopy = { title: string; description: string };
type BookLang = 'en' | 'fi';

type SeoCopy = {
  pages: Record<SeoPageKey, PageCopy>;
  keywords: string;
  /** "English" / "Finnish" as it fits into the book title and description templates. */
  bookLanguage: Record<BookLang, string>;
  bookTitle: (title: string, language: string, level: string) => string;
  bookDescription: (title: string, language: string, level: string) => string;
  /** Breadcrumb label for the catalog. */
  catalog: string;
};

export const SEO_COPY: Record<SeoLanguage, SeoCopy> = {
  en: {
    pages: {
      home: {
        title: 'Bookeep — adapted English & Finnish books for A2–B1',
        description:
          'Read adapted books in English and Finnish. Stories rewritten for A2–B1 learners: the plot stays, the language gets clearer. Read online in your browser.',
      },
      books: {
        title: 'Adapted books catalog — English & Finnish, A2–B1 · Bookeep',
        description:
          'Browse adapted books in English and Finnish. Filter by language and CEFR level (A2, B1), open a free preview and read right in the browser.',
      },
      about: {
        title: 'How Bookeep adapts books for language learners',
        description:
          'How Bookeep rewrites English and Finnish books for A2–B1 readers: simpler language, the same story and structure, and a calm reader in the browser.',
      },
      contact: {
        title: 'Contact Bookeep — partnerships and support',
        description:
          'A question, a bug or a partnership idea? Write to the Bookeep team about adapted books in English and Finnish.',
      },
      privacy: {
        title: 'Privacy policy · Bookeep',
        description:
          'How Bookeep collects, uses and protects your data when you read adapted books, sign in or subscribe.',
      },
      subscribe: {
        title: 'Subscription — full access to adapted books · Bookeep',
        description:
          'Full access to every adapted English and Finnish book on Bookeep. Read whole books online at A2–B1 level, with reading goals and progress.',
      },
    },
    keywords:
      'adapted books, graded readers, English books for learners, Finnish books for learners, selkokirjat, A2, B1, read online, Bookeep',
    bookLanguage: { en: 'English', fi: 'Finnish' },
    bookTitle: (title, language, level) => `${title} — adapted ${language} book (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: an adapted ${language} edition for ${level} learners. Read a free preview online on Bookeep.`,
    catalog: 'Books',
  },
  fi: {
    pages: {
      home: {
        title: 'Bookeep — mukautetut kirjat englanniksi ja suomeksi, A2–B1',
        description:
          'Lue mukautettuja kirjoja englanniksi ja suomeksi. Tarinat on kirjoitettu uudelleen A2–B1-tason lukijoille: juoni säilyy, kieli selkenee. Lue verkossa.',
      },
      books: {
        title: 'Mukautettujen kirjojen luettelo — englanti ja suomi · Bookeep',
        description:
          'Selaa mukautettuja kirjoja englanniksi ja suomeksi. Suodata kielen ja tason (A2, B1) mukaan, avaa ilmainen näyte ja lue suoraan selaimessa.',
      },
      about: {
        title: 'Miten Bookeep mukauttaa kirjoja kielenoppijoille',
        description:
          'Näin Bookeep kirjoittaa englannin- ja suomenkielisiä kirjoja uudelleen A2–B1-lukijoille: selkeämpi kieli, sama tarina ja rauhallinen lukunäkymä selaimessa.',
      },
      contact: {
        title: 'Ota yhteyttä Bookeepiin — yhteistyö ja tuki',
        description:
          'Kysyttävää, virhe tai yhteistyöidea? Kirjoita Bookeepin tiimille mukautetuista englannin- ja suomenkielisistä kirjoista.',
      },
      privacy: {
        title: 'Tietosuojaseloste · Bookeep',
        description:
          'Miten Bookeep kerää, käyttää ja suojaa tietojasi, kun luet mukautettuja kirjoja, kirjaudut sisään tai tilaat.',
      },
      subscribe: {
        title: 'Tilaus — kaikki mukautetut kirjat · Bookeep',
        description:
          'Kaikki Bookeepin mukautetut englannin- ja suomenkieliset kirjat. Lue kokonaisia kirjoja verkossa A2–B1-tasolla lukutavoitteiden ja edistymisen kanssa.',
      },
    },
    keywords:
      'mukautetut kirjat, selkokirjat, selkosuomi, suomen kielen oppiminen, englanninkieliset kirjat, A2, B1, lue verkossa, Bookeep',
    bookLanguage: { en: 'englanninkielinen', fi: 'suomenkielinen' },
    bookTitle: (title, language, level) => `${title} — mukautettu ${language} kirja (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: mukautettu ${language} laitos ${level}-tason lukijoille. Lue ilmainen näyte verkossa Bookeepissa.`,
    catalog: 'Kirjat',
  },
  uk: {
    pages: {
      home: {
        title: 'Bookeep — адаптовані книги англійською та фінською A2–B1',
        description:
          'Читайте адаптовані книги англійською та фінською. Історії переписані для рівнів A2–B1: сюжет зберігається, мова стає зрозумілішою. Читання онлайн.',
      },
      books: {
        title: 'Каталог адаптованих книг англійською та фінською · Bookeep',
        description:
          'Адаптовані книги англійською та фінською. Фільтр за мовою та рівнем (A2, B1), безкоштовний уривок і читання прямо в браузері.',
      },
      about: {
        title: 'Як Bookeep адаптує книги для вивчення мов',
        description:
          'Як Bookeep переписує англійські та фінські книги для читачів рівня A2–B1: простіша мова, той самий сюжет і спокійна читалка в браузері.',
      },
      contact: {
        title: 'Контакти Bookeep — співпраця та підтримка',
        description:
          'Питання, помилка чи ідея для співпраці? Напишіть команді Bookeep про адаптовані книги англійською та фінською.',
      },
      privacy: {
        title: 'Політика конфіденційності · Bookeep',
        description:
          'Як Bookeep збирає, використовує та захищає ваші дані, коли ви читаєте адаптовані книги, входите в акаунт чи оформлюєте підписку.',
      },
      subscribe: {
        title: 'Підписка — повний доступ до адаптованих книг · Bookeep',
        description:
          'Повний доступ до всіх адаптованих книг англійською та фінською на Bookeep. Читайте книги повністю онлайн на рівні A2–B1 з цілями читання.',
      },
    },
    keywords:
      'адаптовані книги, книги англійською для початківців, фінська мова, книги фінською, A2, B1, читати онлайн, Bookeep',
    bookLanguage: { en: 'англійською', fi: 'фінською' },
    bookTitle: (title, language, level) => `${title} — адаптована книга ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: адаптоване видання ${language} для рівня ${level}. Безкоштовний уривок онлайн на Bookeep.`,
    catalog: 'Книги',
  },
  ru: {
    pages: {
      home: {
        title: 'Bookeep — адаптированные книги на английском и финском A2–B1',
        description:
          'Читайте адаптированные книги на английском и финском. Истории переписаны для уровней A2–B1: сюжет сохраняется, язык становится понятнее. Чтение онлайн.',
      },
      books: {
        title: 'Каталог адаптированных книг на английском и финском · Bookeep',
        description:
          'Адаптированные книги на английском и финском. Фильтр по языку и уровню (A2, B1), бесплатный отрывок и чтение прямо в браузере.',
      },
      about: {
        title: 'Как Bookeep адаптирует книги для изучения языков',
        description:
          'Как Bookeep переписывает английские и финские книги для читателей уровня A2–B1: проще язык, тот же сюжет и спокойная читалка в браузере.',
      },
      contact: {
        title: 'Контакты Bookeep — сотрудничество и поддержка',
        description:
          'Вопрос, ошибка или идея для сотрудничества? Напишите команде Bookeep об адаптированных книгах на английском и финском.',
      },
      privacy: {
        title: 'Политика конфиденциальности · Bookeep',
        description:
          'Как Bookeep собирает, использует и защищает ваши данные, когда вы читаете адаптированные книги, входите в аккаунт или оформляете подписку.',
      },
      subscribe: {
        title: 'Подписка — полный доступ к адаптированным книгам · Bookeep',
        description:
          'Полный доступ ко всем адаптированным книгам на английском и финском в Bookeep. Читайте книги целиком онлайн на уровне A2–B1 с целями чтения.',
      },
    },
    keywords:
      'адаптированные книги, книги на английском для начинающих, финский язык, книги на финском, A2, B1, читать онлайн, Bookeep',
    bookLanguage: { en: 'английском', fi: 'финском' },
    bookTitle: (title, language, level) => `${title} — адаптированная книга на ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: адаптированное издание на ${language} для уровня ${level}. Бесплатный отрывок онлайн на Bookeep.`,
    catalog: 'Книги',
  },
  pl: {
    pages: {
      home: {
        title: 'Bookeep — adaptowane książki po angielsku i fińsku A2–B1',
        description:
          'Czytaj adaptowane książki po angielsku i fińsku. Historie przepisane dla poziomu A2–B1: fabuła zostaje, język staje się jaśniejszy. Czytanie online.',
      },
      books: {
        title: 'Katalog adaptowanych książek — angielski i fiński · Bookeep',
        description:
          'Adaptowane książki po angielsku i fińsku. Filtruj według języka i poziomu (A2, B1), otwórz darmowy fragment i czytaj w przeglądarce.',
      },
      about: {
        title: 'Jak Bookeep adaptuje książki do nauki języków',
        description:
          'Jak Bookeep przepisuje angielskie i fińskie książki dla czytelników A2–B1: prostszy język, ta sama fabuła i spokojny czytnik w przeglądarce.',
      },
      contact: {
        title: 'Kontakt z Bookeep — współpraca i wsparcie',
        description:
          'Pytanie, błąd lub pomysł na współpracę? Napisz do zespołu Bookeep w sprawie adaptowanych książek po angielsku i fińsku.',
      },
      privacy: {
        title: 'Polityka prywatności · Bookeep',
        description:
          'Jak Bookeep zbiera, wykorzystuje i chroni Twoje dane, gdy czytasz adaptowane książki, logujesz się lub wykupujesz subskrypcję.',
      },
      subscribe: {
        title: 'Subskrypcja — pełny dostęp do adaptowanych książek · Bookeep',
        description:
          'Pełny dostęp do wszystkich adaptowanych książek po angielsku i fińsku w Bookeep. Czytaj całe książki online na poziomie A2–B1 z celami czytelniczymi.',
      },
    },
    keywords:
      'adaptowane książki, książki po angielsku dla początkujących, język fiński, książki po fińsku, A2, B1, czytaj online, Bookeep',
    bookLanguage: { en: 'po angielsku', fi: 'po fińsku' },
    bookTitle: (title, language, level) => `${title} — adaptowana książka ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: adaptowane wydanie ${language} dla poziomu ${level}. Darmowy fragment online w Bookeep.`,
    catalog: 'Książki',
  },
  de: {
    pages: {
      home: {
        title: 'Bookeep — vereinfachte Bücher auf Englisch & Finnisch, A2–B1',
        description:
          'Lies vereinfachte Bücher auf Englisch und Finnisch. Geschichten neu geschrieben für A2–B1: Die Handlung bleibt, die Sprache wird klarer. Online lesen.',
      },
      books: {
        title: 'Katalog vereinfachter Bücher — Englisch & Finnisch · Bookeep',
        description:
          'Vereinfachte Bücher auf Englisch und Finnisch. Nach Sprache und Niveau (A2, B1) filtern, kostenlose Leseprobe öffnen und im Browser lesen.',
      },
      about: {
        title: 'Wie Bookeep Bücher für Sprachlernende vereinfacht',
        description:
          'Wie Bookeep englische und finnische Bücher für A2–B1 neu schreibt: einfachere Sprache, dieselbe Geschichte und ein ruhiger Reader im Browser.',
      },
      contact: {
        title: 'Kontakt zu Bookeep — Partnerschaften und Support',
        description:
          'Eine Frage, ein Fehler oder eine Idee für eine Zusammenarbeit? Schreib dem Bookeep-Team zu vereinfachten Büchern auf Englisch und Finnisch.',
      },
      privacy: {
        title: 'Datenschutzerklärung · Bookeep',
        description:
          'Wie Bookeep deine Daten erhebt, nutzt und schützt, wenn du vereinfachte Bücher liest, dich anmeldest oder ein Abo abschließt.',
      },
      subscribe: {
        title: 'Abo — voller Zugang zu vereinfachten Büchern · Bookeep',
        description:
          'Voller Zugang zu allen vereinfachten Büchern auf Englisch und Finnisch bei Bookeep. Ganze Bücher online lesen auf Niveau A2–B1, mit Lesezielen.',
      },
    },
    keywords:
      'vereinfachte Bücher, Lektüre für Sprachlernende, Englisch lesen, Finnisch lernen, finnische Bücher, A2, B1, online lesen, Bookeep',
    bookLanguage: { en: 'Englisch', fi: 'Finnisch' },
    bookTitle: (title, language, level) => `${title} — vereinfachtes Buch auf ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: vereinfachte Ausgabe auf ${language} für Niveau ${level}. Kostenlose Leseprobe online bei Bookeep.`,
    catalog: 'Bücher',
  },
  fr: {
    pages: {
      home: {
        title: 'Bookeep — livres adaptés en anglais et finnois, A2–B1',
        description:
          'Lisez des livres adaptés en anglais et en finnois. Des histoires réécrites pour le niveau A2–B1 : l’intrigue reste, la langue devient plus claire. Lecture en ligne.',
      },
      books: {
        title: 'Catalogue de livres adaptés — anglais et finnois · Bookeep',
        description:
          'Livres adaptés en anglais et en finnois. Filtrez par langue et niveau (A2, B1), ouvrez un extrait gratuit et lisez dans le navigateur.',
      },
      about: {
        title: 'Comment Bookeep adapte les livres pour apprendre une langue',
        description:
          'Comment Bookeep réécrit des livres anglais et finnois pour les lecteurs A2–B1 : une langue plus simple, la même histoire et une liseuse calme dans le navigateur.',
      },
      contact: {
        title: 'Contacter Bookeep — partenariats et assistance',
        description:
          'Une question, un bug ou une idée de partenariat ? Écrivez à l’équipe Bookeep au sujet des livres adaptés en anglais et en finnois.',
      },
      privacy: {
        title: 'Politique de confidentialité · Bookeep',
        description:
          'Comment Bookeep collecte, utilise et protège vos données lorsque vous lisez des livres adaptés, vous connectez ou vous abonnez.',
      },
      subscribe: {
        title: 'Abonnement — accès complet aux livres adaptés · Bookeep',
        description:
          'Accès complet à tous les livres adaptés en anglais et en finnois sur Bookeep. Lisez des livres entiers en ligne au niveau A2–B1, avec des objectifs de lecture.',
      },
    },
    keywords:
      'livres adaptés, lectures graduées, livres en anglais pour débutants, apprendre le finnois, livres en finnois, A2, B1, lire en ligne, Bookeep',
    bookLanguage: { en: 'anglais', fi: 'finnois' },
    bookTitle: (title, language, level) => `${title} — livre adapté en ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title} : édition adaptée en ${language} pour le niveau ${level}. Extrait gratuit en ligne sur Bookeep.`,
    catalog: 'Livres',
  },
  it: {
    pages: {
      home: {
        title: 'Bookeep — libri adattati in inglese e finlandese, A2–B1',
        description:
          'Leggi libri adattati in inglese e finlandese. Storie riscritte per il livello A2–B1: la trama resta, la lingua diventa più chiara. Lettura online.',
      },
      books: {
        title: 'Catalogo di libri adattati — inglese e finlandese · Bookeep',
        description:
          'Libri adattati in inglese e finlandese. Filtra per lingua e livello (A2, B1), apri un’anteprima gratuita e leggi nel browser.',
      },
      about: {
        title: 'Come Bookeep adatta i libri per chi studia le lingue',
        description:
          'Come Bookeep riscrive libri inglesi e finlandesi per lettori A2–B1: lingua più semplice, la stessa storia e un lettore tranquillo nel browser.',
      },
      contact: {
        title: 'Contatta Bookeep — collaborazioni e supporto',
        description:
          'Una domanda, un bug o un’idea di collaborazione? Scrivi al team di Bookeep sui libri adattati in inglese e finlandese.',
      },
      privacy: {
        title: 'Informativa sulla privacy · Bookeep',
        description:
          'Come Bookeep raccoglie, usa e protegge i tuoi dati quando leggi libri adattati, accedi o ti abboni.',
      },
      subscribe: {
        title: 'Abbonamento — accesso completo ai libri adattati · Bookeep',
        description:
          'Accesso completo a tutti i libri adattati in inglese e finlandese su Bookeep. Leggi libri interi online al livello A2–B1, con obiettivi di lettura.',
      },
    },
    keywords:
      'libri adattati, letture graduate, libri in inglese per principianti, imparare il finlandese, libri in finlandese, A2, B1, leggere online, Bookeep',
    bookLanguage: { en: 'inglese', fi: 'finlandese' },
    bookTitle: (title, language, level) => `${title} — libro adattato in ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: edizione adattata in ${language} per il livello ${level}. Anteprima gratuita online su Bookeep.`,
    catalog: 'Libri',
  },
  es: {
    pages: {
      home: {
        title: 'Bookeep — libros adaptados en inglés y finés, A2–B1',
        description:
          'Lee libros adaptados en inglés y finés. Historias reescritas para el nivel A2–B1: la trama se mantiene y el idioma se vuelve más claro. Lectura online.',
      },
      books: {
        title: 'Catálogo de libros adaptados — inglés y finés · Bookeep',
        description:
          'Libros adaptados en inglés y finés. Filtra por idioma y nivel (A2, B1), abre un fragmento gratuito y lee en el navegador.',
      },
      about: {
        title: 'Cómo Bookeep adapta libros para aprender idiomas',
        description:
          'Cómo Bookeep reescribe libros en inglés y finés para lectores A2–B1: un idioma más sencillo, la misma historia y un lector tranquilo en el navegador.',
      },
      contact: {
        title: 'Contacto con Bookeep — colaboraciones y soporte',
        description:
          '¿Una pregunta, un error o una idea de colaboración? Escribe al equipo de Bookeep sobre libros adaptados en inglés y finés.',
      },
      privacy: {
        title: 'Política de privacidad · Bookeep',
        description:
          'Cómo Bookeep recoge, usa y protege tus datos cuando lees libros adaptados, inicias sesión o te suscribes.',
      },
      subscribe: {
        title: 'Suscripción — acceso completo a libros adaptados · Bookeep',
        description:
          'Acceso completo a todos los libros adaptados en inglés y finés de Bookeep. Lee libros completos online en nivel A2–B1, con objetivos de lectura.',
      },
    },
    keywords:
      'libros adaptados, lecturas graduadas, libros en inglés para principiantes, aprender finés, libros en finés, A2, B1, leer online, Bookeep',
    bookLanguage: { en: 'inglés', fi: 'finés' },
    bookTitle: (title, language, level) => `${title} — libro adaptado en ${language} (${level}) · Bookeep`,
    bookDescription: (title, language, level) =>
      `${title}: edición adaptada en ${language} para el nivel ${level}. Fragmento gratuito online en Bookeep.`,
    catalog: 'Libros',
  },
};

export function toSeoLanguage(language?: string | null): SeoLanguage {
  const code = (language ?? '').toLowerCase().split('-')[0];
  return (SEO_LANGUAGES as readonly string[]).includes(code) ? (code as SeoLanguage) : DEFAULT_SEO_LANGUAGE;
}

export function pageKeyForPath(pathname: string): SeoPageKey | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return SEO_PAGES.find((page) => page.path === clean)?.key ?? null;
}

/** `/books` in English, `/books?lang=fi` in Finnish. */
export function localizedUrl(origin: string, pathname: string, language: SeoLanguage) {
  const base = `${origin}${pathname}`;
  return language === DEFAULT_SEO_LANGUAGE ? base : `${base}?${LANG_QUERY_PARAM}=${language}`;
}

export function hreflangAlternates(origin: string, pathname: string) {
  return [
    ...SEO_LANGUAGES.map((language) => ({ hreflang: language, href: localizedUrl(origin, pathname, language) })),
    { hreflang: 'x-default', href: localizedUrl(origin, pathname, DEFAULT_SEO_LANGUAGE) },
  ];
}

export function truncateMeta(text: string, max = 160) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}

export type SeoBook = {
  slug: string;
  title: string;
  description: string;
  language: string;
  level: string;
  cover: string | null;
  pageCount?: number | null;
  updatedAt?: string | null;
};

export function bookSeoText(book: Pick<SeoBook, 'title' | 'description' | 'language' | 'level'>, language: SeoLanguage) {
  const copy = SEO_COPY[language];
  const languageName = copy.bookLanguage[book.language === 'fi' ? 'fi' : 'en'];
  return {
    title: copy.bookTitle(book.title, languageName, book.level),
    description: truncateMeta(book.description || copy.bookDescription(book.title, languageName, book.level)),
  };
}

export function siteJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: SITE_NAME,
        url: `${origin}/`,
        logo: `${origin}${LOGO_PATH}`,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: SITE_NAME,
        url: `${origin}/`,
        inLanguage: [...SEO_LANGUAGES],
        publisher: { '@id': `${origin}/#organization` },
        description: SEO_COPY.en.pages.home.description,
      },
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: `${origin}/`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: SEO_COPY.en.pages.home.description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
    ],
  };
}

export function catalogJsonLd(origin: string, books: SeoBook[], language: SeoLanguage) {
  const page = SEO_COPY[language].pages.books;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    description: page.description,
    url: localizedUrl(origin, '/books', language),
    inLanguage: language,
    isPartOf: { '@id': `${origin}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: books.length,
      itemListElement: books.map((book, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${origin}/books/${book.slug}`,
        name: book.title,
      })),
    },
  };
}

export function bookJsonLd(origin: string, book: SeoBook, language: SeoLanguage) {
  const url = `${origin}/books/${book.slug}`;
  const text = bookSeoText(book, language);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Book',
        '@id': `${url}#book`,
        name: book.title,
        url,
        description: text.description,
        inLanguage: book.language,
        bookFormat: 'https://schema.org/EBook',
        educationalLevel: book.level,
        learningResourceType: 'Graded reader',
        ...(book.cover ? { image: book.cover } : {}),
        ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
        ...(book.updatedAt ? { dateModified: book.updatedAt } : {}),
        publisher: { '@id': `${origin}/#organization` },
        isAccessibleForFree: false,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: SEO_COPY[language].catalog, item: `${origin}/books` },
          { '@type': 'ListItem', position: 3, name: book.title, item: url },
        ],
      },
    ],
  };
}

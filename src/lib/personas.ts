// src/lib/personas.ts
// 100 personajes icónicos de cine, series y cultura popular
// Reconocibles "de lejos" — mezcla géneros, épocas y orígenes

export const PERSONAS: string[] = [
  // ── Cine clásico y culto ─────────────────────────────────
  'Heisenberg',
  'Keyser Söze',
  'Hannibal',
  'Morpheus',
  'Tyler Durden',
  'Forrest',
  'Scarface',
  'Travis Bickle',
  'Vito Corleone',
  'Michael Corleone',
  'Jules Winnfield',
  'Vincent Vega',
  'Hans Landa',
  'Anton Chigurh',
  'Patrick Bateman',
  'Alex DeLarge',
  'Jack Torrance',
  'Norman Bates',
  'Hannibal Lecter',
  'Max Rockatansky',

  // ── Series icónicas ───────────────────────────────────────
  'Tony Soprano',
  'Don Draper',
  'Frank Underwood',
  'Tony Montana',
  'Omar Little',
  'Tyrion',
  'Cersei',
  'Daenerys',
  'Jon Snow',
  'Walter White',
  'Jesse Pinkman',
  'Saul Goodman',
  'Stringer Bell',
  'Jimmy McNulty',
  'Nucky Thompson',
  'Al Capone',
  'Ragnar Lothbrok',
  'Sherlock',
  'Dexter',
  'Frank Castle',

  // ── Sci-fi y acción ───────────────────────────────────────
  'Ripley',
  'Neo',
  'Trinity',
  'John Wick',
  'Maximus',
  'Ethan Hunt',
  'Jason Bourne',
  'John McClane',
  'Sarah Connor',
  'T-800',
  'Roy Batty',
  'Rick Deckard',
  'Luke Skywalker',
  'Darth Vader',
  'Han Solo',
  'Obi-Wan',
  'Yoda',
  'Ellen Ripley',
  'HAL 9000',
  'Imperator Furiosa',

  // ── Detectives y noir ─────────────────────────────────────
  'Philip Marlowe',
  'Sam Spade',
  'Rust Cohle',
  'Marty Hart',
  'Dale Cooper',
  'Columbo',
  'Poirot',
  'Miss Marple',
  'Jessica Fletcher',
  'Jim Rockford',

  // ── Mujeres icónicas ──────────────────────────────────────
  'Clarice Starling',
  'Lisbeth Salander',
  'Katniss',
  'Beatrix Kiddo',
  'Marge Gunderson',
  'Holly Golightly',
  'Thelma',
  'Louise',
  'Norma Desmond',
  'Eve Harrington',

  // ── Comedia y culto ───────────────────────────────────────
  'Ron Burgundy',
  'Ace Ventura',
  'Ferris Bueller',
  'Forrest Gump',
  'Napoleon Dynamite',
  'The Dude',
  'Red',
  'Verbal Kint',
  'Randall',
  'Jay',

  // ── Villanos memorables ───────────────────────────────────
  'Joker',
  'Thanos',
  'Magneto',
  'Lex Luthor',
  'Hans Gruber',
  'Nurse Ratched',
  'Amy Dunne',
  'Annie Wilkes',
  'Nurse Hana',
  'Gus Fring',
];

export function getRandomPersona(): string {
  return PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
}

export function getDailyPersona(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PERSONAS[dayOfYear % PERSONAS.length];
}

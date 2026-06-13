/**
 * Mapowanie surowych nazw ćwiczeń (z xlsx) → kanoniczna nazwa katalogu + pola.
 *
 * Każda reguła: test (regex na lowercase), canonical, opcjonalne fn kg/note/roundsFromKg.
 * Pierwsza pasująca reguła wygrywa; fallback = normalizeName().
 */

export type ParsedExercise = {
  canonical: string
  kg?: string
  note?: string
  /** true gdy pole KG w xlsx zawiera rundy, nie ciężar (xlsx-shift) */
  roundsFromKgField?: boolean
}

type Rule = {
  test: RegExp
  canonical: string
  kg?: (raw: string) => string | undefined
  note?: (raw: string) => string | undefined
  roundsFromKgField?: boolean
}

// Wyciąga ciężar z końcowego nawiasu i usuwa "kg": "(16-20kg)" → "16-20"
function kgFromTrailingParen(raw: string): string | undefined {
  const m = raw.match(/\(([^()]*)\)\s*$/)
  if (!m) return undefined
  const content = m[1].trim()
  if (!/kg/i.test(content)) return undefined
  return content
    .replace(/około/gi, '')
    .replace(/kg/gi, '')
    .replace(/\s+/g, '')
    .trim()
}

// Wyciąga notatkę z końcowego nawiasu (gdy nie jest to ciężar)
function noteFromTrailingParen(raw: string): string | undefined {
  const m = raw.match(/\(([^()]*)\)\s*$/)
  if (!m) return undefined
  const content = m[1].trim()
  if (/kg/i.test(content)) return undefined
  return content
}

const RULES: Rule[] = [
  // ── Tureckie wstawanie / TGU ─────────────────────────────────────────────
  {
    test: /tureckie wstawanie|tgu/i,
    canonical: 'Tureckie wstawanie',
    kg: kgFromTrailingParen,
    note: (raw) => {
      if (/z zatrzymaniem na każdej fazie/i.test(raw)) return 'zatrzymanie na każdej fazie 3 sekundy'
      if (/^1 tgu/i.test(raw)) return 'EMOM – na jedną rękę'
      return undefined
    },
  },

  // ── Snatch ────────────────────────────────────────────────────────────────
  {
    test: /^snatch/i,
    canonical: 'Snatch',
    kg: () => '24',
    note: (raw) => {
      if (/test/i.test(raw)) return 'Test 5 minut – na maxa'
      const m = raw.match(/powtarzasz\s*(\d+)\s*razy/i)
      if (m) return `5+5 snatchy co 30 sek, powtórz ×${m[1]}`
      return undefined
    },
  },

  // ── Podciąganie nachwytem ─────────────────────────────────────────────────
  {
    test: /^podciąganie nachwytem/i,
    canonical: 'Podciąganie nachwytem',
    kg: kgFromTrailingParen,
    note: (raw) => {
      if (/z obciążeniem|sprawdz kilogramy/i.test(raw)) return 'sprawdź ciężar na 1–3 pow'
      return undefined
    },
  },

  // ── Podciąganie australijskie ─────────────────────────────────────────────
  {
    test: /^podciąganie australijskie/i,
    canonical: 'Podciąganie australijskie',
    note: (raw) => {
      if (/45 stopni/i.test(raw)) return 'pod kątem ~45°'
      if (/równolegle/i.test(raw)) return 'równolegle do podłoża'
      return undefined
    },
  },

  // ── Press na jedną rękę (KB) ──────────────────────────────────────────────
  {
    test: /^press na jedną rękę/i,
    canonical: 'Press na jedną rękę (KB)',
    kg: kgFromTrailingParen,
  },

  // ── Double Press (2 KB, EMOM) ─────────────────────────────────────────────
  {
    test: /press na 2 kb/i,
    canonical: 'Double Press',
  },

  // ── Clean na dwa KB ──────────────────────────────────────────────────────
  // Uwaga: pole KG w xlsx zawiera tu liczbę rund, nie ciężar!
  {
    test: /^clean na dwa odważniki/i,
    canonical: 'Clean na dwa KB',
    roundsFromKgField: true,
  },

  // ── Swing (KB) ────────────────────────────────────────────────────────────
  {
    test: /swing/i,
    canonical: 'Swing (KB)',
    note: () => 'na 1 rękę',
  },

  // ── Wiosłowanie oburącz z ziemi (2 KB) ───────────────────────────────────
  {
    test: /wiosłowań oburącz z ziemi/i,
    canonical: 'Wiosłowanie oburącz z ziemi (2 KB)',
  },

  // ── Wyprosty ud na maszynie ───────────────────────────────────────────────
  {
    test: /^wyprosty ud na maszynie/i,
    canonical: 'Wyprosty ud na maszynie',
    note: noteFromTrailingParen,
  },

  // ── Wznosy bioder ze slamball ─────────────────────────────────────────────
  {
    test: /wznosy bioder na plecach ze slamball/i,
    canonical: 'Wznosy bioder ze slamball',
    note: noteFromTrailingParen,
  },

  // ── Cardio rozgrzewka ─────────────────────────────────────────────────────
  {
    test: /bieżnia|orbitrek|wioślarz|skakanka/i,
    canonical: 'Cardio rozgrzewka',
    note: (raw) => raw,
  },
]

/**
 * Fallback: czyści nazwę i wyciąga kg/note z końcowego nawiasu.
 */
function normalizeFallback(raw: string): ParsedExercise {
  const name = raw.replace(/\s+/g, ' ').trim()
  const m = name.match(/\(([^()]*)\)\s*$/)
  if (!m) return { canonical: name }

  const content = m[1].trim()
  const base = name.slice(0, m.index).trim()

  if (/kg/i.test(content)) {
    return { canonical: base, kg: content.replace(/około/gi, '').trim() }
  }
  return { canonical: base, note: content }
}

export function canonicalize(rawName: string): ParsedExercise {
  for (const rule of RULES) {
    if (!rule.test.test(rawName)) continue

    return {
      canonical: rule.canonical,
      kg: rule.kg?.(rawName),
      note: rule.note?.(rawName),
      roundsFromKgField: rule.roundsFromKgField,
    }
  }
  return normalizeFallback(rawName)
}

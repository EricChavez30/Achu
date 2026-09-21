/**
 * Sistema de Moderación y Filtro de Seguridad para Nombres de Usuario y Comentarios
 * Cumple con directivas de comunidad limpias (antirracismo, anti-odio, no sexualización, no violencia)
 */

// Lista base de patrones y términos inapropiados (expresiones regulares y raíces léxicas)
const BLOCKED_TERMS = [
  // Racismo, xenofobia y odio
  'nazi', 'hitler', 'racis', 'supremac', 'ku klux', 'kkk', 'negro de m', 'odio a',
  'genocid', 'fascis', 'xenofob', 'homofob',

  // Sexualización explícita y contenido para adultos
  'porn', 'porno', 'xxx', 'hentai', 'onlyfans', 'sexo', 'pene', 'vagina', 'tetas',
  'chupa', 'puta', 'puto', 'prostitut', 'pedofil', 'cp', 'nudity', 'desnuda',
  'nude', 'blowjob', 'cock', 'dick', 'pussy', 'slut', 'whore',

  // Violencia explícita y autolesiones
  'suicid', 'matate', 'asesin', 'muerete', 'terroris', 'bomba', 'cortate',

  // Estafas / Scams comunes en TikTok
  'free coins', 'tiktok coins gratis', 'hack tiktok', 'sorteo falso',
];

// Normalización de texto: elimina acentos, leetspeak (números por letras como 4->a, 0->o, 1->i, 3->e)
export function normalizeSecurityText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/[^a-z0-9\s]/g, ' ') // Quitar caracteres raros / símbolos
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ModerationCheckResult {
  isAllowed: boolean;
  reason?: string;
  flaggedTerm?: string;
  severity: 'CLEAN' | 'WARNING' | 'BLOCKED';
}

/**
 * Evalúa si un nombre de usuario o comentario infringe las directivas
 */
export function checkContentSafety(
  usernameOrText: string,
  extraBlockedWords: string[] = []
): ModerationCheckResult {
  if (!usernameOrText) {
    return { isAllowed: true, severity: 'CLEAN' };
  }

  const normalized = normalizeSecurityText(usernameOrText);
  const allTerms = [...BLOCKED_TERMS, ...extraBlockedWords.map((w) => normalizeSecurityText(w))];

  for (const term of allTerms) {
    if (!term || term.length < 2) continue;
    // Si la palabra está contenida o forma parte de la cadena normalizada
    if (normalized.includes(term)) {
      return {
        isAllowed: false,
        reason: `Contenido o término inapropiado detectado ("${term}") que infringe las directivas de seguridad`,
        flaggedTerm: term,
        severity: 'BLOCKED',
      };
    }
  }

  return {
    isAllowed: true,
    severity: 'CLEAN',
  };
}

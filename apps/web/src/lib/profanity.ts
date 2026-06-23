const BLOCKED = [
  "puta","puto","viado","viadão","buceta","boceta","xereca","xoxota","piroca","rola",
  "pau","caralho","cacete","porra","merda","cuzão","cú","cu","bunda","bosta","foder",
  "foda","fodase","fodá","fuder","punheta","punheteiro","broxa","traveco","safada",
  "safado","vagabunda","vagabundo","prostituta","prostituto","putaria","putinha",
  "arrombado","arrombada","babaca","imbecil","idiota","otário","otaria","cretino",
  "cretina","escroto","escrotão","lixo","inútil","desgraça","desgraçado","maldito",
  "filho da puta","fdp","vsf","vai se foder","vai tomar no cu","vtc","pqp",
  "puta que pariu","nossa senhora","inferno","diabo","satanás",
];

const normalize = (s: string) =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ");

export function containsProfanity(input: string): boolean {
  const normalized = normalize(input);
  return BLOCKED.some((word) => {
    const w = normalize(word);
    const pattern = new RegExp(`(^|\\s)${w}(\\s|$)`);
    return pattern.test(normalized) || normalized === w;
  });
}

/** Explicitly separate later employment from the vacancy being evaluated.
 * A requirement that this job's applicants need no future sponsorship still applies.
 */
export function isOtherRolePolicy(text: string): boolean {
  const other = /\b(?:other (?:roles|positions|jobs)|unrelated vacancy|future (?:full[- ]time|fte) (?:roles|positions|jobs|employment)|(?:full[- ]time|internship) conversions?|(?:after|following) (?:the |this |your )?internship)\b/gi;
  const alsoThisRole = /\b(?:this|the current)\s+(?:role|position|job|internship)\b/i;
  // A mixed block may contain a valid policy for this vacancy: leave it for interpretation.
  const passages = text.split(/(?<=[.!?;])\s+|\s+\b(?:but|whereas|however)\b\s+/i)
    .filter(part => /\b(?:sponsor\w*|cpt|opt|citizen\w*|must|require\w*)\b/i.test(part));
  return passages.length > 0 && passages.every(part => {
    const remaining = part.replace(other, '');
    return remaining !== part && !alsoThisRole.test(remaining);
  });
}

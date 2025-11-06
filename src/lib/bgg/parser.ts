/**
 * BoardGameGeek XML Parser
 *
 * Parses XML responses from BGG API into TypeScript objects.
 * Uses browser's native DOMParser.
 */

import type {
  BggThing,
  BggThingResponse,
  BggName,
  BggLink,
  BggStatistics,
  BggSearchResponse,
  BggSearchItem,
  BggRank,
} from '$lib/types/bgg';

/**
 * Get text content from an XML element
 */
function getTextContent(element: Element | null): string | undefined {
  return element?.textContent?.trim() || undefined;
}

/**
 * Get attribute value from an XML element
 */
function getAttribute(element: Element | null, attribute: string): string | undefined {
  return element?.getAttribute(attribute) || undefined;
}

/**
 * Get numeric attribute value
 */
function getNumericAttribute(element: Element | null, attribute: string): number | undefined {
  const value = getAttribute(element, attribute);
  return value ? parseFloat(value) : undefined;
}

/**
 * Parse BGG Thing (game) XML response
 *
 * @param xml - XML string from BGG /thing endpoint
 * @returns Parsed game data
 * @throws Error if XML is invalid or cannot be parsed
 */
export function parseThingResponse(xml: string): BggThingResponse {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Failed to parse BGG XML: ${parserError.textContent}`);
  }

  const itemsElement = doc.querySelector('items');
  if (!itemsElement) {
    throw new Error('Invalid BGG response: missing <items> element');
  }

  const termsofuse = getAttribute(itemsElement, 'termsofuse') || '';
  const items: BggThing[] = [];

  const itemElements = doc.querySelectorAll('item');
  for (const itemElement of itemElements) {
    items.push(parseThingItem(itemElement));
  }

  return {
    items,
    termsofuse,
  };
}

/**
 * Parse a single BGG Thing item
 */
function parseThingItem(element: Element): BggThing {
  const type = (getAttribute(element, 'type') || 'boardgame') as BggThing['type'];
  const id = parseInt(getAttribute(element, 'id') || '0', 10);

  // Basic info
  const thumbnail = getTextContent(element.querySelector('thumbnail'));
  const image = getTextContent(element.querySelector('image'));
  const description = getTextContent(element.querySelector('description'));

  // Names
  const names: BggName[] = [];
  const nameElements = element.querySelectorAll('name');
  for (const nameElement of nameElements) {
    names.push({
      type: (getAttribute(nameElement, 'type') || 'primary') as 'primary' | 'alternate',
      sortindex: getNumericAttribute(nameElement, 'sortindex') || 1,
      value: getAttribute(nameElement, 'value') || '',
    });
  }

  // Year published
  const yearElement = element.querySelector('yearpublished');
  const yearpublished = getNumericAttribute(yearElement, 'value');

  // Player counts
  const minplayersElement = element.querySelector('minplayers');
  const maxplayersElement = element.querySelector('maxplayers');
  const minplayers = getNumericAttribute(minplayersElement, 'value');
  const maxplayers = getNumericAttribute(maxplayersElement, 'value');

  // Play time
  const playingtimeElement = element.querySelector('playingtime');
  const minplaytimeElement = element.querySelector('minplaytime');
  const maxplaytimeElement = element.querySelector('maxplaytime');
  const playingtime = getNumericAttribute(playingtimeElement, 'value');
  const minplaytime = getNumericAttribute(minplaytimeElement, 'value');
  const maxplaytime = getNumericAttribute(maxplaytimeElement, 'value');

  // Minimum age
  const minageElement = element.querySelector('minage');
  const minage = getNumericAttribute(minageElement, 'value');

  // Links (categories, mechanics, designers, etc.)
  const links: BggLink[] = [];
  const linkElements = element.querySelectorAll('link');
  for (const linkElement of linkElements) {
    const linkType = getAttribute(linkElement, 'type');
    const linkId = getNumericAttribute(linkElement, 'id');
    const linkValue = getAttribute(linkElement, 'value');

    if (linkType && linkId && linkValue) {
      links.push({
        type: linkType as BggLink['type'],
        id: linkId,
        value: linkValue,
      });
    }
  }

  // Statistics
  const statistics = parseStatistics(element.querySelector('statistics'));

  return {
    type,
    id,
    thumbnail,
    image,
    names,
    description,
    yearpublished,
    minplayers,
    maxplayers,
    playingtime,
    minplaytime,
    maxplaytime,
    minage,
    links,
    statistics,
  };
}

/**
 * Parse statistics element
 */
function parseStatistics(element: Element | null): BggStatistics | undefined {
  if (!element) return undefined;

  const ratingsElement = element.querySelector('ratings');
  if (!ratingsElement) return undefined;

  const usersrated = getNumericAttribute(ratingsElement.querySelector('usersrated'), 'value') || 0;
  const average = getNumericAttribute(ratingsElement.querySelector('average'), 'value') || 0;
  const bayesaverage =
    getNumericAttribute(ratingsElement.querySelector('bayesaverage'), 'value') || 0;
  const stddev = getNumericAttribute(ratingsElement.querySelector('stddev'), 'value') || 0;
  const median = getNumericAttribute(ratingsElement.querySelector('median'), 'value') || 0;
  const owned = getNumericAttribute(ratingsElement.querySelector('owned'), 'value') || 0;
  const trading = getNumericAttribute(ratingsElement.querySelector('trading'), 'value') || 0;
  const wanting = getNumericAttribute(ratingsElement.querySelector('wanting'), 'value') || 0;
  const wishing = getNumericAttribute(ratingsElement.querySelector('wishing'), 'value') || 0;
  const numcomments =
    getNumericAttribute(ratingsElement.querySelector('numcomments'), 'value') || 0;
  const numweights =
    getNumericAttribute(ratingsElement.querySelector('numweights'), 'value') || 0;
  const averageweight =
    getNumericAttribute(ratingsElement.querySelector('averageweight'), 'value') || 0;

  // Ranks
  const ranks: BggRank[] = [];
  const rankElements = ratingsElement.querySelectorAll('ranks rank');
  for (const rankElement of rankElements) {
    const rankType = (getAttribute(rankElement, 'type') || 'subtype') as 'subtype' | 'family';
    const rankId = getNumericAttribute(rankElement, 'id') || 0;
    const rankName = getAttribute(rankElement, 'name') || '';
    const rankFriendlyName = getAttribute(rankElement, 'friendlyname') || '';
    const rankValue = getAttribute(rankElement, 'value');
    const rankBayesAverage = getNumericAttribute(rankElement, 'bayesaverage') || 0;

    ranks.push({
      type: rankType,
      id: rankId,
      name: rankName,
      friendlyname: rankFriendlyName,
      value: rankValue === 'Not Ranked' ? ('Not Ranked' as const) : parseFloat(rankValue || '0'),
      bayesaverage: rankBayesAverage,
    });
  }

  return {
    ratings: {
      usersrated,
      average,
      bayesaverage,
      stddev,
      median,
      owned,
      trading,
      wanting,
      wishing,
      numcomments,
      numweights,
      averageweight,
      ranks: ranks.length > 0 ? ranks : undefined,
    },
  };
}

/**
 * Parse BGG Search XML response
 *
 * @param xml - XML string from BGG /search endpoint
 * @returns Parsed search results
 * @throws Error if XML is invalid
 */
export function parseSearchResponse(xml: string): BggSearchResponse {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Failed to parse BGG search XML: ${parserError.textContent}`);
  }

  const itemsElement = doc.querySelector('items');
  if (!itemsElement) {
    throw new Error('Invalid BGG search response: missing <items> element');
  }

  const total = parseInt(getAttribute(itemsElement, 'total') || '0', 10);
  const termsofuse = getAttribute(itemsElement, 'termsofuse') || '';
  const items: BggSearchItem[] = [];

  const itemElements = doc.querySelectorAll('item');
  for (const itemElement of itemElements) {
    const type = (getAttribute(itemElement, 'type') || 'boardgame') as BggSearchItem['type'];
    const id = parseInt(getAttribute(itemElement, 'id') || '0', 10);

    const nameElement = itemElement.querySelector('name');
    const name = {
      type: 'primary' as const,
      value: getAttribute(nameElement, 'value') || '',
    };

    const yearpublishedElement = itemElement.querySelector('yearpublished');
    const yearpublished = yearpublishedElement
      ? {
          value: getNumericAttribute(yearpublishedElement, 'value') || 0,
        }
      : undefined;

    items.push({
      type,
      id,
      name,
      yearpublished,
    });
  }

  return {
    total,
    items,
    termsofuse,
  };
}

/**
 * Extract primary game name from Thing response
 */
export function getPrimaryName(thing: BggThing): string {
  const primaryName = thing.names.find((n) => n.type === 'primary');
  return primaryName?.value || thing.names[0]?.value || 'Unknown Game';
}

/**
 * Extract categories from Thing response
 */
export function getCategories(thing: BggThing): string[] {
  return thing.links?.filter((l) => l.type === 'boardgamecategory').map((l) => l.value) || [];
}

/**
 * Extract mechanics from Thing response
 */
export function getMechanics(thing: BggThing): string[] {
  return thing.links?.filter((l) => l.type === 'boardgamemechanic').map((l) => l.value) || [];
}

/**
 * Extract designers from Thing response
 */
export function getDesigners(thing: BggThing): string[] {
  return thing.links?.filter((l) => l.type === 'boardgamedesigner').map((l) => l.value) || [];
}

/**
 * Extract publishers from Thing response
 */
export function getPublishers(thing: BggThing): string[] {
  return thing.links?.filter((l) => l.type === 'boardgamepublisher').map((l) => l.value) || [];
}

/**
 * Get overall BGG rank from statistics
 */
export function getOverallRank(thing: BggThing): number | null {
  const ranks = thing.statistics?.ratings.ranks;
  if (!ranks) return null;

  const overallRank = ranks.find((r) => r.name === 'boardgame');
  if (!overallRank || overallRank.value === 'Not Ranked') return null;

  return typeof overallRank.value === 'number' ? overallRank.value : null;
}

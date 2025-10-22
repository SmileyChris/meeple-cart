<script lang="ts">
  let {
    size = 24,
    className = '',
    seed = '',
  }: { size?: number; className?: string; seed?: string } = $props();

  const meepleVariations = [
    // Wizard meeple with hat and staff
    {
      name: 'wizard',
      paths: [
        // Hat
        'M12 1L7 6H17L12 1Z',
        // Head
        'M12 5C10.8 5 10 5.8 10 7C10 7.6 10.2 8.1 10.6 8.5',
        // Body with robe
        'M9 9L7 22H17L15 9H9Z',
        // Staff (left arm)
        'M6 8L4 4M6 8L6 14',
        // Right arm
        'M16 10C16.5 10 17 10.5 17 11V12C17 12.5 16.5 13 16 13',
      ],
    },
    // Robot meeple with antenna and boxy shape
    {
      name: 'robot',
      paths: [
        // Antenna
        'M12 1V3M11 1.5H13',
        // Head (square)
        'M9 3H15V7H9V3Z',
        // Body (rectangular)
        'M8 8H16V18H8V8Z',
        // Legs
        'M10 18V22M14 18V22',
        // Arms (mechanical)
        'M8 10H5V12H8M16 10H19V12H16',
        // Eyes
        'M10.5 5H10.5M13.5 5H13.5',
      ],
    },
    // Knight meeple with shield and sword
    {
      name: 'knight',
      paths: [
        // Helmet
        'M12 2C10.5 2 9 3 9 4.5V6H15V4.5C15 3 13.5 2 12 2Z',
        // Visor slot
        'M10 4.5H14',
        // Body armor
        'M9 7V15L12 17L15 15V7H9Z',
        // Legs
        'M11 17V22M13 17V22',
        // Shield (left arm)
        'M6 8V13L8 15V8H6Z',
        // Sword (right arm)
        'M16 7V14M18 9V12',
      ],
    },
    // Dancing meeple with dynamic pose
    {
      name: 'dancer',
      paths: [
        // Head
        'M12 4C13.1 4 14 3.1 14 2C14 0.9 13.1 0 12 0C10.9 0 10 0.9 10 2C10 3.1 10.9 4 12 4Z',
        // Body (curved)
        'M11 5C11 5 10 8 10 11C10 14 11 16 11 16H13C13 16 14 14 14 11C14 8 13 5 13 5H11Z',
        // Left leg (kicked up)
        'M11 16L8 19L7 22',
        // Right leg (standing)
        'M13 16V22',
        // Arms (outstretched)
        'M10 8L5 6M14 8L19 6',
      ],
    },
    // Bear/animal meeple with ears
    {
      name: 'bear',
      paths: [
        // Ears
        'M8 3C8 2 7 1 6 1C5 1 4 2 4 3C4 4 5 5 6 5M18 3C18 2 17 1 16 1C15 1 14 2 14 3C14 4 15 5 16 5',
        // Head (round)
        'M12 2C9 2 7 4 7 7C7 10 9 12 12 12C15 12 17 10 17 7C17 4 15 2 12 2Z',
        // Snout
        'M12 8C11 8 10.5 8.5 10.5 9C10.5 9.5 11 10 12 10C13 10 13.5 9.5 13.5 9C13.5 8.5 13 8 12 8Z',
        // Body (chubby)
        'M9 12C8 12 7 13 7 14V20C7 21 8 22 9 22H15C16 22 17 21 17 20V14C17 13 16 12 15 12H9Z',
        // Paws
        'M7 14C6 14 5 14.5 5 15V16C5 16.5 6 17 7 17M17 14C18 14 19 14.5 19 15V16C19 16.5 18 17 17 17',
      ],
    },
    // Superhero meeple with cape
    {
      name: 'superhero',
      paths: [
        // Head
        'M12 3C10.5 3 9.5 4 9.5 5.5C9.5 7 10.5 8 12 8C13.5 8 14.5 7 14.5 5.5C14.5 4 13.5 3 12 3Z',
        // Mask
        'M9 5H15',
        // Body
        'M10 8V16L12 18L14 16V8H10Z',
        // Cape (flowing)
        'M10 9L6 20L8 22M14 9L18 20L16 22',
        // Legs
        'M11 18V22M13 18V22',
        // Arms (heroic pose)
        'M10 10H7V11H10M14 10H17V11H14',
        // Emblem
        'M12 11L11 13H13L12 11Z',
      ],
    },
    // Chef meeple with hat and apron
    {
      name: 'chef',
      paths: [
        // Chef hat
        'M10 2H14V5C14 5 13 6 12 6C11 6 10 5 10 5V2Z',
        // Hat puff
        'M9 2C9 1 10 0 12 0C14 0 15 1 15 2',
        // Head
        'M12 6C10.5 6 10 7 10 8C10 9 10.5 10 12 10C13.5 10 14 9 14 8C14 7 13.5 6 12 6Z',
        // Body with apron
        'M9 10V18L10 19V22H14V19L15 18V10H9Z',
        // Apron strings
        'M9 14H15',
        // Arms
        'M9 11H6V13H9M15 11H18V13H15',
        // Spoon
        'M18 11C18 11 19 10 19 10',
      ],
    },
    // Pirate meeple with hat and peg leg
    {
      name: 'pirate',
      paths: [
        // Pirate hat
        'M8 3L12 1L16 3V4H8V3Z',
        // Skull on hat
        'M12 2.5C11.5 2.5 11.5 3 12 3C12.5 3 12.5 2.5 12 2.5Z',
        // Head with bandana
        'M12 5C10.5 5 10 6 10 7C10 8 10.5 9 12 9C13.5 9 14 8 14 7C14 6 13.5 5 12 5Z',
        // Eye patch
        'M10 6.5H11',
        // Body
        'M10 9V16L12 18L14 16V9H10Z',
        // Peg leg
        'M11 18V22',
        // Normal leg
        'M13 18V20L14 22',
        // Hook hand
        'M10 10H7L6 11',
        // Sword arm
        'M14 10H17V15',
      ],
    },
  ];

  // Better hash function to convert seed to number
  function hashCode(str: string): number {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Add some additional mixing to ensure better distribution
    hash = hash ^ (hash >>> 16);
    hash = hash * 0x85ebca6b;
    hash = hash ^ (hash >>> 13);
    hash = hash * 0xc2b2ae35;
    hash = hash ^ (hash >>> 16);
    return Math.abs(hash);
  }

  // Select meeple variation based on seed
  let hash = $derived(hashCode(seed));
  let meepleIndex = $derived(hash % meepleVariations.length);
  let selectedMeeple = $derived(meepleVariations[meepleIndex]);

  // Add slight rotation for more visual variety
  let rotation = $derived(((hash >> 4) % 7) * 5 - 15); // -15, -10, -5, 0, 5, 10, 15 degrees
</script>

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.5"
  strokeLinecap="round"
  strokeLinejoin="round"
  xmlns="http://www.w3.org/2000/svg"
>
  <g transform="rotate({rotation} 12 12)">
    {#each selectedMeeple.paths as path, i (i)}
      <path d={path} />
    {/each}
  </g>
</svg>

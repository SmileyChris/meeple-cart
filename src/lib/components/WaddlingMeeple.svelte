<script>
  import { onMount } from 'svelte';

  let meepleX = $state(0);
  let direction = $state(1); // 1 = right, -1 = left
  let isWalking = $state(true);
  let waddleAngle = $state(0);
  let waddleDirection = $state(1);
  let isStopped = $state(false);
  let isPecking = $state(false);
  let peckAngle = $state(0);
  let peckPhase = $state(0); // 0 = down, 1 = up
  let peckCount = $state(0);
  let maxPecks = $state(3);
  let isLookingAround = $state(false);
  let lookScale = $state(1);
  let lookDirection = $state(1); // 1 = squashing, -1 = stretching
  let lookCount = $state(0);
  let isPooping = $state(false);
  let poopX = $state(0);
  let poopY = $state(0);
  let poopRotation = $state(0);
  let poopPhase = $state(0); // 0 = flying out, 1 = landed
  let poops = $state([]); // Array of {x, y, opacity, timestamp, id}
  let poopIdCounter = $state(0);
  let animationFrame = $state(null);

  onMount(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Don't animate if user prefers reduced motion
    }

    // Start at a random position and direction
    meepleX = Math.random() * (window.innerWidth - 100);
    direction = Math.random() < 0.5 ? 1 : -1;

    const animate = () => {
      if (isWalking) {
        // Move the meeple (slower speed)
        meepleX += direction * 0.8;

        // Waddle rotation
        waddleAngle += waddleDirection * 0.8;
        if (waddleAngle > 8) {
          waddleDirection = -1;
        } else if (waddleAngle < -8) {
          waddleDirection = 1;
        }

        // Check boundaries and reverse direction before reaching edge
        if (meepleX <= 0) {
          meepleX = 0;
          direction = 1;
        } else if (meepleX >= window.innerWidth - 100) {
          meepleX = window.innerWidth - 100;
          direction = -1;
        }

        // Random chance to stop
        if (Math.random() < 0.01) {
          isWalking = false;
          isStopped = true;

          // Wait a bit, then decide what to do
          setTimeout(
            () => {
              const action = Math.random();

              if (action < 0.25) {
                // Just start walking again
                isWalking = true;
                isStopped = false;
              } else if (action < 0.5) {
                // Peck at the ground
                isPecking = true;
                peckCount = 0;
                maxPecks = Math.floor(Math.random() * 5) + 2; // 2-6 pecks
                isStopped = false;
              } else if (action < 0.75) {
                // Look around
                isLookingAround = true;
                lookCount = 0;
                lookScale = 1;
                isStopped = false;
              } else {
                // Poop!
                isPooping = true;
                poopPhase = 0;
                // Start from the back of the kiwi at 50% height
                // Kiwi is 64px, poop is 16px (so offset by 8px to center)
                // Back is ~20% from the back edge
                poopX = direction === 1 ? meepleX + 4 : meepleX + 44;
                poopY = 32; // Start at 50% of kiwi height
                poopRotation = 0;
                isStopped = false;
              }
            },
            Math.random() * 4000 + 2000
          ); // Stop for 2-6 seconds before deciding
        }
      } else if (isStopped) {
        // Just standing still, return to upright
        if (Math.abs(waddleAngle) > 0.5) {
          waddleAngle *= 0.85;
        } else {
          waddleAngle = 0;
        }
      } else if (isPecking) {
        // Pecking animation
        // Return waddle to upright
        if (Math.abs(waddleAngle) > 0.5) {
          waddleAngle *= 0.85;
        } else {
          waddleAngle = 0;
        }

        if (peckCount < maxPecks) {
          if (peckPhase === 0) {
            // Peck down
            peckAngle += 3;
            if (peckAngle >= 45) {
              peckPhase = 1;
            }
          } else {
            // Return up
            peckAngle -= 3;
            if (peckAngle <= 0) {
              peckAngle = 0;
              peckPhase = 0;
              peckCount++;
              // Pause between pecks
              if (peckCount < maxPecks) {
                isPecking = false;
                setTimeout(() => {
                  isPecking = true;
                }, 200);
              }
            }
          }
        } else {
          // Finished pecking, return to upright then stop before walking
          if (peckAngle > 0) {
            peckAngle = Math.max(0, peckAngle - 3);
          } else {
            isPecking = false;
            isStopped = true;
            // Wait a bit before walking again
            setTimeout(
              () => {
                isStopped = false;
                isWalking = true;
              },
              Math.random() * 3000 + 1000
            ); // Stop for 1-4 seconds
          }
        }
      } else if (isLookingAround) {
        // Looking around animation (squash and stretch for perspective)
        // Return waddle to upright
        if (Math.abs(waddleAngle) > 0.5) {
          waddleAngle *= 0.85;
        } else {
          waddleAngle = 0;
        }

        if (lookCount < 3) {
          if (lookDirection === 1) {
            // Squash (look to side)
            lookScale -= 0.02;
            if (lookScale <= 0.7) {
              lookDirection = -1;
            }
          } else {
            // Stretch back to normal
            lookScale += 0.02;
            if (lookScale >= 1.0) {
              lookScale = 1.0;
              lookDirection = 1;
              lookCount++;
            }
          }
        } else {
          // Finished looking around, return to normal then stop before walking
          if (Math.abs(lookScale - 1) > 0.01) {
            if (lookScale < 1) {
              lookScale = Math.min(1, lookScale + 0.02);
            } else {
              lookScale = Math.max(1, lookScale - 0.02);
            }
          } else {
            lookScale = 1;
            isLookingAround = false;
            isStopped = true;
            // Wait a bit before walking again
            setTimeout(
              () => {
                isStopped = false;
                isWalking = true;
              },
              Math.random() * 3000 + 1000
            ); // Stop for 1-4 seconds
          }
        }
      } else if (isPooping) {
        // Pooping animation
        // Return waddle to upright
        if (Math.abs(waddleAngle) > 0.5) {
          waddleAngle *= 0.85;
        } else {
          waddleAngle = 0;
        }

        if (poopPhase === 0) {
          // Poop flying out
          poopX += direction * -3; // Fly out backwards
          poopY += 4; // Fall down (increase towards 48)
          poopRotation += 15; // Spin

          // Check if landed
          if (poopY >= 48) {
            poopY = 48;
            poopPhase = 1;
            // Add to poops array with random final rotation
            const newPoop = {
              id: poopIdCounter++,
              x: poopX,
              y: 48,
              opacity: 1,
              rotation: Math.floor(Math.random() * 360), // Random orientation
              timestamp: Date.now(),
            };
            poops = [...poops, newPoop];

            // Schedule fade out after 30 seconds
            setTimeout(() => {
              poops = poops.filter((p) => p.id !== newPoop.id);
            }, 30000);

            // Finished pooping, stop before walking
            isPooping = false;
            isStopped = true;
            setTimeout(
              () => {
                isStopped = false;
                isWalking = true;
              },
              Math.random() * 3000 + 1000
            );
          }
        }
      }

      // Update poop fade animation
      const now = Date.now();
      poops = poops.map((poop) => {
        const age = now - poop.timestamp;
        if (age > 27000) {
          // Start fading at 27 seconds (fade over 3 seconds)
          const fadeProgress = (age - 27000) / 3000;
          return { ...poop, opacity: Math.max(0, 1 - fadeProgress) };
        }
        return poop;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  });
</script>

<!-- Landed poops -->
{#each poops as poop (poop.id)}
  <img
    src="/poop.png"
    alt="Poop"
    class="absolute h-4 w-4 object-contain pointer-events-none"
    style="left: {poop.x}px; top: {poop.y -
      44}px; opacity: {poop.opacity}; transform: rotate({poop.rotation}deg); transition: opacity 0.5s;"
  />
{/each}

<!-- Active poop being dropped -->
{#if isPooping && poopPhase === 0}
  <img
    src="/poop.png"
    alt="Poop"
    class="absolute h-4 w-4 object-contain pointer-events-none"
    style="left: {poopX}px; top: {poopY - 44}px; transform: rotate({poopRotation}deg);"
  />
{/if}

<!-- Walking meeple -->
<img
  src="/walking.png"
  alt="Kiwi meeple"
  class="absolute -top-[44px] h-16 w-16 object-contain transition-transform duration-100"
  style="left: {meepleX}px; transform: scaleX({direction * lookScale}) rotate({waddleAngle +
    peckAngle}deg);"
/>

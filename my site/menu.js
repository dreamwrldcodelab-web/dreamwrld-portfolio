// Find the mobile menu controls used by the shared site header.
const menuToggle = document.getElementById("menu-toggle");
const navbar = document.getElementById("navbar");

// Add menu behavior only on pages that contain both header controls.
if (menuToggle && navbar) {
    // Start with the menu marked as closed for assistive technology.
    menuToggle.setAttribute("aria-expanded", "false");

    // Toggle the menu open or closed and keep its accessible labels in sync.
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.classList.toggle("active");
        navbar.classList.toggle("active", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    // Close the mobile menu after one of its navigation links is selected.
    navbar.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            menuToggle.classList.remove("active");
            navbar.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open menu");
        }
    });

    // Let keyboard users close the menu with Escape and return focus to its button.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            menuToggle.classList.remove("active");
            navbar.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open menu");
            menuToggle.focus();
        }
    });
}

// Set up copy behavior for each live-project panel using that panel's own controls.
document.querySelectorAll(".live-project").forEach((project) => {
    const urlField = project.querySelector(".project-url");
    const copyButton = project.querySelector(".copy-btn");
    const status = project.querySelector(".copy-status");

    // Skip incomplete panels so missing markup cannot cause a script error.
    if (!urlField || !copyButton || !status) return;

    // Copy the displayed URL and report the result beside the relevant panel.
    copyButton.addEventListener("click", async () => {
        const url = urlField.value.trim();
        if (!url) {
            status.textContent = "No live project URL has been added yet.";
            return;
        }

        // Prefer the modern clipboard API when the page runs in a secure context.
        try {
            if (!navigator.clipboard || !window.isSecureContext) {
                throw new Error("Clipboard access is unavailable.");
            }
            await navigator.clipboard.writeText(url);
            status.textContent = "Link copied. Paste it into a message to share for review.";
        } catch (error) {
            // Older browsers may need the selected-field and execCommand fallback.
            urlField.focus();
            urlField.select();
            let copied = false;
            try {
                copied = document.execCommand("copy");
            } catch (fallbackError) {
                copied = false;
            }
            status.textContent = copied
                ? "Link copied. Paste it into a message to share for review."
                : "Copy was blocked. Select the URL above and copy it manually.";
        }
    });
});

// Run the home-page typing effect as one stateful sequence, independent of CSS animation timing.
const typingList = document.querySelector(".dynamic-text");

if (typingList) {
    const wordItems = [...typingList.querySelectorAll("li > span:not(.typing-cursor)")];
    const words = wordItems.map((item) => item.textContent.trim()).filter(Boolean);
    const visibleWord = wordItems[0];
    const liveStatus = document.getElementById("typing-status");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (words.length && visibleWord) {
        visibleWord.textContent = words[0];

        if (words.length > 1 && !reduceMotion.matches) {
            const TYPE_DELAY = 85;
            const DELETE_DELAY = 45;
            const WORD_PAUSE = 1500;
            const SWITCH_PAUSE = 180;
            let wordIndex = 0;
            let characterIndex = words[0].length;
            let isDeleting = true;
            let motionStopped = false;
            let timer = null;
            let deadline = 0;
            let remainingDelay = WORD_PAUSE;

            const setLongestWordWidth = () => {
                const style = window.getComputedStyle(visibleWord);
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (!context) return;
                context.font = style.font;
                const longestWidth = Math.max(...words.map((word) => context.measureText(word).width));
                typingList.style.setProperty("--typing-width", `${Math.ceil(longestWidth) + 5}px`);
            };

            let resizeFrame = null;
            window.addEventListener("resize", () => {
                window.cancelAnimationFrame(resizeFrame);
                resizeFrame = window.requestAnimationFrame(setLongestWordWidth);
            }, { passive: true });

            const schedule = (delay) => {
                window.clearTimeout(timer);
                remainingDelay = delay;
                deadline = performance.now() + delay;
                timer = window.setTimeout(tick, delay);
            };

            const tick = () => {
                if (motionStopped || reduceMotion.matches) return;
                const word = words[wordIndex];
                if (isDeleting) {
                    characterIndex -= 1;
                    visibleWord.textContent = word.slice(0, characterIndex);
                    if (characterIndex === 0) {
                        wordIndex = (wordIndex + 1) % words.length;
                        isDeleting = false;
                        schedule(SWITCH_PAUSE);
                        return;
                    }
                    schedule(DELETE_DELAY);
                    return;
                }

                characterIndex += 1;
                visibleWord.textContent = word.slice(0, characterIndex);
                if (characterIndex === word.length) {
                    if (liveStatus) liveStatus.textContent = word;
                    isDeleting = true;
                    schedule(WORD_PAUSE);
                    return;
                }
                schedule(TYPE_DELAY);
            };

            document.addEventListener("visibilitychange", () => {
                if (document.hidden && timer !== null) {
                    window.clearTimeout(timer);
                    timer = null;
                    remainingDelay = Math.max(0, deadline - performance.now());
                } else if (!document.hidden && !motionStopped && !reduceMotion.matches && timer === null) {
                    schedule(remainingDelay);
                }
            });

            reduceMotion.addEventListener?.("change", (event) => {
                if (event.matches) {
                    motionStopped = true;
                    window.clearTimeout(timer);
                    timer = null;
                    visibleWord.textContent = words[0];
                    if (liveStatus) liveStatus.textContent = words[0];
                } else {
                    motionStopped = false;
                    wordIndex = 0;
                    characterIndex = words[0].length;
                    isDeleting = true;
                    visibleWord.textContent = words[0];
                    if (liveStatus) liveStatus.textContent = words[0];
                    if (!document.hidden) schedule(WORD_PAUSE);
                }
            });

            const startAnimation = () => {
                setLongestWordWidth();
                if (document.hidden) {
                    remainingDelay = WORD_PAUSE;
                } else if (!motionStopped) {
                    schedule(WORD_PAUSE);
                }
            };
            if (document.fonts?.ready) {
                document.fonts.ready.then(startAnimation);
            } else {
                startAnimation();
            }
        }
    }
}

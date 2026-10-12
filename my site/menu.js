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

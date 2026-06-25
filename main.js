document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPages = document.querySelectorAll(".tab-page");
    const themeToggle = document.getElementById("theme-toggle");

    // APPLY SAVED THEME
    if (window.gameData?.theme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "🌙Dark Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeToggle.textContent = "☀️Light Mode";
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");

        // SAVE TO GAMEDATA
        if (window.gameData) {
            window.gameData.theme = isDark ? "dark" : "light";

            // save existing tracker data too
            if (typeof saveGameData === "function") {
                saveGameData("theme toggle");
            }
        }

        themeToggle.textContent = isDark
            ? "🌙Dark Mode"
            : "☀️Light Mode";
    });

    function hideAllTabs() {
        tabPages.forEach(page => page.style.display = "none");
        tabButtons.forEach(btn => btn.classList.remove("active"));
    }

    function showTab(tabName) {
        if (tabName === "npc") {
            populateRegionDropdown();
            populateNameTypeDropdown();
        }
        hideAllTabs();
        const page = document.querySelector(`#tab-${tabName}`);
        const btn = document.querySelector(`[data-tab="${tabName}"]`);

        if (page) page.style.display = "block";
        if (btn) btn.classList.add("active");
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () =>
            showTab(btn.getAttribute("data-tab"))
        );
    });

    showTab("treasure");
});
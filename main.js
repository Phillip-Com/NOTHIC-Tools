document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPages = document.querySelectorAll(".tab-page");
    const themeToggle = document.getElementById("theme-toggle");
    const exportBtn = document.getElementById("export-data");
    const importBtn = document.getElementById("import-data");
    const importFile = document.getElementById("import-file");
    const editionSelect = document.getElementById("edition-select");

    // APPLY SAVED SETTINGS

    const settings = window.userData.settings;

    document.dispatchEvent(
        new CustomEvent("themeChanged", {
            detail: {
                theme: settings.theme
            }
        })
    );

    editionSelect.value =
        settings.edition || "5e";

    themeToggle.addEventListener("click", () => {

        const newTheme =
            document.body.classList.contains("dark-mode")
                ? "light"
                : "dark";

        updateTheme(newTheme);

    });

    editionSelect.addEventListener("change", () => {

        updateEdition(editionSelect.value);

    });

    // Export
    exportBtn.addEventListener("click", () => {
        exportUserData();
    });

    // Import
    importBtn.addEventListener("click", () => {
        importFile.click();
    });

    importFile.addEventListener("change", (e) => {
        if (e.target.files.length) {
            importUserData(e.target.files[0]);

            // Allows importing the same file twice in a row
            e.target.value = "";
        }
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

document.addEventListener("themeChanged", (e) => {

    const isDark = e.detail.theme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    themeToggle.textContent =
        isDark
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";

});

document.addEventListener("editionChanged", (e) => {

    console.log("Edition changed:", e.detail.edition);

});
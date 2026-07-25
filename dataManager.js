const STORAGE_KEY = "dndToolboxData";

// ======================================================
// DEFAULT USER DATA
// ======================================================

window.userData = {
    settings: {
        theme: "dark",
        edition: "5e"
    },

    tracker: {
        gameData: null,
        partyPresets: {},
        activeParty: ""
    },

    npcGenerator: {
        customRegions: {}
    },

    encounterGenerator: {},

    lootGenerator: {},

    sessionData: {
        campaigns: {},
        activeCampaign: ""
    }
};

// ======================================================
// MERGE USER DATA
// ======================================================

function mergeUserData(savedData) {

    return {

        ...window.userData,
        ...savedData,

        settings: {
            ...window.userData.settings,
            ...(savedData.settings || {})
        },

        tracker: {
            ...window.userData.tracker,
            ...(savedData.tracker || {})
        },

        npcGenerator: {
            ...window.userData.npcGenerator,
            ...(savedData.npcGenerator || {}),

            customRegions: {
                ...window.userData.npcGenerator.customRegions,
                ...(savedData.npcGenerator?.customRegions || {})
            }
        },

        encounterGenerator: {
            ...window.userData.encounterGenerator,
            ...(savedData.encounterGenerator || {})
        },

        lootGenerator: {
            ...window.userData.lootGenerator,
            ...(savedData.lootGenerator || {})
        },

        sessionData: {
            ...window.userData.sessionData,
            ...(savedData.sessionData || {}),

            campaigns: {
                ...window.userData.sessionData.campaigns,
                ...(savedData.sessionData?.campaigns || {})
            }
        }

    };

}

// ======================================================
// SAVE
// ======================================================

window.saveUserData = function () {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(window.userData)
        );

    } catch (err) {

        console.error("Failed to save user data:", err);

    }

};

// ======================================================
// LOAD
// ======================================================

window.loadUserData = function () {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {

        try {

            const savedData = JSON.parse(saved);

            window.userData = mergeUserData(savedData);

        } catch (err) {

            console.error("Failed to load user data:", err);

        }

    }

    // --------------------------------------------
    // One-time migration from old tracker save
    // --------------------------------------------

    const oldTracker = localStorage.getItem("myGameData");

    if (
        oldTracker &&
        !window.userData.tracker.gameData
    ) {

        try {

            window.userData.tracker.gameData =
                JSON.parse(oldTracker);

            localStorage.removeItem("myGameData");

            saveUserData();

            console.log("Migrated old tracker save.");

        } catch (err) {

            console.error("Tracker migration failed:", err);

        }

    }

};

// ======================================================
// SETTINGS
// ======================================================

window.updateTheme = function (theme) {

    window.userData.settings.theme = theme;

    saveUserData();

    document.dispatchEvent(
        new CustomEvent("themeChanged", {
            detail: {
                theme
            }
        })
    );

};

window.updateEdition = function (edition) {

    if (window.userData.settings.edition === edition)
        return;

    window.userData.settings.edition = edition;

    saveUserData();

    document.dispatchEvent(
        new CustomEvent("editionChanged", {
            detail: {
                edition
            }
        })
    );

};

// ======================================================
// EXPORT
// ======================================================

window.exportUserData = function () {

    const blob = new Blob(
        [
            JSON.stringify(
                window.userData,
                null,
                2
            )
        ],
        {
            type: "application/json"
        }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download =
        `DND-Toolbox-${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

};

// ======================================================
// IMPORT
// ======================================================

window.importUserData = function (file) {

    if (!file) return;

    if (
        !confirm(
            "Importing will overwrite your current Toolbox data. Continue?"
        )
    ) {
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {

        try {

            const imported =
                JSON.parse(e.target.result);

            if (
                typeof imported !== "object" ||
                imported === null
            ) {
                throw new Error("Invalid JSON");
            }

            if (
                !imported.settings &&
                !imported.tracker &&
                !imported.npcGenerator &&
                !imported.encounterGenerator &&
                !imported.lootGenerator &&
                !imported.sessionData
            ) {
                throw new Error("Not a Toolbox backup");
            }

            window.userData =
                mergeUserData(imported);

            saveUserData();

            alert("Import successful!");

            location.reload();

        } catch (err) {

            console.error(err);

            alert("Invalid Toolbox backup.");

        }

    };

    reader.readAsText(file);

};

// ======================================================
// RESET
// ======================================================

window.resetUserData = function () {

    if (
        !confirm(
            "This will permanently erase ALL Toolbox data. Continue?"
        )
    ) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("myGameData");

    window.userData = mergeUserData({});

    saveUserData();

    location.reload();

};

// ======================================================
// INITIAL LOAD
// ======================================================

loadUserData();
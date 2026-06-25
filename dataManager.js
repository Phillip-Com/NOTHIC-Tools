const STORAGE_KEY = "dndToolboxData";

// ======================================================
// DEFAULT USER DATA
// ======================================================

window.userData = {
    settings: {
        theme: "dark"
    },

    tracker: {
        gameData: null
    },

    npcGenerator: {
        customRegions: {}
    },

    encounterGenerator: {
        // Future settings
    },

    lootGenerator: {
        // Future settings
    }
};


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

            window.userData = {

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
                    ...(savedData.npcGenerator || {})
                },

                encounterGenerator: {
                    ...window.userData.encounterGenerator,
                    ...(savedData.encounterGenerator || {})
                },

                lootGenerator: {
                    ...window.userData.lootGenerator,
                    ...(savedData.lootGenerator || {})
                }

            };

        } catch (err) {
            console.error("Failed to load user data:", err);
        }
    }


    // ==================================================
    // One-time migration from old tracker save
    // ==================================================

    const oldTracker = localStorage.getItem("myGameData");

    if (
        oldTracker &&
        !window.userData.tracker.gameData
    ) {
        try {

            window.userData.tracker.gameData =
                JSON.parse(oldTracker);

            saveUserData();

            localStorage.removeItem("myGameData");

            console.log("Migrated old tracker save.");

        } catch (err) {
            console.error("Tracker migration failed:", err);
        }
    }
};


// ======================================================
// INITIAL LOAD
// ======================================================

loadUserData();
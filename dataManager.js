const STORAGE_KEY = "dndToolboxData";

window.userData = {
    settings: {},
    tracker: {},
    npcGenerator: {
        customregions: {}
    },
    encounterGenerator: {},
    lootGenerator: {}
};

window.saveUserData = function () {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(window.userData)
    );
};

window.loadUserData = function () {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
        Object.assign(
            window.userData,
            JSON.parse(saved)
        );
    } catch (err) {
        console.error(err);
    }
};

loadUserData();
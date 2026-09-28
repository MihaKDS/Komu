import { ref } from "vue";
import {
    getMyLists,
    removeMediaList,
    saveMediaList,
} from "../api/listsAPI.js";

export const mediaListEntries = ref([]);
export const mediaListsLoaded = ref(false);

let loadingPromise = null;
let loadGeneration = 0;

export function loadMyLists(force = false) {
    if (mediaListsLoaded.value && !force) {
        return Promise.resolve(mediaListEntries.value);
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    const generation = loadGeneration;
    const request = getMyLists()
        .then((entries) => {
            if (generation === loadGeneration) {
                mediaListEntries.value = entries;
                mediaListsLoaded.value = true;
            }
            return entries;
        })
        .finally(() => {
            if (loadingPromise === request) {
                loadingPromise = null;
            }
        });

    loadingPromise = request;
    return loadingPromise;
}

export function resetMyLists() {
    loadGeneration += 1;
    mediaListEntries.value = [];
    mediaListsLoaded.value = false;
    loadingPromise = null;
}

export async function updateMediaList(mediaId, entry) {
    const generation = loadGeneration;
    const saved = await saveMediaList(mediaId, entry);
    if (generation !== loadGeneration) {
        return saved;
    }

    const existingIndex = mediaListEntries.value.findIndex(
        (item) => item.mediaId === mediaId,
    );

    if (existingIndex === -1) {
        mediaListEntries.value = [...mediaListEntries.value, saved];
    } else {
        mediaListEntries.value = mediaListEntries.value.map(
            (item, index) => index === existingIndex ? saved : item,
        );
    }

    mediaListsLoaded.value = true;
    return saved;
}

export async function deleteMediaList(mediaId) {
    const generation = loadGeneration;
    await removeMediaList(mediaId);
    if (generation !== loadGeneration) {
        return;
    }

    mediaListEntries.value = mediaListEntries.value.filter(
        (item) => item.mediaId !== mediaId,
    );
    mediaListsLoaded.value = true;
}

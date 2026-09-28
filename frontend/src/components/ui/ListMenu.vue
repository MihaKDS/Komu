<template>
    <div
        v-if="user"
        ref="root"
        :class="['list-menu', { 'is-open': isOpen }]"
        @click.stop
    >
        <button
            type="button"
            :class="['list-menu-trigger', { 'has-status': currentEntry }]"
            :aria-label="currentEntry ? `Manage lists: ${statusLabel(currentEntry.status)}` : 'Manage lists'"
            :aria-expanded="isOpen"
            @click="toggleMenu"
        >
            <span v-if="currentEntry">{{ statusLabel(currentEntry.status) }}</span>
            <span v-else aria-hidden="true">⋮</span>
        </button>

        <div
            v-if="isOpen"
            class="list-menu-panel"
            role="menu"
        >
            <p
                v-if="currentEntry"
                class="current-status"
            >
                Current: {{ statusLabel(currentEntry.status) }}
            </p>

            <button
                v-for="status in statuses"
                :key="status"
                type="button"
                role="menuitem"
                :class="{ selected: currentEntry?.status === status }"
                @click="setStatus(status)"
            >
                <span>{{ statusLabel(status) }}</span>
                <span v-if="currentEntry?.status === status" aria-label="Current status">✓</span>
            </button>

            <button
                v-if="currentEntry"
                type="button"
                class="remove-action"
                role="menuitem"
                @click="removeFromList"
            >
                Remove from List
            </button>

            <p v-if="error" class="menu-error">{{ error }}</p>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { openListMenuId } from "../../services/listMenuState.js";
import {
    deleteMediaList,
    loadMyLists,
    mediaListEntries,
    resetMyLists,
    updateMediaList,
} from "../../services/listsService.js";

const instanceId = Symbol("list-menu");

const props = defineProps({
    mediaId: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        default: "",
    },
});

const { user } = useAuth();
const root = ref(null);
const error = ref("");
const isOpen = computed(() => openListMenuId.value === instanceId);
const currentEntry = computed(() =>
    mediaListEntries.value.find((item) => item.mediaId === props.mediaId) ?? null,
);
const statuses = ["WISHLIST", "TO_WATCH", "WATCHING", "COMPLETED"];

function closeMenu() {
    if (isOpen.value) {
        openListMenuId.value = null;
    }
}

function handleOutsidePointer(event) {
    if (isOpen.value && !root.value?.contains(event.target)) {
        closeMenu();
    }
}

onMounted(() => {
    document.addEventListener("pointerdown", handleOutsidePointer);
});

onBeforeUnmount(() => {
    document.removeEventListener("pointerdown", handleOutsidePointer);
    closeMenu();
});

watch(
    () => user.value?.id,
    (userId) => {
        if (!userId) {
            resetMyLists();
            return;
        }

        loadMyLists().catch((err) => {
            error.value = err.message || "Unable to load your lists.";
        });
    },
    { immediate: true },
);

function statusLabel(status) {
    if (status === "WISHLIST") return "Wishlist";
    if (status === "TO_WATCH") {
        return ["BOOK", "COMIC"].includes(props.category) ? "To Read" : "To Watch";
    }
    if (status === "WATCHING") {
        return ["BOOK", "COMIC"].includes(props.category) ? "Reading" : "Watching";
    }
    if (status === "COMPLETED") {
        if (["BOOK", "COMIC"].includes(props.category)) return "Finished";
        if (["MOVIE", "TV_SHOW"].includes(props.category)) return "Watched";
    }
    return "Completed";
}

async function toggleMenu() {
    error.value = "";
    if (isOpen.value) {
        closeMenu();
        return;
    }

    openListMenuId.value = instanceId;
    try {
        await loadMyLists();
    } catch (err) {
        error.value = err.message || "Unable to load your lists.";
    }
}

async function setStatus(status) {
    closeMenu();
    error.value = "";
    try {
        await updateMediaList(props.mediaId, {
            status,
        });
    } catch (err) {
        error.value = err.message || "Unable to update your list.";
    }
}

async function removeFromList() {
    closeMenu();
    error.value = "";
    try {
        await deleteMediaList(props.mediaId);
    } catch (err) {
        error.value = err.message || "Unable to remove this media from your list.";
    }
}
</script>

<style scoped>
.list-menu {
    position: relative;
    z-index: 1;
}

.list-menu.is-open {
    z-index: 1000;
}

.list-menu-trigger {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    padding: 0;
    color: #fff;
    background: rgba(20, 24, 32, 0.78);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-small);
    font-size: 23px;
    line-height: 1;
    cursor: pointer;
}

.list-menu-trigger.has-status {
    width: auto;
    min-width: 38px;
    max-width: 150px;
    padding: 0 9px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

.list-menu-trigger.has-status span {
    overflow: hidden;
    text-overflow: ellipsis;
}

.list-menu-panel {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    width: max-content;
    min-width: 190px;
    max-width: min(260px, calc(100vw - 24px));
    padding: 5px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    box-shadow: var(--shadow);
}

.list-menu-panel button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 38px;
    padding: 7px 9px;
    color: var(--text);
    background: transparent;
    border: 0;
    border-radius: 3px;
    text-align: left;
    cursor: pointer;
}

.list-menu-panel button:hover,
.list-menu-panel button.selected {
    color: var(--text-h);
    background: var(--bg-hover);
}

.current-status {
    margin: 4px 8px 6px;
    color: var(--text-muted);
    font-size: 12px;
}

.list-menu-panel .remove-action {
    margin-top: 4px;
    border-top: 1px solid var(--border);
    border-radius: 0;
}

.menu-error {
    margin: 5px 8px;
    color: var(--danger);
    font-size: 12px;
    white-space: normal;
}

@media (hover: hover) {
    .list-menu-trigger {
        opacity: 0.68;
    }

    .list-menu-trigger:hover,
    .list-menu-trigger:focus-visible {
        opacity: 1;
    }
}
</style>

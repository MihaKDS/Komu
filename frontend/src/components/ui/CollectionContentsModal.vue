<template>
    <div
        v-if="modelValue"
        class="collection-modal-overlay"
        @click.self="close"
        @keydown.esc="close"
    >
        <section
            class="collection-modal"
            role="dialog"
            aria-modal="true"
            :aria-label="`${collectionName} contents`"
        >
            <header class="modal-header">
                <h2>{{ collectionName }}</h2>
                <button
                    type="button"
                    class="modal-close"
                    aria-label="Close collection contents"
                    @click="close"
                >
                    ×
                </button>
            </header>

            <p v-if="mediaItems.length === 0" class="empty-state">
                No media in this collection.
            </p>

            <div v-else class="media-rows">
                <div
                    v-for="media in mediaItems"
                    :key="media.id"
                    class="media-row"
                >
                    <RouterLink
                        v-if="!readOnly"
                        :to="{
                            name: 'media',
                            params: { id: media.id },
                            query: { from: 'search' },
                        }"
                        class="media-row-link"
                        @click="close"
                    >
                        <span class="media-title">{{ media.title }}</span>
                        <span class="media-subtitle">
                            {{ media.releaseYear || media.category }}
                        </span>
                    </RouterLink>
                    <div v-else class="media-row-link">
                        <span class="media-title">{{ media.title }}</span>
                        <span class="media-subtitle">
                            {{ media.releaseYear || media.category }}
                        </span>
                    </div>

                    <ListMenu
                        v-if="!readOnly"
                        class="list-button"
                        :media-id="media.id"
                        :category="media.category"
                    />
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { onBeforeUnmount, watch } from "vue";
import { RouterLink } from "vue-router";
import ListMenu from "./ListMenu.vue";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    collectionName: {
        type: String,
        required: true,
    },
    mediaItems: {
        type: Array,
        default: () => [],
    },
    readOnly: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update:modelValue", "close"]);
let previousBodyOverflow = null;

watch(
    () => props.modelValue,
    (isOpen) => {
        if (isOpen) {
            previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        } else if (previousBodyOverflow !== null) {
            document.body.style.overflow = previousBodyOverflow;
            previousBodyOverflow = null;
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    if (previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
    }
});

function close() {
    emit("update:modelValue", false);
    emit("close");
}

</script>

<style scoped>
.collection-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.68);
}

.collection-modal {
    display: flex;
    flex-direction: column;
    width: min(840px, calc(100vw - 32px));
    height: min(76vh, 760px);
    max-height: min(86vh, 860px);
    overflow: hidden;
    color: var(--text);
    background: var(--bg-secondary);
    opacity: 1;
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.modal-header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: 0 0 auto;
    margin: 0;
    padding: 12px 15px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
}

.modal-header h2 {
    min-width: 0;
    margin: 0;
    color: var(--text-h);
    font-size: 18px;
    overflow-wrap: anywhere;
}

.modal-close {
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    padding: 0;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
}

.media-rows {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 15px;
}

.media-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 54px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
}

.media-row:last-child {
    border-bottom: 0;
}

.media-row-link {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    color: var(--text-h);
    text-decoration: none;
}

.media-row-link:hover .media-title {
    color: var(--accent-hover);
}

.media-title,
.media-subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.media-title {
    font-size: 14px;
    font-weight: 600;
}

.media-subtitle {
    color: var(--text-muted);
    font-size: 11px;
}

.empty-state {
    margin: 18px 15px;
    color: var(--text-muted);
    font-size: 13px;
}

@media (max-width: 480px) {
    .collection-modal-overlay {
        align-items: flex-end;
        padding: 8px;
    }

    .collection-modal {
        width: 100%;
        height: 84vh;
        height: 84dvh;
        max-height: 90vh;
        max-height: 90dvh;
    }

    .media-row {
        gap: 6px;
    }
}
</style>

<template>
    <div
        v-if="modelValue"
        class="share-overlay"
        @click.self="close"
        @keydown.esc="close"
    >
        <section
            class="share-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
        >
            <header class="share-header">
                <h2 id="share-dialog-title">Share Collection</h2>
                <button
                    type="button"
                    class="share-close"
                    aria-label="Close share dialog"
                    @click="close"
                >
                    ×
                </button>
            </header>

            <div class="share-content">
                <p v-if="loading" class="share-message">Loading share link...</p>
                <p v-else-if="error" class="share-error">{{ error }}</p>

                <template v-if="!loading && !share && !error">
                    <label for="share-expiration">Link expires after:</label>
                    <select id="share-expiration" v-model="expiresIn">
                        <option value="1h">1 hour</option>
                        <option value="1d">1 day</option>
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                    </select>
                    <button
                        type="button"
                        class="primary-action"
                        :disabled="working"
                        @click="createLink"
                    >
                        {{ working ? "Creating..." : "Create Share Link" }}
                    </button>
                </template>

                <template v-if="share">
                    <p class="share-message">Your collection is ready to share.</p>
                    <p class="share-url">{{ shareUrl }}</p>
                    <p class="share-expiry">Expires: {{ formattedExpiry }}</p>
                    <p v-if="copied" class="share-confirmation" role="status">Copied</p>
                    <div class="share-actions">
                        <button
                            type="button"
                            class="primary-action"
                            :disabled="working"
                            @click="copyLink"
                        >
                            Copy Link
                        </button>
                        <button
                            type="button"
                            class="revoke-action"
                            :disabled="working"
                            @click="revokeLink"
                        >
                            {{ working ? "Please wait..." : "Revoke Link" }}
                        </button>
                    </div>
                </template>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
    createCollectionShare,
    getCollectionShare,
    revokeCollectionShare,
} from "../../api/collectionSharingAPI.js";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update:modelValue"]);
const share = ref(null);
const expiresIn = ref("7d");
const loading = ref(false);
const working = ref(false);
const error = ref("");
const copied = ref(false);
let previousBodyOverflow = null;

const shareUrl = computed(() =>
    share.value ? `${window.location.origin}/share/${share.value.token}` : "",
);
const formattedExpiry = computed(() => {
    if (!share.value?.expiresAt) return "";
    return new Date(share.value.expiresAt).toLocaleString();
});

watch(
    () => props.modelValue,
    async (isOpen) => {
        if (!isOpen) {
            restoreBodyOverflow();
            return;
        }

        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        loading.value = true;
        error.value = "";
        copied.value = false;
        share.value = null;

        try {
            share.value = await getCollectionShare();
        } catch (err) {
            error.value = err.message || "Unable to load your share link.";
        } finally {
            loading.value = false;
        }
    },
    { immediate: true },
);

onBeforeUnmount(restoreBodyOverflow);

function restoreBodyOverflow() {
    if (previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = null;
    }
}

function close() {
    emit("update:modelValue", false);
}

async function createLink() {
    working.value = true;
    error.value = "";
    try {
        share.value = await createCollectionShare(expiresIn.value);
    } catch (err) {
        error.value = err.message || "Unable to create a share link.";
    } finally {
        working.value = false;
    }
}

async function copyLink() {
    error.value = "";
    try {
        await navigator.clipboard.writeText(shareUrl.value);
        copied.value = true;
    } catch (err) {
        error.value = err.message || "Unable to copy the share link.";
    }
}

async function revokeLink() {
    working.value = true;
    error.value = "";
    try {
        await revokeCollectionShare();
        share.value = null;
        copied.value = false;
    } catch (err) {
        error.value = err.message || "Unable to revoke the share link.";
    } finally {
        working.value = false;
    }
}
</script>

<style scoped>
.share-overlay {
    position: fixed;
    inset: 0;
    z-index: 4000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.72);
}

.share-dialog {
    width: min(440px, calc(100vw - 24px));
    color: var(--text);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.share-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 15px;
    border-bottom: 1px solid var(--border);
}

.share-header h2 {
    margin: 0;
    color: var(--text-h);
    font-size: 18px;
}

.share-close {
    width: 36px;
    height: 36px;
    padding: 0;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    font-size: 24px;
    cursor: pointer;
}

.share-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
}

.share-content label,
.share-message,
.share-expiry,
.share-error,
.share-confirmation {
    margin: 0;
    font-size: 13px;
}

.share-content select,
.primary-action,
.revoke-action {
    min-height: 38px;
    padding: 8px 10px;
    color: var(--text);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
}

.share-url {
    overflow-wrap: anywhere;
    padding: 9px;
    color: var(--text-h);
    background: var(--bg-card);
    border: 1px solid var(--border);
    font-size: 13px;
}

.share-expiry,
.share-message {
    color: var(--text-secondary);
}

.share-confirmation {
    color: var(--accent-hover);
}

.share-error {
    color: var(--danger);
}

.share-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.primary-action {
    color: var(--text-h);
    background: var(--accent);
    border-color: var(--accent);
    cursor: pointer;
}

.revoke-action {
    color: var(--text);
    cursor: pointer;
}

.primary-action:disabled,
.revoke-action:disabled {
    opacity: 0.6;
    cursor: wait;
}

@media (max-width: 480px) {
    .share-overlay {
        padding: 8px;
    }
}
</style>

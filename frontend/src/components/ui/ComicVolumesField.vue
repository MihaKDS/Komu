<script setup>
import {
    computed,
    ref,
    watch,
} from "vue";

import {
    getNextComicVolumeValue,
    splitComicVolumeInput,
} from "../../utils/comicVolumes.js";

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => [],
    },
    label: {
        type: String,
        default: "Volumes",
    },
    hint: {
        type: String,
        default:
            "Press Enter or separate multiple values with commas.",
    },
    placeholder: {
        type: String,
        default:
            "Add a volume (for example: 1, 2, Special)",
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    autoSuggestNext: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits([
    "update:modelValue",
]);

const draftValue = ref("");

const volumes = computed(() =>
    props.modelValue,
);

function updateVolumes(values) {
    emit(
        "update:modelValue",
        values,
    );
}

function suggestNextVolume(values) {
    if (props.autoSuggestNext) {
        draftValue.value =
            getNextComicVolumeValue(values);
    }
}

watch(
    () => props.modelValue,
    (values) => suggestNextVolume(values),
    { immediate: true },
);

function addVolumes() {
    const nextVolumes =
        splitComicVolumeInput(
            draftValue.value,
        );

    if (nextVolumes.length === 0) {
        return;
    }

    const existingVolumeValues = new Set(
        volumes.value.map(
            (volume) => volume.trim(),
        ),
    );
    const uniqueNewVolumes = nextVolumes.filter(
        (volume) =>
            !existingVolumeValues.has(volume),
    );

    if (uniqueNewVolumes.length === 0) {
        return;
    }

    const updatedVolumes = [
        ...volumes.value,
        ...uniqueNewVolumes,
    ];

    updateVolumes(updatedVolumes);

    suggestNextVolume(updatedVolumes);
}

function removeVolume(volume) {
    updateVolumes(
        volumes.value.filter(
            (item) => item !== volume,
        ),
    );
}
</script>

<template>
    <div class="comic-volumes-field">
        <div class="field-header">
            <label>{{ label }}</label>

            <span class="field-hint">
                {{ hint }}
            </span>
        </div>

        <div class="volume-entry">
            <input
                v-model="draftValue"
                type="text"
                :placeholder="placeholder"
                :disabled="disabled"
                @keydown.enter.prevent="addVolumes"
            >

            <button
                type="button"
                class="secondary-button"
                :disabled="disabled"
                @click="addVolumes"
            >
                Add
            </button>
        </div>

        <div
            v-if="volumes.length"
            class="volume-chip-list"
        >
            <button
                v-for="volume in volumes"
                :key="volume"
                type="button"
                class="volume-chip"
                :disabled="disabled"
                @click="removeVolume(volume)"
            >
                <span>{{ volume }}</span>

                <span
                    aria-hidden="true"
                    class="remove-icon"
                >
                    ×
                </span>
            </button>
        </div>

        <p
            v-else
            class="empty-state"
        >
            No volumes added yet.
        </p>
    </div>
</template>

<style scoped>
.comic-volumes-field {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.field-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px 12px;
}

.field-header label {
    color: var(--text-h);
    font-weight: 600;
}

.field-hint,
.empty-state {
    color: var(--text-muted);
    font-size: 12px;
}

.volume-entry {
    display: flex;
    gap: 10px;
}

.volume-entry input {
    flex: 1;
    min-width: 0;
}

.volume-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.volume-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 6px 10px;
    color: var(--text-h);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.volume-chip:hover:not(:disabled) {
    background: var(--bg-hover);
}

.remove-icon {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1;
}

@media (max-width: 600px) {
    .volume-entry {
        flex-direction: column;
    }

    .volume-entry button {
        width: 100%;
    }
}
</style>

<template>
    <div :class="['physical-media-visual', `physical-media-${normalizedType}`, `physical-media-category-${normalizedCategory}`, `physical-media-format-${normalizedFormatClass}`]" aria-hidden="true">
        <div class="case-front">
            <img class="case-frame" :src="caseFrameImage" alt="">
            <img class="case-cover" :style="coverStyle" :src="coverImage" :alt="coverAlt" loading="lazy">
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const bluRayCase = "/copyImages/br_box.png";
const dvdCase = "/copyImages/dvd_box.png";
const fourKUhdCase = "/copyImages/4k_box.png";
const bluRayBoxSet = "/copyImages/br_boxset.png";
const dvdBoxSet = "/copyImages/dvd_boxset.png";
const fourKUhdBoxSet = "/copyImages/4k_boxset.png";
const hardcoverCase = "/copyImages/hardcover.png";
const softcoverCase = "/copyImages/softcover.png";
const cdCase = "/copyImages/cd.png";
const vinylCase = "/copyImages/viynl.png";

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ["COPY", "BOXSET"].includes(value),
    },
    format: {
        type: String,
        default: "BLURAY",
    },
    category: {
        type: String,
        default: "MOVIE",
    },
    coverImage: {
        type: String,
        required: true,
    },
    coverAlt: {
        type: String,
        default: "Media cover",
    },
});

const normalizedType = computed(() => props.type.toLowerCase());
const normalizedCategory = computed(() => props.category?.toUpperCase() || "MOVIE");
const normalizedFormat = computed(() => props.format?.toUpperCase() || "BLURAY");
const normalizedFormatClass = computed(() => normalizedFormat.value.toLowerCase().replaceAll("_", "-"));
const coverStyle = computed(() => {
    if (normalizedCategory.value === "MUSIC") {
        if (normalizedFormat.value === "CD") {
            return {
                top: "20.7%",
                left: "25.7%",
                width: "50.2%",
                height: "63.4%",
                clipPath: "polygon(0 10%, 100% 0, 100% 87.7%, 0 100%)",
            };
        }

        if (normalizedFormat.value === "VINYL") {
            return {
                top: "11.7%",
                left: "12%",
                width: "59.7%",
                height: "75.3%",
                clipPath: "polygon(0 7.4%, 100% 0, 100% 91%, 0 100%)",
            };
        }
    }

    if (!["BOOK", "COMIC"].includes(normalizedCategory.value)) return undefined;

    if (normalizedFormat.value === "HARD_COVER") {
        return {
            top: "5.8%",
            left: "28.6%",
            width: "54%",
            height: "87.3%",
            clipPath: "polygon(0 5.8%, 100% 0, 99.5% 91%, 0 100%)",
        };
    }

    if (normalizedFormat.value === "SOFT_COVER") {
        return {
            top: "9.2%",
            left: "28.6%",
            width: "54.5%",
            height: "85.5%",
            clipPath: "polygon(0 8.1%, 100% 0, 96.5% 89%, 0 100%)",
        };
    }

    return undefined;
});
const caseFrameImage = computed(() => {
    if (normalizedCategory.value === "MUSIC") {
        return normalizedFormat.value === "VINYL" ? vinylCase : cdCase;
    }

    if (["BOOK", "COMIC"].includes(normalizedCategory.value)) {
        return normalizedFormat.value === "HARD_COVER" ? hardcoverCase : softcoverCase;
    }

    const images = normalizedType.value === "boxset"
        ? { DVD: dvdBoxSet, UHD_4K: fourKUhdBoxSet }
        : { DVD: dvdCase, UHD_4K: fourKUhdCase };

    return images[normalizedFormat.value] ||
        (normalizedType.value === "boxset" ? bluRayBoxSet : bluRayCase);
});
</script>

<style scoped>
.physical-media-visual {
    --case-width: 88px;
    --case-height: 114px;

    position: relative;
    flex: 0 0 auto;
    width: var(--case-width);
    height: var(--case-height);
    isolation: isolate;
}

.physical-media-category-book,
.physical-media-category-comic {
    --case-height: 95px;
}

.physical-media-category-music {
    --case-height: 82px;
}

.case-front,
.case-frame {
    position: absolute;
    inset: 0;
    width: var(--case-width);
    height: var(--case-height);
}

.case-front {
    right: 0;
    z-index: 4;
    filter: drop-shadow(2px 4px 5px rgb(0 0 0 / 42%));
}

.case-frame {
    display: block;
    object-fit: fill;
    pointer-events: none;
}

.case-cover {
    position: absolute;
    z-index: 1;
    top: 22%;
    left: 19%;
    width: 72%;
    height: 69%;
    object-fit: cover;
    object-position: center;
    clip-path: polygon(0 0, 100% 1.5%, 100% 98.5%, 0 100%);
}

.physical-media-copy .case-cover {
    top: 16.3%;
    left: 20.3%;
    width: 68.3%;
    height: 75.4%;
    clip-path: polygon(0 0, 100% 7.2%, 100% 93%, 0 100%);
}

.physical-media-boxset .case-cover {
    top: 16.3%;
    left: 31.5%;
    width: 58.7%;
    height: 76.5%;
    clip-path: polygon(0 0, 100% 7%, 100% 93%, 0 100%);
}

@media (max-width: 700px) {
    .physical-media-visual {
        --case-width: 76px;
        --case-height: 98px;
    }

    .physical-media-visual.physical-media-category-book,
    .physical-media-visual.physical-media-category-comic {
        --case-height: 82px;
    }

    .physical-media-visual.physical-media-category-music {
        --case-height: 71px;
    }
}
</style>

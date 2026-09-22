const NUMERIC_VOLUME_PATTERN = /^[+-]?\d+(?:\.\d+)?$/;
const COMIC_TITLE_VOLUME_PATTERN = /^vol(?:ume)?\.?\s*(.+)$/i;

function normalizeVolumeValue(value) {
    if (value == null) {
        return "";
    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ");
}

function toVolumeEntry(value) {
    const normalized = normalizeVolumeValue(value);
    const isNumeric = NUMERIC_VOLUME_PATTERN.test(normalized);
    const numericValue = isNumeric ? Number(normalized) : null;

    return {
        value: normalized,
        isNumeric,
        numericValue,
        isInteger:
            isNumeric &&
            Number.isInteger(numericValue),
    };
}

function compareTextValues(left, right) {
    return left.localeCompare(
        right,
        undefined,
        {
            sensitivity: "base",
            numeric: true,
        },
    );
}

export function splitComicVolumeInput(input) {
    return String(input ?? "")
        .split(/[\r\n,;]+/g)
        .map(normalizeVolumeValue)
        .filter(Boolean);
}

export function getNextComicVolumeValue(values = []) {
    let highestVolume = null;

    for (const value of values) {
        const entry = toVolumeEntry(value);

        if (
            entry.isNumeric &&
            (highestVolume === null ||
                entry.numericValue > highestVolume)
        ) {
            highestVolume = entry.numericValue;
        }
    }

    return String(
        highestVolume === null
            ? 1
            : highestVolume + 1,
    );
}

export function sortComicVolumeValues(values = []) {
    const seen = new Set();
    const entries = [];

    for (const value of values) {
        const normalized = normalizeVolumeValue(value);

        if (!normalized) {
            continue;
        }

        const dedupeKey = normalized.toLowerCase();

        if (seen.has(dedupeKey)) {
            continue;
        }

        seen.add(dedupeKey);
        entries.push(toVolumeEntry(normalized));
    }

    entries.sort((left, right) => {
        if (left.isNumeric && right.isNumeric) {
            if (left.numericValue !== right.numericValue) {
                return left.numericValue - right.numericValue;
            }

            return compareTextValues(
                left.value,
                right.value,
            );
        }

        if (left.isNumeric !== right.isNumeric) {
            return left.isNumeric ? -1 : 1;
        }

        return compareTextValues(
            left.value,
            right.value,
        );
    });

    return entries.map((entry) => entry.value);
}

export function getComicVolumeValues(source) {
    if (
        Array.isArray(source?.volumes) &&
        source.volumes.length > 0
    ) {
        return sortComicVolumeValues(
            source.volumes,
        );
    }

    const fallbackTitle =
        normalizeVolumeValue(source?.title);

    if (!fallbackTitle) {
        return [];
    }

    const match =
        fallbackTitle.match(
            COMIC_TITLE_VOLUME_PATTERN,
        );

    if (!match?.[1]) {
        return [];
    }

    return sortComicVolumeValues([
        match[1],
    ]);
}

export function collectComicVolumeValuesFromCopies(
    copies = [],
) {
    return sortComicVolumeValues(
        copies.flatMap((copy) =>
            getComicVolumeValues(copy),
        ),
    );
}

export function formatComicVolumes(
    values = [],
    options = {},
) {
    const {
        withLabel = true,
    } = options;

    const sortedValues =
        sortComicVolumeValues(values);

    if (sortedValues.length === 0) {
        return "";
    }

    const entries = sortedValues.map(
        toVolumeEntry,
    );

    const numericEntries =
        entries.filter(
            (entry) => entry.isNumeric,
        );

    const nonNumericEntries =
        entries.filter(
            (entry) => !entry.isNumeric,
        );

    const numericParts = [];
    let index = 0;

    while (index < numericEntries.length) {
        const startEntry =
            numericEntries[index];

        if (!startEntry.isInteger) {
            numericParts.push(
                startEntry.value,
            );
            index += 1;
            continue;
        }

        let endIndex = index;

        while (
            endIndex + 1 <
                numericEntries.length &&
            numericEntries[
                endIndex + 1
            ].isInteger &&
            numericEntries[
                endIndex + 1
            ].numericValue ===
                numericEntries[endIndex]
                    .numericValue + 1
        ) {
            endIndex += 1;
        }

        const runLength =
            endIndex - index + 1;

        if (runLength >= 3) {
            numericParts.push(
                `${numericEntries[index].value}–${numericEntries[endIndex].value}`,
            );
        } else {
            for (
                let runIndex = index;
                runIndex <= endIndex;
                runIndex += 1
            ) {
                numericParts.push(
                    numericEntries[runIndex]
                        .value,
                );
            }
        }

        index = endIndex + 1;
    }

    const parts = [
        ...numericParts,
        ...nonNumericEntries.map(
            (entry) => entry.value,
        ),
    ];

    if (!withLabel) {
        return parts.join(", ");
    }

    const label =
        parts.length === 1 &&
        !parts[0].includes("–")
            ? "Volume"
            : "Volumes";

    return `${label} ${parts.join(", ")}`;
}

export function formatComicVolumesForCopy(
    copy,
    options = {},
) {
    return formatComicVolumes(
        getComicVolumeValues(copy),
        options,
    );
}

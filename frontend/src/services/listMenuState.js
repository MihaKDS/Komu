import { ref } from "vue";

export const openListMenuId = ref(null);

export function listStatusLabel(status, category = "") {
    if (status === "WISHLIST") return "Wishlist";
    if (status === "TO_WATCH") {
        return ["BOOK", "COMIC"].includes(category) ? "To Read" : "To Watch";
    }
    if (status === "WATCHING") {
        return ["BOOK", "COMIC"].includes(category) ? "Reading" : "Watching";
    }
    return "Completed";
}

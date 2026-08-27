import { apiFetch } from "./client";

export function getTrades() {
  return apiFetch("/trades");
}

export function getTrade(id) {
  return apiFetch(`/trades/${id}`);
}

export function createTrade(payload) {
  return apiFetch("/trades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addTradeMessage(id, message) {
  return apiFetch(`/trades/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function acceptTrade(id) {
  return apiFetch(`/trades/${id}/accept`, {
    method: "POST",
  });
}

export function rejectTrade(id) {
  return apiFetch(`/trades/${id}/reject`, {
    method: "POST",
  });
}

export function confirmSellerTransfer(id) {
  return apiFetch(`/trades/${id}/seller-transfer`, {
    method: "POST",
  });
}

export function confirmBuyerTransfer(id) {
  return apiFetch(`/trades/${id}/buyer-transfer`, {
    method: "POST",
  });
}

export function requestTradeReturn(id) {
  return apiFetch(`/trades/${id}/return-request`, {
    method: "POST",
  });
}

export function acceptTradeReturn(id) {
  return apiFetch(`/trades/${id}/accept-return`, {
    method: "POST",
  });
}

export function cancelTrade(id) {
  return apiFetch(`/trades/${id}/cancel`, {
    method: "POST",
  });
}

export function declineTradeTransfer(id) {
  return apiFetch(`/trades/${id}/decline-transfer`, {
    method: "POST",
  });
}

export function updateTradeItems(id, items) {
  return apiFetch(`/trades/${id}/items`, {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}

export function completeTrade(id, transferCopies) {
  return apiFetch(`/trades/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ transferCopies }),
  });
}
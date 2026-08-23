// ======================================================
// UI.JS — Giao diện dùng chung: Dialog, Routing, Sidebar
// ======================================================

// ── Dialog ──────────────────────────────────────────────
const actionDialog       = document.getElementById("action-dialog");
const dialogTitle        = document.getElementById("dialog-title");
const dialogMessage      = document.getElementById("dialog-message");
const dialogConfirmButton = document.getElementById("dialog-confirm-button");
const dialogCancelButton  = document.getElementById("dialog-cancel-button");

let pendingDialogAction = null;

export function openActionDialog({ title, text, confirmText, type = "edit", onConfirm }) {
    if (!actionDialog) {
        if (confirm(text)) onConfirm();
        return;
    }
    dialogTitle.textContent   = title;
    dialogMessage.textContent = text;
    dialogConfirmButton.textContent = confirmText;
    actionDialog.classList.toggle("is-delete", type === "delete");
    pendingDialogAction = onConfirm;
    actionDialog.showModal();
    dialogConfirmButton.focus();
}

export function closeActionDialog() {
    pendingDialogAction = null;
    if (actionDialog && actionDialog.open) actionDialog.close();
}

if (dialogConfirmButton) {
    dialogConfirmButton.addEventListener("click", async () => {
        if (pendingDialogAction) {
            const action = pendingDialogAction;
            closeActionDialog();
            await action();
        }
    });
}

if (actionDialog) {
    actionDialog.addEventListener("click", (e) => {
        if (e.target === actionDialog) closeActionDialog();
    });
}


// ── Escape HTML (dùng chung) ────────────────────────────
export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}


// ── Routing hash-based ──────────────────────────────────
const routeTitles = {
    crops:    "Quản lý cây trồng",
    diseases: "Quản lý sâu bệnh"
};

export function renderRoute() {
    // Đóng toàn bộ dialog đang mở khi chuyển trang
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());

    const requestedRoute = window.location.hash.replace("#", "");
    const route = Object.hasOwn(routeTitles, requestedRoute) ? requestedRoute : "crops";

    document.querySelectorAll("[data-view]").forEach((view) => {
        const isActive = view.dataset.view === route;
        view.hidden = !isActive;
        view.classList.toggle("active", isActive);
    });

    document.querySelectorAll("[data-route]").forEach((link) => {
        const isActive = link.dataset.route === route;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    });

    document.getElementById("page-title").textContent = routeTitles[route];
    document.title = `${routeTitles[route]} — AgriAdmin`;
    document.body.classList.remove("menu-open");
    document.getElementById("menu-button")?.setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "auto" });
}

// ── Sidebar toggle ──────────────────────────────────────
export function initSidebar() {
    window.addEventListener("hashchange", renderRoute);

    document.getElementById("menu-button")?.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("menu-open");
        document.getElementById("menu-button").setAttribute("aria-expanded", String(isOpen));
    });

    document.getElementById("sidebar-overlay")?.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        document.getElementById("menu-button")?.setAttribute("aria-expanded", "false");
    });
}

// ======================================================
// DISEASES.JS — Quản lý sâu bệnh (Multi-Page + Dialog Form)
// ======================================================

import {
    db,
    diseasesCollection,
    cropsCollection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "./firebase-config.js";

// ── DOM Elements ────────────────────────────────────────
const diseaseDialog      = document.getElementById("disease-dialog");
const newDiseaseButton   = document.getElementById("new-disease-button");
const dialogCloseButton  = document.getElementById("disease-dialog-close");
const diseaseForm        = document.getElementById("disease-form");
const diseaseIdInput     = document.getElementById("disease-id");
const cropIdInput        = document.getElementById("disease-crop-id");
const diseaseNameInput   = document.getElementById("disease-name");
const diseaseRiskSelect  = document.getElementById("disease-risk");
const diseaseSolutionInput = document.getElementById("disease-solution");
const saveButton         = document.getElementById("disease-save-button");
const cancelButton       = document.getElementById("disease-cancel-button");
const diseaseTableBody   = document.getElementById("disease-table-body");
const formTitle          = document.getElementById("disease-form-title");
const message            = document.getElementById("disease-message");
const searchInput        = document.getElementById("disease-search");
const totalText          = document.getElementById("disease-total-text");
const cropIdOptions      = document.getElementById("crop-id-options");

let diseases = [];
let cropsMap = {};
let currentEditId = null;

// ── Quản lý mở / đóng Dialog ─────────────────────────────
function openDiseaseDialog() {
    if (diseaseDialog && !diseaseDialog.open) diseaseDialog.showModal();
}

function closeDiseaseDialog() {
    if (diseaseDialog && diseaseDialog.open) diseaseDialog.close();
}

// ── Hiển thị thông báo ──────────────────────────────────
function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "#d93838" : "#24734f";
}

// ── Escape HTML ─────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

// ── Reset Form ──────────────────────────────────────────
function resetDiseaseForm() {
    currentEditId = null;
    if (diseaseIdInput) { diseaseIdInput.value = ""; diseaseIdInput.disabled = false; }
    if (cropIdInput) cropIdInput.value = "";
    if (diseaseNameInput) diseaseNameInput.value = "";
    if (diseaseRiskSelect) diseaseRiskSelect.value = "";
    if (diseaseSolutionInput) diseaseSolutionInput.value = "";

    if (formTitle) formTitle.textContent = "Thêm sâu bệnh";
    if (saveButton) saveButton.textContent = "Lưu sâu bệnh";
    showMessage("");
}

// ── Tải danh sách cây trồng gợi ý ──────────────────────
async function loadCropsMap() {
    try {
        const snapshot = await getDocs(cropsCollection);
        cropsMap = {};
        if (cropIdOptions) cropIdOptions.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cropName = data.name_vi || data.name_en || docSnap.id;
            cropsMap[docSnap.id] = cropName;

            if (cropIdOptions) {
                const opt = document.createElement("option");
                opt.value = docSnap.id;
                opt.label = `${cropName} (${docSnap.id})`;
                cropIdOptions.appendChild(opt);
            }
        });

        const cropNavCount = document.getElementById("crop-nav-count");
        if (cropNavCount) cropNavCount.textContent = Object.keys(cropsMap).length;
    } catch (err) {
        console.error("Không thể tải danh sách cây trồng:", err);
    }
}

// ── 1. READ: Tải danh sách sâu bệnh ─────────────────────
async function loadDiseases() {
    if (diseaseTableBody) {
        diseaseTableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Đang tải dữ liệu...</td></tr>`;
    }

    await loadCropsMap();

    try {
        const snapshot = await getDocs(diseasesCollection);
        diseases = [];
        snapshot.forEach((docSnap) => {
            diseases.push({ id: docSnap.id, ...docSnap.data() });
        });

        displayDiseases(diseases);
    } catch (err) {
        console.error("Lỗi khi tải sâu bệnh:", err);
        if (diseaseTableBody) {
            diseaseTableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Không thể tải dữ liệu sâu bệnh.</td></tr>`;
        }
    }
}

// ── Hiển thị dữ liệu lên bảng ────────────────────────────
function displayDiseases(diseaseList) {
    if (!diseaseTableBody) return;
    diseaseTableBody.innerHTML = "";

    const totalCount    = diseaseList.length;
    const highRiskCount = diseaseList.filter(d => (d.risk_level || "").toLowerCase() === "high").length;
    const solutionCount = diseaseList.filter(d => d.solution && d.solution.trim() !== "").length;

    const navCount     = document.getElementById("disease-nav-count");
    const pageCount    = document.getElementById("disease-page-count");
    const highRiskEl   = document.getElementById("high-risk-count");
    const solutionEl   = document.getElementById("solution-count");

    if (navCount)   navCount.textContent   = diseases.length;
    if (pageCount)  pageCount.textContent  = diseases.length;
    if (highRiskEl) highRiskEl.textContent = highRiskCount;
    if (solutionEl) solutionEl.textContent = solutionCount;

    if (totalText) {
        totalText.textContent = `Tổng số sâu bệnh: ${totalCount} / ${diseases.length}`;
    }

    if (diseaseList.length === 0) {
        diseaseTableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Chưa có dữ liệu sâu bệnh.</td></tr>`;
        return;
    }

    diseaseList.forEach((disease) => {
        const row = document.createElement("tr");
        const cropName = cropsMap[disease.crop_id] 
            ? `${escapeHtml(cropsMap[disease.crop_id])} <small style="color:#888;">(${escapeHtml(disease.crop_id)})</small>`
            : escapeHtml(disease.crop_id || "Không rõ");

        let riskBadge = `<span class="risk-badge risk-low">Thấp</span>`;
        const risk = (disease.risk_level || "").toLowerCase();
        if (risk === "medium") riskBadge = `<span class="risk-badge risk-medium">Trung bình</span>`;
        if (risk === "high")   riskBadge = `<span class="risk-badge risk-high">Cao</span>`;

        row.innerHTML = `
            <td><code>${escapeHtml(disease.disease_id || disease.id)}</code></td>
            <td>${cropName}</td>
            <td><strong>${escapeHtml(disease.name || "Chưa có tên")}</strong></td>
            <td>${riskBadge}</td>
            <td>${escapeHtml(disease.solution || "Chưa có giải pháp")}</td>
            <td>
                <div class="action-buttons">
                    <button class="disease-edit-button"   data-id="${disease.id}">Sửa</button>
                    <button class="disease-delete-button" data-id="${disease.id}">Xóa</button>
                </div>
            </td>
        `;
        diseaseTableBody.appendChild(row);
    });
}

// ── 2. CREATE / UPDATE ───────────────────────────────────
async function saveDisease(e) {
    e.preventDefault();

    const diseaseId = diseaseIdInput.value.trim();
    const cropId    = cropIdInput.value.trim();
    const name      = diseaseNameInput.value.trim();
    const risk      = diseaseRiskSelect.value;
    const solution  = diseaseSolutionInput.value.trim();

    if (!diseaseId || !cropId || !name || !risk || !solution) {
        showMessage("Vui lòng điền đầy đủ các thông tin bắt buộc (*).", true);
        return;
    }

    const diseaseData = {
        disease_id: diseaseId,
        crop_id: cropId,
        name: name,
        risk_level: risk,
        solution: solution,
        updated_at: serverTimestamp()
    };

    try {
        if (currentEditId) {
            const docRef = doc(db, "diseases", currentEditId);
            await updateDoc(docRef, diseaseData);
        } else {
            diseaseData.created_at = serverTimestamp();
            await addDoc(diseasesCollection, diseaseData);
        }

        closeDiseaseDialog();
        resetDiseaseForm();
        await loadDiseases();
    } catch (err) {
        console.error("Lỗi khi lưu sâu bệnh:", err);
        showMessage("Không thể lưu dữ liệu.", true);
    }
}

// ── 3. DELETE ────────────────────────────────────────────
async function removeDisease(docId) {
    const disease = diseases.find(d => d.id === docId);
    if (!disease) return;

    const confirmDelete = confirm(`Bạn có chắc muốn xóa "${disease.name || disease.disease_id}" không?`);
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "diseases", docId));
        await loadDiseases();
    } catch (err) {
        console.error("Lỗi khi xóa:", err);
        alert("Không thể xóa bản ghi.");
    }
}

// ── Mở Dialog để sửa sâu bệnh ────────────────────────────
function startEditDisease(docId) {
    const disease = diseases.find(d => d.id === docId);
    if (!disease) return;

    currentEditId = docId;
    diseaseIdInput.value       = disease.disease_id || disease.id;
    diseaseIdInput.disabled    = true;
    cropIdInput.value          = disease.crop_id || "";
    diseaseNameInput.value     = disease.name || "";
    diseaseRiskSelect.value    = disease.risk_level || "";
    diseaseSolutionInput.value = disease.solution || "";

    if (formTitle) formTitle.textContent = "Chỉnh sửa sâu bệnh";
    if (saveButton) saveButton.textContent = "Lưu thay đổi";
    showMessage("");
    openDiseaseDialog();
}

// ── Tìm kiếm ────────────────────────────────────────────
function searchDiseases() {
    const kw = searchInput.value.trim().toLowerCase();
    const filtered = diseases.filter(d => {
        const name     = (d.name || "").toLowerCase();
        const code     = (d.disease_id || d.id || "").toLowerCase();
        const cropId   = (d.crop_id || "").toLowerCase();
        const cropName = (cropsMap[d.crop_id] || "").toLowerCase();
        return name.includes(kw) || code.includes(kw) || cropId.includes(kw) || cropName.includes(kw);
    });
    displayDiseases(filtered);
}

// ── LẮNG NGHE SỰ KIỆN ────────────────────────────────────
if (newDiseaseButton) {
    newDiseaseButton.addEventListener("click", () => {
        resetDiseaseForm();
        openDiseaseDialog();
    });
}

if (dialogCloseButton) {
    dialogCloseButton.addEventListener("click", () => closeDiseaseDialog());
}

if (cancelButton) {
    cancelButton.addEventListener("click", () => closeDiseaseDialog());
}

if (diseaseDialog) {
    diseaseDialog.addEventListener("click", (e) => {
        if (e.target === diseaseDialog) closeDiseaseDialog();
    });
}

if (diseaseForm) {
    diseaseForm.addEventListener("submit", saveDisease);
}

if (searchInput) {
    searchInput.addEventListener("input", searchDiseases);
}

if (diseaseTableBody) {
    diseaseTableBody.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const docId = button.dataset.id;
        if (!docId) return;

        if (button.classList.contains("disease-edit-button")) {
            startEditDisease(docId);
        } else if (button.classList.contains("disease-delete-button")) {
            await removeDisease(docId);
        }
    });
}

// Tự động tải dữ liệu khi mở trang
loadDiseases();

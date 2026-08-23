// ======================================================
// CROPS.JS — Quản lý cây trồng (Multi-Page + Dialog Form)
// ======================================================

import {
    db,
    cropsCollection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "./firebase-config.js";

// ── DOM Elements ────────────────────────────────────────
const cropDialog             = document.getElementById("crop-dialog");
const newCropButton          = document.getElementById("new-crop-button");
const dialogCloseButton      = document.getElementById("crop-dialog-close");
const cropForm               = document.getElementById("crop-form");
const cropIdInput            = document.getElementById("crop-id");
const cropIdDisplay          = document.getElementById("crop-id-display");
const nameViInput            = document.getElementById("name-vi");
const nameEnInput            = document.getElementById("name-en");
const categorySelect         = document.getElementById("category");
const signatureCountriesInput = document.getElementById("signatureCountries");
const saveButton             = document.getElementById("save-button");
const cancelButton           = document.getElementById("cancel-button");
const cropList               = document.getElementById("crop-list");
const formTitle              = document.getElementById("form-title");
const message                = document.getElementById("message");
const searchInput            = document.getElementById("search-input");
const categoryFilter         = document.getElementById("category-filter");
const totalText              = document.getElementById("total-text");

// Mảng chứa dữ liệu lấy từ Firestore
let crops = [];

// ── Quản lý mở / đóng Dialog ─────────────────────────────
function openCropDialog() {
    if (cropDialog && !cropDialog.open) cropDialog.showModal();
}

function closeCropDialog() {
    if (cropDialog && cropDialog.open) cropDialog.close();
}

// ── Hiển thị thông báo ──────────────────────────────────
function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "#d93838" : "#24734f";
}

// ── Kiểm tra thông tin nhập ─────────────────────────────
function validateForm() {
    const nameVi     = nameViInput.value.trim();
    const nameEn     = nameEnInput.value.trim();
    const categoryId = categorySelect.value;

    if (!nameVi) { showMessage("Vui lòng nhập tên tiếng Việt.", true); return false; }
    if (!nameEn) { showMessage("Vui lòng nhập tên tiếng Anh.", true);  return false; }
    if (!categoryId) { showMessage("Vui lòng chọn nhóm cây.", true);   return false; }
    return true;
}

// ── Chuyển mã nhóm cây thành tên tiếng Việt ─────────────
function getCategoryName(categoryId) {
    const map = {
        staple_crops:     "Cây lương thực",
        industrial_crops: "Cây công nghiệp",
        tropical_fruits:  "Cây ăn quả nhiệt đới",
        vegetables:       "Rau",
        herbs:            "Cây gia vị",
        timber_trees:     "Cây gỗ"
    };
    return map[categoryId] || "Chưa phân loại";
}

// ── Escape HTML tránh xss ─────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

// ── Reset biểu mẫu về trạng thái ban đầu ────────────────
function resetForm() {
    cropIdInput.value    = "";
    cropIdDisplay.value  = "";
    nameViInput.value    = "";
    nameEnInput.value    = "";
    categorySelect.value = "";
    signatureCountriesInput.value = "";
    formTitle.textContent  = "Thêm cây trồng";
    saveButton.textContent = "Lưu cây trồng";
    showMessage("");
}

// ── 1. READ: Tải danh sách từ Firestore ─────────────────
async function loadCrops() {
    cropList.innerHTML = `<tr><td colspan="5" class="empty-cell">Đang tải dữ liệu...</td></tr>`;
    if (totalText) totalText.textContent = "Đang tải danh sách cây trồng...";

    try {
        const snapshot = await getDocs(cropsCollection);
        crops = [];
        snapshot.forEach((docSnap) => {
            crops.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        crops.sort((a, b) => (a.name_vi || "").localeCompare(b.name_vi || "", "vi"));
        displayCrops(crops);
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        cropList.innerHTML = `<tr><td colspan="5" class="empty-cell">Không thể tải dữ liệu từ Firebase.</td></tr>`;
        if (totalText) totalText.textContent = "Không thể tải dữ liệu.";
    }
}

// ── Hiển thị dữ liệu lên bảng ────────────────────────────
function displayCrops(cropArray) {
    cropList.innerHTML = "";

    if (totalText) {
        totalText.textContent = `Tổng số cây trồng: ${cropArray.length} / ${crops.length}`;
    }

    const cropStatCount = document.getElementById("crop-stat-count");
    const cropNavCount  = document.getElementById("crop-nav-count");
    if (cropStatCount) cropStatCount.textContent = crops.length;
    if (cropNavCount)  cropNavCount.textContent  = crops.length;

    if (cropArray.length === 0) {
        cropList.innerHTML = `<tr><td colspan="5" class="empty-cell">Chưa có cây trồng nào.</td></tr>`;
        return;
    }

    cropArray.forEach((crop) => {
        const row = document.createElement("tr");

        let countriesText = "Chưa có";
        if (Array.isArray(crop.signature_countries) && crop.signature_countries.length > 0) {
            countriesText = escapeHtml(crop.signature_countries.join(", "));
        } else if (typeof crop.signature_countries === "string" && crop.signature_countries.trim()) {
            countriesText = escapeHtml(crop.signature_countries);
        }

        row.innerHTML = `
            <td><strong>${escapeHtml(crop.name_vi || "Chưa có tên")}</strong></td>
            <td>${escapeHtml(crop.name_en || "N/A")}</td>
            <td>${getCategoryName(crop.category_id)}</td>
            <td>${countriesText}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-button"   data-id="${crop.id}">Sửa</button>
                    <button class="delete-button" data-id="${crop.id}">Xóa</button>
                </div>
            </td>
        `;
        cropList.appendChild(row);
    });
}

// ── 2. CREATE: Thêm cây trồng mới ───────────────────────
async function addCrop() {
    if (!validateForm()) return;

    const newCrop = {
        name_vi:    nameViInput.value.trim(),
        name_en:    nameEnInput.value.trim(),
        category_id: categorySelect.value,
        signature_countries: signatureCountriesInput.value
            .split(",").map((c) => c.trim()).filter((c) => c !== ""),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    };

    try {
        await addDoc(cropsCollection, newCrop);
        closeCropDialog();
        resetForm();
        await loadCrops();
    } catch (error) {
        console.error("Lỗi khi thêm:", error);
        showMessage("Không thể thêm cây trồng.", true);
    }
}

// ── 3. UPDATE: Cập nhật cây trồng ────────────────────────
async function updateCrop() {
    if (!validateForm()) return;

    const cropId = cropIdInput.value;
    if (!cropId) { showMessage("Không tìm thấy ID cây trồng.", true); return; }

    const cropDocRef = doc(db, "crops", cropId);
    const updatedData = {
        name_vi:    nameViInput.value.trim(),
        name_en:    nameEnInput.value.trim(),
        category_id: categorySelect.value,
        signature_countries: signatureCountriesInput.value
            .split(",").map((c) => c.trim()).filter((c) => c !== ""),
        updated_at: serverTimestamp()
    };

    try {
        await updateDoc(cropDocRef, updatedData);
        closeCropDialog();
        resetForm();
        await loadCrops();
    } catch (error) {
        console.error("Lỗi khi cập nhật:", error);
        showMessage("Không thể cập nhật cây trồng.", true);
    }
}

// ── 4. DELETE: Xóa cây trồng ────────────────────────────
async function removeCrop(cropId) {
    const crop = crops.find((item) => item.id === cropId);
    if (!crop) return;

    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa "${crop.name_vi}" không?`);
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "crops", cropId));
        await loadCrops();
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Không thể xóa cây trồng.");
    }
}

// ── Mở Dialog để sửa cây trồng ──────────────────────────
function startEditCrop(cropId) {
    const crop = crops.find((item) => item.id === cropId);
    if (!crop) return;

    cropIdInput.value    = crop.id;
    cropIdDisplay.value  = crop.id;
    nameViInput.value    = crop.name_vi || "";
    nameEnInput.value    = crop.name_en || "";
    categorySelect.value = crop.category_id || "";
    signatureCountriesInput.value = crop.signature_countries?.join(", ") || "";

    formTitle.textContent  = "Chỉnh sửa cây trồng";
    saveButton.textContent = "Lưu thay đổi";
    showMessage("");
    openCropDialog();
}

// ── Lọc & Tìm kiếm ──────────────────────────────────────
function searchCrops() {
    const keyword          = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter ? categoryFilter.value : "";

    const filtered = crops.filter((crop) => {
        const nameVi = (crop.name_vi || "").toLowerCase();
        const nameEn = (crop.name_en || "").toLowerCase();
        const matchesKeyword   = nameVi.includes(keyword) || nameEn.includes(keyword);
        const matchesCategory  = !selectedCategory || crop.category_id === selectedCategory;
        return matchesKeyword && matchesCategory;
    });

    displayCrops(filtered);
}

// ── LẮNG NGHE SỰ KIỆN ────────────────────────────────────
if (newCropButton) {
    newCropButton.addEventListener("click", () => {
        resetForm();
        openCropDialog();
    });
}

if (dialogCloseButton) {
    dialogCloseButton.addEventListener("click", () => closeCropDialog());
}

if (cancelButton) {
    cancelButton.addEventListener("click", () => closeCropDialog());
}

if (cropDialog) {
    // Đóng khi click ngoài nền đen mờ
    cropDialog.addEventListener("click", (e) => {
        if (e.target === cropDialog) closeCropDialog();
    });
}

if (cropForm) {
    cropForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (cropIdInput.value === "") {
            await addCrop();
        } else {
            await updateCrop();
        }
    });
}

if (searchInput) {
    searchInput.addEventListener("input", searchCrops);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", searchCrops);
}

if (cropList) {
    cropList.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const cropId = button.dataset.id;
        if (!cropId) return;

        if (button.classList.contains("edit-button")) {
            startEditCrop(cropId);
        } else if (button.classList.contains("delete-button")) {
            await removeCrop(cropId);
        }
    });
}

// Tự động tải dữ liệu khi mở trang
loadCrops();

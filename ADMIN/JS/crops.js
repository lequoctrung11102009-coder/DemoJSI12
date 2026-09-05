// ======================================================
// CROPS.JS — Quản lý cây trồng (Phiên bản cơ bản)
// ======================================================

import {
    db, cropsCollection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp
} from "./firebase-config.js";

// ── 1. LẤY CÁC THẺ HTML (DOM ELEMENTS) ──────────────────
const cropDialog = document.getElementById("crop-dialog");
const newCropButton = document.getElementById("new-crop-button");
const dialogCloseButton = document.getElementById("crop-dialog-close");
const cropForm = document.getElementById("crop-form");
const cropIdInput = document.getElementById("crop-id");
const cropIdDisplay = document.getElementById("crop-id-display");
const nameViInput = document.getElementById("name-vi");
const nameEnInput = document.getElementById("name-en");
const categorySelect = document.getElementById("category");
const signatureCountriesInput = document.getElementById("signatureCountries");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const cropList = document.getElementById("crop-list");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("message");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const totalText = document.getElementById("total-text");

// Mảng này lưu lại toàn bộ dữ liệu từ Firebase để dùng cho chức năng Tìm kiếm/Lọc
let crops = [];

// ── 2. CÁC HÀM HỖ TRỢ GIAO DIỆN ─────────────────────────

// Mở hộp thoại
function openCropDialog() {
    if (cropDialog !== null && cropDialog.open === false) {
        cropDialog.showModal();
    }
}

// Đóng hộp thoại
function closeCropDialog() {
    if (cropDialog !== null && cropDialog.open === true) {
        cropDialog.close();
    }
}

// Hiển thị thông báo lỗi hoặc thành công trên Form
function showMessage(text, isError) {
    if (message === null) return;
    
    message.textContent = text;
    
    // Nếu là lỗi thì in chữ Đỏ, nếu thành công thì in chữ Xanh
    if (isError === true) {
        message.style.color = "#d93838"; // Màu đỏ
    } else {
        message.style.color = "#24734f"; // Màu xanh
    }
}

// Kiểm tra người dùng đã nhập đủ thông tin chưa
function validateForm() {
    let nameVi = nameViInput.value.trim();
    let nameEn = nameEnInput.value.trim();
    let categoryId = categorySelect.value;

    if (nameVi === "") {
        showMessage("Vui lòng nhập tên tiếng Việt.", true);
        return false;
    }
    if (nameEn === "") {
        showMessage("Vui lòng nhập tên tiếng Anh.", true);
        return false;
    }
    if (categoryId === "") {
        showMessage("Vui lòng chọn nhóm cây.", true);
        return false;
    }
    return true; // Hợp lệ
}

// Đổi mã ID nhóm cây thành Tên tiếng Việt để hiển thị ra bảng
function getCategoryName(categoryId) {
    if (categoryId === "staple_crops") return "Cây lương thực";
    if (categoryId === "industrial_crops") return "Cây công nghiệp";
    if (categoryId === "tropical_fruits") return "Cây ăn quả nhiệt đới";
    if (categoryId === "vegetables") return "Rau";
    if (categoryId === "herbs") return "Cây gia vị";
    if (categoryId === "timber_trees") return "Cây gỗ";
    return "Chưa phân loại";
}

// Biến văn bản thành HTML an toàn để tránh bị hack (lỗi XSS)
function escapeHtml(text) {
    if (text === null || text === undefined) {
        text = "";
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Xóa trắng Form sau khi thêm/sửa xong
function resetForm() {
    cropIdInput.value = "";
    cropIdDisplay.value = "";
    nameViInput.value = "";
    nameEnInput.value = "";
    categorySelect.value = "";
    signatureCountriesInput.value = "";
    formTitle.textContent = "Thêm cây trồng";
    saveButton.textContent = "Lưu cây trồng";
    showMessage("", false);
}

// Xử lý chuỗi các quốc gia (Ví dụ: "VN, Mỹ , Anh" -> ["VN", "Mỹ", "Anh"])
function processCountries(inputString) {
    let rawArray = inputString.split(",");
    let finalArray = [];
    
    for (let i = 0; i < rawArray.length; i++) {
        let country = rawArray[i].trim();
        if (country !== "") {
            finalArray.push(country);
        }
    }
    return finalArray;
}

// ── 3. CÁC HÀM XỬ LÝ DỮ LIỆU (CRUD) ──────────────────────

// ĐỌC: Lấy dữ liệu từ Firebase
async function loadCrops() {
    cropList.innerHTML = `<tr><td colspan="5" class="empty-cell">Đang tải dữ liệu...</td></tr>`;
    if (totalText !== null) totalText.textContent = "Đang tải danh sách cây trồng...";

    try {
        
      const snapshot = await getDocs(cropsCollection);
crops = [];


let listDocs = snapshot.docs;


for (let i = 0; i < listDocs.length; i++) {
    let docSnap = listDocs[i]; 
    
    let data = docSnap.data();  
    data.id = docSnap.id;      
    
    crops.push(data);
}
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        cropList.innerHTML = `<tr><td colspan="5" class="empty-cell">Không thể tải dữ liệu từ Firebase.</td></tr>`;
    }
}

// Hiển thị mảng dữ liệu ra bảng HTML
function displayCrops(cropArray) {
    cropList.innerHTML = ""; // Xóa trắng bảng cũ

    // Cập nhật các con số thống kê
    if (totalText !== null) {
        totalText.textContent = `Tổng số cây trồng: ${cropArray.length} / ${crops.length}`;
    }
    const cropStatCount = document.getElementById("crop-stat-count");
    if (cropStatCount !== null) cropStatCount.textContent = crops.length;

    // Nếu không có dữ liệu
    if (cropArray.length === 0) {
        cropList.innerHTML = `<tr><td colspan="5" class="empty-cell">Chưa có cây trồng nào.</td></tr>`;
        return;
    }

    // Tạo từng hàng (tr) cho bảng
    for (let i = 0; i < cropArray.length; i++) {
        let crop = cropArray[i];
        let row = document.createElement("tr");

        // Xử lý hiển thị quốc gia
        let countriesText = "Chưa có";
        if (Array.isArray(crop.signature_countries) && crop.signature_countries.length > 0) {
            countriesText = escapeHtml(crop.signature_countries.join(", "));
        } else if (typeof crop.signature_countries === "string" && crop.signature_countries.trim() !== "") {
            countriesText = escapeHtml(crop.signature_countries);
        }

        row.innerHTML = `
            <td><strong>${escapeHtml(crop.name_vi)}</strong></td>
            <td>${escapeHtml(crop.name_en)}</td>
            <td>${getCategoryName(crop.category_id)}</td>
            <td>${countriesText}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-button" data-id="${crop.id}">Sửa</button>
                    <button class="delete-button" data-id="${crop.id}">Xóa</button>
                </div>
            </td>
        `;
        cropList.appendChild(row);
    }
}

// THÊM MỚI: Đẩy dữ liệu lên Firebase
async function addCrop() {
    let isValid = validateForm();
    if (isValid === false) return; 
    let newCrop = {
        name_vi: nameViInput.value.trim(),
        name_en: nameEnInput.value.trim(),
        category_id: categorySelect.value,
        signature_countries: processCountries(signatureCountriesInput.value),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    };

    try {
        await addDoc(cropsCollection, newCrop);
        closeCropDialog();
        resetForm();
        await loadCrops(); // Tải lại bảng
    } catch (error) {
        console.error("Lỗi khi thêm:", error);
        showMessage("Không thể thêm cây trồng.", true);
    }
}

// CẬP NHẬT: Sửa dữ liệu đã có
async function updateCrop() {
    let isValid = validateForm();
    if (isValid === false) return;

    let cropId = cropIdInput.value;
    if (cropId === "") {
        showMessage("Không tìm thấy ID cây trồng.", true);
        return;
    }

    let cropDocRef = doc(db, "crops", cropId);
    let updatedData = {
        name_vi: nameViInput.value.trim(),
        name_en: nameEnInput.value.trim(),
        category_id: categorySelect.value,
        signature_countries: processCountries(signatureCountriesInput.value),
        updated_at: serverTimestamp()
    };

    try {
        await updateDoc(cropDocRef, updatedData);
        closeCropDialog();
        resetForm();
        await loadCrops(); // Tải lại bảng
    } catch (error) {
        console.error("Lỗi khi cập nhật:", error);
        showMessage("Không thể cập nhật cây trồng.", true);
    }
}

// XÓA: Xóa dữ liệu khỏi Firebase
async function removeCrop(cropId) {
    // Tìm tên cây trồng để hiện thông báo hỏi
    let cropName = "cây này";
    for (let i = 0; i < crops.length; i++) {
        if (crops[i].id === cropId) {
            cropName = crops[i].name_vi;
            break;
        }
    }

    let confirmDelete = confirm(`Bạn có chắc chắn muốn xóa "${cropName}" không?`);
    if (confirmDelete === false) return;

    try {
        await deleteDoc(doc(db, "crops", cropId));
        await loadCrops();
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Không thể xóa cây trồng.");
    }
}

// CHUẨN BỊ SỬA: Đổ dữ liệu cũ lên Form
function startEditCrop(cropId) {
    // Tìm cây trồng có ID tương ứng trong mảng
    let targetCrop = null;
    for (let i = 0; i < crops.length; i++) {
        if (crops[i].id === cropId) {
            targetCrop = crops[i];
            break;
        }
    }

    if (targetCrop === null) return;

    // Điền dữ liệu vào các ô input
    cropIdInput.value = targetCrop.id;
    cropIdDisplay.value = targetCrop.id;
    nameViInput.value = targetCrop.name_vi;
    nameEnInput.value = targetCrop.name_en;
    categorySelect.value = targetCrop.category_id;
    
    // Đổi mảng quốc gia thành chuỗi cách nhau bằng dấu phẩy
    if (Array.isArray(targetCrop.signature_countries)) {
        signatureCountriesInput.value = targetCrop.signature_countries.join(", ");
    } else {
        signatureCountriesInput.value = "";
    }

    formTitle.textContent = "Chỉnh sửa cây trồng";
    saveButton.textContent = "Lưu thay đổi";
    showMessage("", false);
    openCropDialog();
}

// TÌM KIẾM & LỌC
function searchCrops() {
    let keyword = searchInput.value.trim().toLowerCase();
    let selectedCategory = categoryFilter.value;
    
    let filteredArray = [];

    // Duyệt qua toàn bộ danh sách để tìm kết quả phù hợp
    for (let i = 0; i < crops.length; i++) {
        let crop = crops[i];
        
     
        let nameVi = crop.name_vi ? crop.name_vi.toLowerCase() : "";
        let nameEn = crop.name_en ? crop.name_en.toLowerCase() : "";
        
        let matchesKeyword = nameVi.includes(keyword) || nameEn.includes(keyword);
        
       
        let matchesCategory = (selectedCategory === "") || (crop.category_id === selectedCategory);
        
        if (matchesKeyword === true && matchesCategory === true) {
            filteredArray.push(crop);
        }
    }

    displayCrops(filteredArray); // Hiện kết quả lọc ra bảng
}

// ── 4. LẮNG NGHE SỰ KIỆN (EVENTS) ────────────────────────

if (newCropButton !== null) {
    newCropButton.addEventListener("click", function() {
        resetForm();
        openCropDialog();
    });
}

if (dialogCloseButton !== null) {
    dialogCloseButton.addEventListener("click", function() {
        closeCropDialog();
    });
}

if (cancelButton !== null) {
    cancelButton.addEventListener("click", function() {
        closeCropDialog();
    });
}

if (cropDialog !== null) {
    // Đóng khi click ra ngoài hộp thoại
    cropDialog.addEventListener("click", function(e) {
        if (e.target === cropDialog) {
            closeCropDialog();
        }
    });
}

if (cropForm !== null) {
    cropForm.addEventListener("submit", async function(e) {
        e.preventDefault(); // Ngăn không cho web bị load lại khi submit form
        
        // Nếu ô ID trống nghĩa là đang Thêm mới, nếu có chữ nghĩa là đang Sửa
        if (cropIdInput.value === "") {
            await addCrop();
        } else {
            await updateCrop();
        }
    });
}

if (searchInput !== null) {
    searchInput.addEventListener("input", function() {
        searchCrops();
    });
}

if (categoryFilter !== null) {
    categoryFilter.addEventListener("change", function() {
        searchCrops();
    });
}

// Xử lý sự kiện click cho các nút Sửa/Xóa trong bảng
if (cropList !== null) {
    cropList.addEventListener("click", async function(event) {
        let button = event.target.closest("button");
        if (button === null) return;

        let cropId = button.getAttribute("data-id");
        if (cropId === null) return;

        if (button.classList.contains("edit-button")) {
            startEditCrop(cropId);
        } 
        else if (button.classList.contains("delete-button")) {
            await removeCrop(cropId);
        }
    });
}

// Gọi hàm này ngay khi mở trang để tải dữ liệu
loadCrops();
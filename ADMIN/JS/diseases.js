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

// (Dialog)
function openDiseaseDialog() {
    if (diseaseDialog && diseaseDialog.open === false) {
        diseaseDialog.showModal();
    }
}

function closeDiseaseDialog() {
    if (diseaseDialog && diseaseDialog.open === true) {
        diseaseDialog.close();
    }
}

// ── Hiển thị thông báo lỗi / thành công ─────────────────
function showMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    if (isError === true) {
        message.style.color = "#d93838"; 
    } else {
        message.style.color = "#24734f"; 
    }
}

// ── Ngăn chặn lỗi hiển thị mã HTML bậy  ───────────────
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ── Dọn sạch Form  
function resetDiseaseForm() {
    currentEditId = null;
    if (diseaseIdInput) { 
        diseaseIdInput.value = ""; 
        diseaseIdInput.disabled = false; 
    }
    if (cropIdInput) cropIdInput.value = "";
    if (diseaseNameInput) diseaseNameInput.value = "";
    if (diseaseRiskSelect) diseaseRiskSelect.value = "";
    if (diseaseSolutionInput) diseaseSolutionInput.value = "";

    if (formTitle) formTitle.textContent = "Thêm sâu bệnh";
    if (saveButton) saveButton.textContent = "Lưu sâu bệnh";
    showMessage("");
}

// ── Tải danh sách cây trồng 
async function loadCropsMap() {
    try {
        const snapshot = await getDocs(cropsCollection);
        cropsMap = {}; 
        if (cropIdOptions) cropIdOptions.innerHTML = "";

       
        let listDocs = snapshot.docs;
        for (let i = 0; i < listDocs.length; i++) {
            let docSnap = listDocs[i];
            let data = docSnap.data();
            
            // Lấy tên cây 
            let cropName = "";
            if (data.name_vi) {
                cropName = data.name_vi;
            } else if (data.name_en) {
                cropName = data.name_en;
            } else {
                cropName = docSnap.id;
            }

            // Lưu vào kho cropsMap
            cropsMap[docSnap.id] = cropName;

            // Tạo thẻ <option> cho danh sách chọn
            if (cropIdOptions) {
                const opt = document.createElement("option");
                opt.value = docSnap.id;
                opt.label = cropName + " (" + docSnap.id + ")";
                cropIdOptions.appendChild(opt);
            }
        }
    } catch (err) {
        console.error("Lỗi tải cây trồng:", err);
    }
}

// Lấy danh sách sâu bệnh từ Firebase ─────────
async function loadDiseases() {
    if (diseaseTableBody) {
        diseaseTableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Đang tải dữ liệu...</td></tr>`;
    }

    await loadCropsMap(); 

    try {
        const snapshot = await getDocs(diseasesCollection);
        diseases = []; 
        let listDocs = snapshot.docs;
        for (let i = 0; i < listDocs.length; i++) {
            let docSnap = listDocs[i];
            let data = docSnap.data();
            data.id = docSnap.id; 
            diseases.push(data);  
        }

        displayDiseases(diseases);
    } catch (err) {
        console.error("Lỗi khi tải sâu bệnh:", err);
        if (diseaseTableBody) {
            diseaseTableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Lỗi tải dữ liệu.</td></tr>`;
        }
    }
}

// ── Vẽ dữ liệu ra bảng HTML ─────────────────────────────
function displayDiseases(danhSachHienThi) {
    if (!diseaseTableBody) return;
    diseaseTableBody.innerHTML = ""; 

    if (danhSachHienThi.length === 0) {
        diseaseTableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Chưa có dữ liệu.</td></tr>`;
        return;
    }

   
    let totalCount = danhSachHienThi.length;
    let highRiskCount = 0;
    let solutionCount = 0;

    for (let i = 0; i < danhSachHienThi.length; i++) {
        let benh = danhSachHienThi[i];
        
      
        if (benh.risk_level === "high" || benh.risk_level === "High") {
            highRiskCount = highRiskCount + 1;
        }
        
      
        if (benh.solution && benh.solution !== "") {
            solutionCount = solutionCount + 1;
        }
    }

    // Cập nhật các con số lên màn hình
    const totalTextEl = document.getElementById("disease-total-text");
    if (totalTextEl) totalTextEl.textContent = "Tổng số sâu bệnh: " + totalCount;

    for (let i = 0; i < danhSachHienThi.length; i++) {
        let disease = danhSachHienThi[i];
        let row = document.createElement("tr");

        let cropNameHTML = "";
        let foundCropName = cropsMap[disease.crop_id];
        
        if (foundCropName) {
          
            cropNameHTML = escapeHtml(foundCropName) + ` <small style="color:#888;">(${escapeHtml(disease.crop_id)})</small>`;
        } else {
         
            if (disease.crop_id) {
                cropNameHTML = escapeHtml(disease.crop_id);
            } else {
                cropNameHTML = "Không rõ";
            }
        }

       
        let riskBadge = `<span class="risk-badge risk-low">Thấp</span>`;
        if (disease.risk_level === "medium" || disease.risk_level === "Medium") {
            riskBadge = `<span class="risk-badge risk-medium">Trung bình</span>`;
        } else if (disease.risk_level === "high" || disease.risk_level === "High") {
            riskBadge = `<span class="risk-badge risk-high">Cao</span>`;
        }

      
        let maBenh = disease.disease_id || disease.id; // Không có mã tự đặt thì lấy mã Firebase
        let tenBenh = disease.name || "Chưa có tên";
        let giaiPhap = disease.solution || "Chưa có giải pháp";

        row.innerHTML = `
            <td><code>${escapeHtml(maBenh)}</code></td>
            <td>${cropNameHTML}</td>
            <td><strong>${escapeHtml(tenBenh)}</strong></td>
            <td>${riskBadge}</td>
            <td>${escapeHtml(giaiPhap)}</td>
            <td>
                <div class="action-buttons">
                    <button class="disease-edit-button"   data-id="${disease.id}">Sửa</button>
                    <button class="disease-delete-button" data-id="${disease.id}">Xóa</button>
                </div>
            </td>
        `;
        diseaseTableBody.appendChild(row);
    }
}

async function saveDisease(e) {
    e.preventDefault(); // Chặn trang web tự tải lại khi bấm Submit

    const diseaseId = diseaseIdInput.value.trim();
    const cropId    = cropIdInput.value.trim();
    const name      = diseaseNameInput.value.trim();
    const risk      = diseaseRiskSelect.value;
    const solution  = diseaseSolutionInput.value.trim();

    // Kiểm tra rỗng
    if (diseaseId === "" || cropId === "" || name === "" || risk === "" || solution === "") {
        showMessage("Vui lòng điền đầy đủ các thông tin bắt buộc (*).", true);
        return;
    }

    // Đóng gói dữ liệu chuẩn bị gửi đi
    const diseaseData = {
        disease_id: diseaseId,
        crop_id: cropId,
        name: name,
        risk_level: risk,
        solution: solution,
        updated_at: serverTimestamp()
    };

    try {
        if (currentEditId !== null) {
            // NẾU ĐANG SỬA
            const docRef = doc(db, "diseases", currentEditId);
            await updateDoc(docRef, diseaseData);
        } else {
            // NẾU LÀ THÊM MỚI
            diseaseData.created_at = serverTimestamp();
            await addDoc(diseasesCollection, diseaseData);
        }

        closeDiseaseDialog();
        resetDiseaseForm();
        await loadDiseases(); // Tải lại bảng
    } catch (err) {
        console.error("Lỗi lưu dữ liệu:", err);
        showMessage("Không thể lưu dữ liệu.", true);
    }
}

// ── 3. DELETE: Xóa dữ liệu ──────────────────────────────
async function removeDisease(docId) {
    // Tìm thủ công bằng vòng lặp for (thay cho hàm .find)
    let diseaseToDelete = null;
    for (let i = 0; i < diseases.length; i++) {
        if (diseases[i].id === docId) {
            diseaseToDelete = diseases[i];
            break; // Tìm thấy rồi thì dừng vòng lặp
        }
    }

    if (diseaseToDelete === null) return;

    let tenCanXoa = diseaseToDelete.name;
    if (!tenCanXoa) tenCanXoa = diseaseToDelete.disease_id;

    const confirmDelete = confirm('Bạn có chắc muốn xóa "' + tenCanXoa + '" không?');
    if (confirmDelete === true) {
        try {
            const docRef = doc(db, "diseases", docId);
            await deleteDoc(docRef);
            await loadDiseases(); // Tải lại bảng
        } catch (err) {
            console.error("Lỗi khi xóa:", err);
            alert("Không thể xóa bản ghi.");
        }
    }
}

// ── Chuẩn bị dữ liệu đưa lên Form để Sửa ────────────────
function startEditDisease(docId) {
  
    let diseaseToEdit = null;
    for (let i = 0; i < diseases.length; i++) {
        if (diseases[i].id === docId) {
            diseaseToEdit = diseases[i];
            break;
        }
    }

    if (diseaseToEdit === null) return;

    currentEditId = docId;
    
    // Đổ dữ liệu vào các ô input
    if (diseaseToEdit.disease_id) {
        diseaseIdInput.value = diseaseToEdit.disease_id;
    } else {
        diseaseIdInput.value = diseaseToEdit.id;
    }
    
    diseaseIdInput.disabled = true; // Không cho sửa mã
    
    if (diseaseToEdit.crop_id) cropIdInput.value = diseaseToEdit.crop_id;
    if (diseaseToEdit.name) diseaseNameInput.value = diseaseToEdit.name;
    if (diseaseToEdit.risk_level) diseaseRiskSelect.value = diseaseToEdit.risk_level;
    if (diseaseToEdit.solution) diseaseSolutionInput.value = diseaseToEdit.solution;

    if (formTitle) formTitle.textContent = "Chỉnh sửa sâu bệnh";
    if (saveButton) saveButton.textContent = "Lưu thay đổi";
    showMessage("");
    openDiseaseDialog();
}


function searchDiseases() {
    let tuKhoa = searchInput.value.toLowerCase().trim();
    let ketQuaTimKiem = []; // Tạo một giỏ rỗng chứa kết quả

    
    for (let i = 0; i < diseases.length; i++) {
        let benh = diseases[i];
        
        let ten = "";
        if (benh.name) ten = benh.name.toLowerCase();
        
        let ma = "";
        if (benh.disease_id) ma = benh.disease_id.toLowerCase();
        else if (benh.id) ma = benh.id.toLowerCase();
        
        let maCay = "";
        if (benh.crop_id) maCay = benh.crop_id.toLowerCase();
        
        let tenCay = "";
        if (cropsMap[benh.crop_id]) tenCay = cropsMap[benh.crop_id].toLowerCase();

        // Kiểm tra xem từ khóa có nằm trong bất kỳ ô nào không
        if (ten.includes(tuKhoa) || ma.includes(tuKhoa) || maCay.includes(tuKhoa) || tenCay.includes(tuKhoa)) {
            ketQuaTimKiem.push(benh); // Nếu có thì nhặt bỏ vào giỏ kết quả
        }
    }

    displayDiseases(ketQuaTimKiem); 
}

// SỰ KIỆN KHI BẤM NÚT
if (newDiseaseButton) {
    newDiseaseButton.addEventListener("click", function() {
        resetDiseaseForm();
        openDiseaseDialog();
    });
}

if (dialogCloseButton) {
    dialogCloseButton.addEventListener("click", function() {
        closeDiseaseDialog();
    });
}

if (cancelButton) {
    cancelButton.addEventListener("click", function() {
        closeDiseaseDialog();
    });
}

if (diseaseDialog) {
    diseaseDialog.addEventListener("click", function(e) {
        if (e.target === diseaseDialog) {
            closeDiseaseDialog();
        }
    });
}

if (diseaseForm) {
    diseaseForm.addEventListener("submit", saveDisease);
}

if (searchInput) {
    searchInput.addEventListener("input", searchDiseases);
}

// Lắng nghe nút Sửa / Xóa trong bảng
if (diseaseTableBody) {
    diseaseTableBody.addEventListener("click", async function(e) {
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

// Tự động chạy tải dữ liệu khi mở trang
loadDiseases();
// ======================================================
// APP.JS — Entry point: khởi động toàn bộ ứng dụng
// ======================================================

import { renderRoute, initSidebar } from "./ui.js";
import { initCrops, loadCrops }     from "./crops.js";
import { initDiseases, loadDiseases } from "./diseases.js";

// Khởi tạo routing & sidebar
initSidebar();

// Khởi tạo các module CRUD
initCrops();
initDiseases();

// Render route dựa theo URL hash hiện tại
renderRoute();

// Tải dữ liệu ban đầu
loadCrops();
loadDiseases();

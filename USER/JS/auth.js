import { auth, db } from "./firebaseConfig.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// khai báo phần tử từ HTML

const emailInput = document.getElementById("txt-email");
const passwordInput = document.getElementById("txt-password");

const btnRegister = document.getElementById("btn-register");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");

const userInfo = document.getElementById("user-info");

onAuthStateChanged(auth, (user) => {
  if (!userInfo) return;

  if (user) {
    userInfo.innerHTML = `Xin chào ${user.email}`;

    if (btnLogin) btnLogin.style.display = "none";
    if (btnRegister) btnRegister.style.display = "none";
    if (btnLogout) btnLogout.style.display = "block";

    if (emailInput) emailInput.style.display = "none";
    if (passwordInput) passwordInput.style.display = "none";
  } else {
    userInfo.innerHTML = "Trạng thái: Chưa đăng nhập";

    if (btnLogin) btnLogin.style.display = "block";
    if (btnRegister) btnRegister.style.display = "block";
    if (btnLogout) btnLogout.style.display = "none";

    if (emailInput) emailInput.style.display = "block";
    if (passwordInput) passwordInput.style.display = "block";
  }
});

if (btnRegister) {

    btnRegister.addEventListener("click", async () => {

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ email và mật khẩu");
            return;
        }

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            // Tạo hồ sơ user trong Firestore
            await setDoc(
                doc(db, "users", user.uid),
                {
                    email: user.email,
                    role: "user"
                }
            );


            alert("Đăng ký thành công!");

            window.location.href =
                "../HTML/Web_App.html";

        }

        catch (error) {

            console.error(error);

            alert(error.message);
        }

    });

}
if (btnLogin) {

    btnLogin.addEventListener("click", async () => {

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ email và mật khẩu");
            return;
        }

        try {

            // Đăng nhập Firebase Authentication
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            console.log("Đăng nhập:", user.email);
            console.log("UID:", user.uid);


            // ==========================================
            // LẤY ROLE TỪ FIRESTORE
            // ==========================================

            const userDocument = doc(
                db,
                "user",
                user.uid
            );

            const userSnapshot =
                await getDoc(userDocument);


            // Không tìm thấy document users
            if (!userSnapshot.exists()) {

                alert(
                    "Tài khoản chưa được phân quyền."
                );

                await signOut(auth);

                return;
            }


            // Lấy dữ liệu
            const userData =
                userSnapshot.data();

            const role =
                userData.roles;


            // ==========================================
            // PHÂN QUYỀN
            // ==========================================

            if (role === "admin") {

                alert(
                    "Đăng nhập Admin thành công!"
                );

                window.location.href =
                    "../../ADMIN/HTML/index.html";

            }

            else if (role === "user") {

                alert(
                    "Đăng nhập thành công!"
                );

                window.location.href =
                    "../../HTML/Web_App.html";

            }

            else {

                alert(
                    "Role không hợp lệ."
                );

                await signOut(auth);
            }

        }

        catch (error) {

            console.error(
                "Lỗi đăng nhập:",
                error
            );

            alert(
                "Đăng nhập thất bại: " +
                error.message
            );
        }

    });

}

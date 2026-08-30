import { app, db } from "./firebaseConfig.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
const btn = document.getElementById('btn');
const asiaSelect = document.getElementById('asiaSelect');
const cityInput = document.getElementById('cityName');

function clearHTML(){
    document.getElementById('localTime').innerHTML = "...";
    document.getElementById('Name').innerHTML =  "...";
    document.getElementById('temp').innerHTML =  "...";
    document.getElementById('Feelike').innerHTML =  "...";
    document.getElementById('Humidity').innerHTML = "...";
    document.getElementById('speed').innerHTML =  "...";
    
}

async function getData() {
    let Cityname = document.getElementById('cityName').value.trim();

        clearHTML();

    if (Cityname === "") {
        alert("Vui lòng nhập quốc gia");
        return;
    }

    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${Cityname}&appid=acbbb00bb24f1c508676fa87dda224de&units=metric`
    );

    const data = await response.json();

    if (!response.ok || data.cod == 404) {
        document.getElementById('Name').innerHTML = `Không tìm thấy quốc gia: ${Cityname}`;
        document.getElementById('temp').innerHTML = `---°C`;
        document.getElementById('Feelike').innerHTML = `Feels like ---°C`;
        document.getElementById('Humidity').innerHTML = `Humidity: ---%`;
        document.getElementById('speed').innerHTML = `Wind: --- km/h`;
        return;
    }

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityOffset = data.timezone * 1000;
    const localCityTime = new Date(utcTime + cityOffset);

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayString = days[localCityTime.getDay()];

    const hours = localCityTime.getHours().toString().padStart(2, '0');
    const minutes = localCityTime.getMinutes().toString().padStart(2, '0');

    document.getElementById('localTime').innerHTML = `${dayString} ${hours}:${minutes}`;
    document.getElementById('Name').innerHTML = data.name;
    document.getElementById('temp').innerHTML = `${data.main.temp}°C`;
    document.getElementById('Feelike').innerHTML = `Feels like ${data.main.feels_like}°C`;
    document.getElementById('Humidity').innerHTML = `Humidity: ${data.main.humidity}%`;
    document.getElementById('speed').innerHTML = `Wind: ${data.wind.speed} km/h`;

    const ifoResponse = await fetch(
        `https://api.restcountries.com/countries/v5?q=${Cityname}&api-key=rc_live_802c161921a84fd4a37d4317848b653e`
    );

    const ifoData = await ifoResponse.json();

    if (!ifoResponse.ok || !ifoData.data || !ifoData.data.objects || ifoData.data.objects.length == 0) {
        document.getElementById('cName').innerHTML = `Không tìm thấy quốc gia: ${Cityname}`;
        document.getElementById('cFlag').innerHTML = `---`;
        document.getElementById('cCapital').innerHTML = `---`;
        document.getElementById('cPopulation').innerHTML = `---`;
        document.getElementById('cCurrency').innerHTML = `---`;
        return;
    }

    const country = ifoData.data.objects[0];

    document.getElementById('cName').innerHTML = country.names.common;
    document.getElementById('cFlag').innerHTML = `<img src="${country.flag.url_png}" alt="flag">`;
    document.getElementById('cCapital').innerHTML = country.capitals[0].name;
    document.getElementById('cPopulation').innerHTML = country.population.toLocaleString('vi-VN');
    document.getElementById('cCurrency').innerHTML = `${country.currencies[0].code} (${country.currencies[0].symbol})`;

    const assmentData = document.getElementById('assessment');
    const promotionData = document.getElementById('promotion');
    const plantData = document.getElementById('plant');
    const wormData = document.getElementById('worm');
   //  FIREBASE 

// Chuẩn hóa tên quốc gia
const countryName =
    Cityname.charAt(0).toUpperCase() +
    Cityname.slice(1).toLowerCase();

// ĐÁNH GIÁ
const temp = data.main.temp;
const humidity = data.main.humidity;

let html = "";

if (temp > 32) {
    html += "🔴 Nhiệt độ quá cao<br>";
} else {
    html += "🟢 Nhiệt độ phù hợp<br>";
}

if (humidity < 60) {
    html += "🔴 Độ ẩm thấp<br>";
} else {
    html += "🟢 Độ ẩm tốt<br>";
}

assmentData.innerHTML = html;


//  CÂY TRỒNG 
plantData.innerHTML = "<h3>🌱 CÂY ĐẶC CHỦNG</h3>";

const cropQuery = query(
    collection(db, "crops"),
   where("signature_countries", "array-contains", countryName)
);

const cropSnap = await getDocs(cropQuery);

let firstCrop = "";

if (cropSnap.empty) {

    plantData.innerHTML += "<p>Không có dữ liệu.</p>";

} else {

    cropSnap.forEach(doc => {

        const crop = doc.data();

        console.log(crop);

        if (firstCrop === "") {
            firstCrop = crop.name_en;   // hoặc crop.id
        }

        plantData.innerHTML += `
            <p>🌱 ${crop.name_vi}</p>
            <hr>
        `;

    });

}

// =======================
// SÂU BỆNH
// =======================

wormData.innerHTML = "";

if (!firstCrop) {

    wormData.innerHTML = "<p>Không có dữ liệu sâu bệnh.</p>";

} else {

    console.log("countryName =", countryName);
    console.log("firstCrop =", firstCrop);

    // Đổi tên cây -> id trong Firestore
    const cropId = firstCrop
        .toLowerCase()
        .replace(/\s+/g, "_");

    console.log("cropId =", cropId);

  const diseaseQuery = query(
    collection(db, "diseases"),
    where("countries", "array-contains", countryName)
);

const diseaseSnap = await getDocs(diseaseQuery);
console.log(cropId);

    console.log("Disease:", diseaseSnap.size);

    if (diseaseSnap.empty) {

        wormData.innerHTML = "<p>Không có dữ liệu sâu bệnh.</p>";

    } else {

        diseaseSnap.forEach((doc) => {

            const d = doc.data();

            wormData.innerHTML += `
                <p>🦠 ${d.disease}</p>
                <p>⚠ ${d.risk}</p>
                <p>✔ ${d.solution}</p>
                <hr>
            `;

        });

    }

}


// =======================
// KHUYẾN NGHỊ
// =======================

promotionData.innerHTML = "";

const recQuery = query(
    collection(db, "recommendations"),
    where("country", "==", countryName)
);

const recSnap = await getDocs(recQuery);

console.log("Recommendation:", recSnap.size);

if (recSnap.empty) {

    promotionData.innerHTML = "<p>Không có dữ liệu khuyến nghị.</p>";

} else {

    recSnap.forEach((doc) => {

        const r = doc.data();

        promotionData.innerHTML += `
            <p>✔ ${r.content}</p>
        `;

    });

}
}




btn.addEventListener('click', getData);

// Khi chọn quốc gia từ dropdown Châu Á: điền vào ô input và tìm kiếm luôn
asiaSelect.addEventListener('change', () => {
    if (asiaSelect.value === "") return;
    cityInput.value = asiaSelect.value;
    getData();
});

// Khi người dùng tự gõ tay, đưa dropdown về trạng thái mặc định
cityInput.addEventListener('input', () => {
    asiaSelect.value = "";
});

getData();
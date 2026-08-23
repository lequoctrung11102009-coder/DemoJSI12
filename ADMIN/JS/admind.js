import { db } from "./firebaseConfig.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const cropTable = document.getElementById("cropTable");

const cropCount = document.getElementById("cropCount");

const modal = document.getElementById("cropModal");

const addBtn = document.getElementById("addCrop");

const saveBtn = document.getElementById("saveCrop");

let editID = null;
addBtn.onclick = () => {

    editID = null;

    modal.style.display = "flex";

};
window.onclick = (e)=>{

    if(e.target==modal){

        modal.style.display="none";

    }

}
async function loadCrop(){

    cropTable.innerHTML="";

    const query = await getDocs(collection(db,"crops"));

    cropCount.innerHTML=query.size;

    query.forEach((document)=>{

        const data=document.data();

        cropTable.innerHTML +=`

        <tr>

            <td>${data.country}</td>

            <td>${data.crop}</td>

            <td>${data.soil}</td>

            <td>${data.water}</td>

            <td>${data.sunlight}</td>

            <td>${data.harvest}</td>

            <td>

                <button
                class="edit"
                onclick="editCrop('${document.id}')">

                Edit

                </button>

                <button
                class="delete"
                onclick="deleteCrop('${document.id}')">

                Delete

                </button>

            </td>

        </tr>

        `;

    });

}saveBtn.onclick = async()=>{

    const country=document.getElementById("country").value;

    const crop=document.getElementById("crop").value;

    const soil=document.getElementById("soil").value;

    const water=document.getElementById("water").value;

    const sunlight=document.getElementById("sunlight").value;

    const harvest=document.getElementById("harvest").value;

    if(editID==null){

        await addDoc(collection(db,"crops"),{

            country,

            crop,

            soil,

            water,

            sunlight,

            harvest

        });

    }

    else{

        await updateDoc(doc(db,"crops",editID),{

            country,

            crop,

            soil,

            water,

            sunlight,

            harvest

        });

    }

    modal.style.display="none";

    loadCrop();

} 
window.deleteCrop = async(id)=>{

    if(confirm("Delete this crop?")){

        await deleteDoc(doc(db,"crops",id));

        loadCrop();

    }

}
window.editCrop = async(id)=>{

    const query=await getDocs(collection(db,"crops"));

    query.forEach((document)=>{

        if(document.id==id){

            const d=document.data();

            document.getElementById("country").value=d.country;

            document.getElementById("crop").value=d.crop;

            document.getElementById("soil").value=d.soil;

            document.getElementById("water").value=d.water;

            document.getElementById("sunlight").value=d.sunlight;

            document.getElementById("harvest").value=d.harvest;

        }

    });

    editID=id;

    modal.style.display="flex";

}
loadCrop();
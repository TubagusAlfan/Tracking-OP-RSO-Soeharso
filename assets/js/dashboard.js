// dashboard.js - logic untuk halaman dashboard Tracking Ortotik Prostetik
// Menggunakan Firebase v9 modular

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Ambil konfigurasi terpusat dari window (di-set oleh config-firebase.js)
const firebaseConfig =
  typeof window !== "undefined" && window.firebaseConfig
    ? window.firebaseConfig
    : null;
if (!firebaseConfig) {
  console.error(
    "firebaseConfig tidak ditemukan. Pastikan config-firebase.js dimuat sebelum dashboard.js"
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Proteksi halaman: redirect ke login bila belum login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

let patients = [];
let selectedPatientIndex = -1;
const patientsCol = collection(db, "patients");

onSnapshot(patientsCol, (snapshot) => {
  patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  updateTable();

  if (selectedPatientIndex >= 0 && patients.length > 0) {
    const currentSelectedId = patients[selectedPatientIndex].id;
    const foundIndex = patients.findIndex((p) => p.id === currentSelectedId);
    selectedPatientIndex = foundIndex === -1 ? -1 : foundIndex;
  } else {
    selectedPatientIndex = -1;
  }
  updateTahapanTable();
});

function updateTable() {
  const tbody = document.getElementById("patient-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  patients.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.className = `cursor-pointer hover:bg-blue-100 ${
      i === selectedPatientIndex ? "bg-blue-200" : ""
    }`;
    tr.onclick = () => selectPatient(i);
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.reg}</td>
      <td>${p.name}</td>
      <td>${p.status || "-"}</td>`;
    tbody.appendChild(tr);
  });
}

function updateTahapanTable() {
  const tahapanBody = document.getElementById("tahapan-body");
  const generateLinkBtn = document.getElementById("generate-link-btn");
  if (!tahapanBody || !generateLinkBtn) return;
  tahapanBody.innerHTML = "";

  if (selectedPatientIndex >= 0) {
    const patient = patients[selectedPatientIndex];
    const examEl = document.getElementById("exam");
    if (examEl) examEl.innerText = patient.exam;

    if (patient.tahapan.length > 0) {
      generateLinkBtn.classList.remove("hidden");
    } else {
      generateLinkBtn.classList.add("hidden");
    }

    patient.tahapan.forEach((t, i) => {
      const row = tahapanBody.insertRow();
      row.innerHTML = `
        <td>${i + 1}</td>
        <td><input type="date" value="${
          t.tanggal
        }" class="w-full border px-2 py-1"></td>
        <td><textarea placeholder="Keterangan Tahapan" class="w-full border px-2 py-1">${
          t.keterangan
        }</textarea></td>
        <td>
          <select class="w-full border px-2 py-1">
            <option ${
              t.tahapan === "Assestment" ? "selected" : ""
            }>Assestment</option>
            <option ${
              t.tahapan === "Pengukuran" ? "selected" : ""
            }>Pengukuran</option>
            <option ${
              t.tahapan === "Negatif Gips" ? "selected" : ""
            }>Negatif Gips</option>
            <option ${
              t.tahapan === "Positif Gips" ? "selected" : ""
            }>Positif Gips</option>
            <option ${
              t.tahapan === "Pembungkusan" ? "selected" : ""
            }>Pembungkusan</option>
            <option ${
              t.tahapan === "Penyusunan" ? "selected" : ""
            }>Penyusunan</option>
            <option ${
              t.tahapan === "Percobaan" ? "selected" : ""
            }>Percobaan</option>
            <option ${
              t.tahapan === "Perbaikan" ? "selected" : ""
            }>Perbaikan</option>
            <option ${
              t.tahapan === "Selesai" ? "selected" : ""
            }>Selesai</option>
          </select>
        </td>
        <td><button onclick="deleteRow(this)" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Hapus</button></td>`;
    });
  } else {
    const examEl = document.getElementById("exam");
    if (examEl) examEl.innerText = "";
    generateLinkBtn.classList.add("hidden");
  }
}

function selectPatient(index) {
  selectedPatientIndex = index;
  updateTable();
  updateTahapanTable();
}

function showForm() {
  document.getElementById("form-popup")?.classList.remove("hidden");
}
function hideForm() {
  document.getElementById("form-popup")?.classList.add("hidden");
  const ids = ["regInput", "nameInput", "examInput"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function generateRandomToken() {
  return Math.random().toString(36).substr(2, 11);
}

async function addPatient() {
  const reg = document.getElementById("regInput")?.value || "";
  const name = document.getElementById("nameInput")?.value || "";
  const exam = document.getElementById("examInput")?.value || "";

  if (!reg || !name || !exam) {
    alert("Semua data harus diisi!");
    return;
  }

  const newPatientData = {
    reg,
    name,
    exam,
    status: "-",
    tahapan: [],
    token: generateRandomToken(),
  };

  try {
    await setDoc(doc(db, "patients", reg), newPatientData);
    hideForm();
  } catch (e) {
    console.error("Error adding document:", e);
    alert("Gagal menambahkan pasien. Silakan coba lagi.");
  }
}

function addRow() {
  if (selectedPatientIndex === -1) {
    alert("Pilih pasien terlebih dahulu!");
    return;
  }
  const patient = patients[selectedPatientIndex];
  patient.tahapan.push({ tanggal: "", keterangan: "", tahapan: "Assestment" });
  updateTahapanTable();
}

function deleteRow(btn) {
  const row = btn.parentNode.parentNode; // tr
  const rowIndex = row.rowIndex - 1; // minus header
  patients[selectedPatientIndex].tahapan.splice(rowIndex, 1);
  updateTahapanTable();
}

async function updateProgressStatus() {
  if (selectedPatientIndex === -1) {
    alert("Pilih pasien terlebih dahulu!");
    return;
  }
  const patientId = patients[selectedPatientIndex].id;
  const tahapanBody = document.getElementById("tahapan-body");
  const rows = tahapanBody?.querySelectorAll("tr") || [];

  const newTahapan = Array.from(rows).map((row) => ({
    tanggal: row.querySelector('input[type="date"]')?.value || "",
    keterangan: row.querySelector("textarea")?.value || "",
    tahapan: row.querySelector("select")?.value || "Assestment",
  }));

  const lastStage =
    newTahapan.length > 0 ? newTahapan[newTahapan.length - 1].tahapan : "-";
  try {
    await updateDoc(doc(db, "patients", patientId), {
      tahapan: newTahapan,
      status: lastStage,
    });
  } catch (e) {
    console.error("Error updating document:", e);
    alert("Gagal memperbarui progres. Silakan coba lagi.");
  }
}

function generateLink() {
  if (selectedPatientIndex === -1) {
    alert("Pilih pasien terlebih dahulu!");
    return;
  }
  const patient = patients[selectedPatientIndex];
  if (!patient.token) {
    alert(
      "Token belum tersedia untuk pasien ini. Simpan data pasien terlebih dahulu."
    );
    return;
  }
  const trackingUrl = `https://ortojejak.netlify.app/tracking.html?token=${patient.token}`;;
  prompt("Salin tautan ini untuk dibagikan ke pasien:", trackingUrl);
}

// Ekspos ke global untuk dipakai di atribut HTML onclick
window.selectPatient = selectPatient;
window.showForm = showForm;
window.hideForm = hideForm;
window.addPatient = addPatient;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.updateProgressStatus = updateProgressStatus;
window.generateLink = generateLink;

// Logout handler
const logoutEl = document.getElementById("logoutLink");
if (logoutEl) {
  logoutEl.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      try {
        sessionStorage.setItem("justLoggedOut", "1");
      } catch (_) {}
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      window.location.href = "index.html";
    }
  });
}


// config-firebase.js
// Pusat konfigurasi Firebase. Digunakan oleh halaman login/register (compat)
// dan dashboard (modular) dengan mengambil window.firebaseConfig.

const firebaseConfig = {
  apiKey: "AIzaSyAr7FkTrOKHdvBzhv7FAQ9a39zTzfQwFrk",
  authDomain: "track-op-rso.firebaseapp.com",
  databaseURL:
    "https://track-op-rso-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "track-op-rso",
  storageBucket: "track-op-rso.firebasestorage.app",
  messagingSenderId: "617234721043",
  appId: "1:617234721043:web:7b36b3d90e6fad4d87d2e6",
};

// Ekspos ke global agar bisa diakses modul ES (dashboard.js)
try {
  window.firebaseConfig = firebaseConfig;
} catch (_) {}

// Inisialisasi hanya jika environment memuat compat SDK & belum diinisialisasi
if (typeof firebase !== "undefined") {
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';

// Импорты для @angular/fire
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
// Если ты хочешь использовать Analytics, тоже импортируй и добавь провайдер:
// import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';


// Твой firebaseConfig из консоли Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD_Tln40K9dFiKJiH4nMWzbjr_AgZ9LsP4", // <-- ***ЗАМЕНИ ЭТО НА СВОЙ НАСТОЯЩИЙ API KEY***
  authDomain: "routeguide-99882.firebaseapp.com",
  projectId: "routeguide-99882",
  storageBucket: "routeguide-99882.firebasestorage.app",
  messagingSenderId: "266514774821",
  appId: "1:266514774821:web:0b20be82a2e27e728438cc",
  measurementId: "G-K89G0Q59M4" // Оставь, если используешь Analytics
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(), // Оставляем HttpClient для внешних API (Nominatim, OSRM)

    // Провайдеры Firebase для @angular/fire
    provideFirebaseApp(() => initializeApp(firebaseConfig)), // Инициализация основного App
    provideFirestore(() => getFirestore()), // Инициализация Firestore
    provideAuth(() => getAuth()), // Инициализация Auth

    // Если используешь Analytics, добавь провайдер:
    // provideAnalytics(() => getAnalytics()),
  ]
};
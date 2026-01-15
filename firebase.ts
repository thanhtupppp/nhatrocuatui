
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * 🛠️ FIXING "PERMISSION DENIED" ERRORS:
 * 
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project "nhatrocuatui-4c805"
 * 3. Click on "Firestore Database" in the left menu.
 * 4. Click the "Rules" tab at the top.
 * 5. Paste the following rules and click "Publish":
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /{document=**} {
 *       allow read, write: if true;
 *     }
 *   }
 * }
 */

const firebaseConfig = {
  apiKey: "AIzaSyBd-8BkZa71jpu1Wp-E6k0lGdrAy5ejp3s",
  authDomain: "nhatrocuatui-4c805.firebaseapp.com",
  projectId: "nhatrocuatui-4c805",
  storageBucket: "nhatrocuatui-4c805.firebasestorage.app",
  messagingSenderId: "276525248644",
  appId: "1:276525248644:web:577b7abf30ef714f9552d1",
  measurementId: "G-KC6LEHCLSP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

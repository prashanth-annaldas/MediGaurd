/**
 * Firebase configuration
 * Uses Firebase Auth for user management and Firestore for data.
 */
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics"
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signOut
} from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyCdIgLxeZ3SUp4s6n0S0l2MbLO3oJBOuyQ",
    authDomain: "medigaurd1.firebaseapp.com",
    projectId: "medigaurd1",
    storageBucket: "medigaurd1.firebasestorage.app",
    messagingSenderId: "620488156651",
    appId: "1:620488156651:web:de5c96e3bbcd704deee5ae",
    measurementId: "G-QWZ9L3MKBZ"
};

let app = null
let db = null
let auth = null
let analytics = null
const googleProvider = new GoogleAuthProvider()

export function initFirebase() {
    try {
        if (firebaseConfig.apiKey && firebaseConfig.projectId) {
            app = initializeApp(firebaseConfig)
            db = getFirestore(app)
            auth = getAuth(app)
            analytics = getAnalytics(app)
            console.log('✅ Firebase initialized (medigaurd1)')
        } else {
            console.log('ℹ️  Firebase not configured — running in local mode')
        }
    } catch (err) {
        console.warn('Firebase init failed:', err)
    }
}

export function getDb() {
    return db
}

export function getFirebaseAuth() {
    return auth
}

// Ensure Auth works smoothly
export {
    app, db, auth,
    googleProvider, signInWithPopup,
    signInWithEmailAndPassword, createUserWithEmailAndPassword,
    RecaptchaVerifier, signInWithPhoneNumber, signOut
}

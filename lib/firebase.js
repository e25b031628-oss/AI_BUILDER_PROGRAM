import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyDnjA06yrOyeLbN7OwyEGe5c45H2ncwUBs',
	authDomain: 'smart-cart-1c4fd.firebaseapp.com',
	projectId: 'smart-cart-1c4fd',
	storageBucket: 'smart-cart-1c4fd.firebasestorage.app',
	messagingSenderId: '503092050396',
	appId: '1:503092050396:web:8b32f131cca370f183b719',
	measurementId: 'G-M1MSE3E3RG',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

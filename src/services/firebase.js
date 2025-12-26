/**
 * Firebase Service
 * Handles authentication, Firestore database, and storage
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL 
} from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration (public keys - safe for client-side)
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxx", // Replace with actual key
  authDomain: "spothitch.firebaseapp.com",
  projectId: "spothitch",
  storageBucket: "spothitch.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxx"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let messaging;

export function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Initialize messaging only in supported browsers
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      messaging = getMessaging(app);
    }
    
    console.log('✅ Firebase initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
}

// ==================== AUTHENTICATION ====================

/**
 * Sign up with email and password
 */
export async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

/**
 * Sign out
 */
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth?.currentUser;
}

// ==================== FIRESTORE - SPOTS ====================

/**
 * Get all spots
 */
export async function getSpots() {
  try {
    const spotsRef = collection(db, 'spots');
    const q = query(spotsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching spots:', error);
    return [];
  }
}

/**
 * Add a new spot
 */
export async function addSpot(spotData) {
  try {
    const user = getCurrentUser();
    const spotsRef = collection(db, 'spots');
    const docRef = await addDoc(spotsRef, {
      ...spotData,
      creatorId: user?.uid || 'anonymous',
      creatorName: user?.displayName || 'Anonyme',
      createdAt: serverTimestamp(),
      totalReviews: 0,
      checkins: 0,
      verified: false
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding spot:', error);
    return { success: false, error };
  }
}

/**
 * Update a spot
 */
export async function updateSpot(spotId, updates) {
  try {
    const spotRef = doc(db, 'spots', spotId);
    await updateDoc(spotRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating spot:', error);
    return { success: false, error };
  }
}

/**
 * Add a review to a spot
 */
export async function addReview(spotId, reviewData) {
  try {
    const user = getCurrentUser();
    const reviewsRef = collection(db, 'spots', spotId, 'reviews');
    await addDoc(reviewsRef, {
      ...reviewData,
      userId: user?.uid || 'anonymous',
      userName: user?.displayName || 'Anonyme',
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding review:', error);
    return { success: false, error };
  }
}

/**
 * Get reviews for a spot
 */
export async function getReviews(spotId) {
  try {
    const reviewsRef = collection(db, 'spots', spotId, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

// ==================== FIRESTORE - CHAT ====================

/**
 * Subscribe to chat messages
 */
export function subscribeToChatRoom(room, callback) {
  const messagesRef = collection(db, 'chat', room, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages.reverse());
  });
}

/**
 * Send a chat message
 */
export async function sendChatMessage(room, text) {
  try {
    const user = getCurrentUser();
    const messagesRef = collection(db, 'chat', room, 'messages');
    await addDoc(messagesRef, {
      text,
      userId: user?.uid || 'anonymous',
      userName: user?.displayName || 'Anonyme',
      userAvatar: '🤙',
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
}

// ==================== STORAGE ====================

/**
 * Upload image to Firebase Storage
 */
export async function uploadImage(base64Data, path) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error };
  }
}

// ==================== PUSH NOTIFICATIONS ====================

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission() {
  try {
    if (!messaging) {
      console.log('Messaging not supported');
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }
    
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY' // Replace with actual VAPID key
    });
    
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

// Export instances for advanced usage
export { app, auth, db, storage, messaging };

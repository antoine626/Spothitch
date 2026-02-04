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
  getDocs,
  query,
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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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

// ==================== ENHANCED SPOT OPERATIONS ====================

/**
 * Load all spots from Firebase
 */
export async function loadSpotsFromFirebase() {
  try {
    const spotsRef = collection(db, 'spots');
    const q = query(spotsRef, orderBy('createdAt', 'desc'), limit(200));
    const snapshot = await getDocs(q);
    return {
      success: true,
      spots: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    };
  } catch (error) {
    console.error('Error loading spots from Firebase:', error);
    return { success: false, error, spots: [] };
  }
}

/**
 * Save a spot to Firebase
 * @param {Object} spot - Spot data
 */
export async function saveSpotToFirebase(spot) {
  try {
    const user = getCurrentUser();
    const spotsRef = collection(db, 'spots');

    const spotData = {
      ...spot,
      creatorId: user?.uid || 'anonymous',
      creatorName: user?.displayName || 'Anonyme',
      creatorAvatar: user?.photoURL || '🤙',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalReviews: 0,
      checkins: 0,
      verified: false,
      reports: 0,
    };

    const docRef = await addDoc(spotsRef, spotData);
    return { success: true, id: docRef.id, spot: { ...spotData, id: docRef.id } };
  } catch (error) {
    console.error('Error saving spot:', error);
    return { success: false, error };
  }
}

/**
 * Upload a photo to Firebase Storage
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} spotId - Spot ID for the photo path
 */
export async function uploadPhotoToFirebase(dataUrl, spotId) {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const path = `spots/${spotId}/${user?.uid || 'anon'}_${timestamp}.jpg`;

    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL, path };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error };
  }
}

/**
 * Save a validation (check-in) to Firebase
 * @param {string} spotId - Spot ID
 * @param {string} userId - User ID
 */
export async function saveValidationToFirebase(spotId, userId) {
  try {
    const user = getCurrentUser();
    const validationsRef = collection(db, 'spots', spotId, 'validations');

    await addDoc(validationsRef, {
      userId: user?.uid || userId || 'anonymous',
      userName: user?.displayName || 'Anonyme',
      validatedAt: serverTimestamp(),
    });

    // Increment spot checkins
    const spotRef = doc(db, 'spots', spotId);
    const { increment } = await import('firebase/firestore');
    await updateDoc(spotRef, {
      checkins: increment(1),
      lastUsed: new Date().toISOString().split('T')[0],
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving validation:', error);
    return { success: false, error };
  }
}

/**
 * Save a comment to Firebase
 * @param {Object} comment - Comment data {spotId, text, rating}
 */
export async function saveCommentToFirebase(comment) {
  try {
    const user = getCurrentUser();
    const commentsRef = collection(db, 'spots', comment.spotId, 'comments');

    const commentData = {
      text: comment.text,
      rating: comment.rating || null,
      userId: user?.uid || 'anonymous',
      userName: user?.displayName || 'Anonyme',
      userAvatar: user?.photoURL || '🤙',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(commentsRef, commentData);

    // Update spot review count if rating provided
    if (comment.rating) {
      const spotRef = doc(db, 'spots', comment.spotId);
      const { increment } = await import('firebase/firestore');
      await updateDoc(spotRef, {
        totalReviews: increment(1),
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving comment:', error);
    return { success: false, error };
  }
}

/**
 * Report a spot
 * @param {string} spotId - Spot ID
 * @param {string} reason - Report reason
 * @param {string} details - Additional details
 */
export async function reportSpot(spotId, reason, details = '') {
  try {
    const user = getCurrentUser();
    const reportsRef = collection(db, 'reports');

    await addDoc(reportsRef, {
      spotId,
      reason,
      details,
      reporterId: user?.uid || 'anonymous',
      reporterName: user?.displayName || 'Anonyme',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Increment spot report count
    const spotRef = doc(db, 'spots', spotId);
    const { increment } = await import('firebase/firestore');
    await updateDoc(spotRef, {
      reports: increment(1),
    });

    return { success: true };
  } catch (error) {
    console.error('Error reporting spot:', error);
    return { success: false, error };
  }
}

/**
 * Handle successful authentication
 * @param {Object} user - Firebase user object
 * @param {boolean} isNew - Whether this is a new user
 */
export async function handleAuthSuccess(user, isNew = false) {
  try {
    const usersRef = collection(db, 'users');
    const userDocRef = doc(db, 'users', user.uid);

    if (isNew) {
      // Create user profile
      await updateDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Utilisateur',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        points: 0,
        level: 1,
        badges: [],
        rewards: [],
      }).catch(async () => {
        // Document doesn't exist, create it
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Utilisateur',
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          points: 0,
          level: 1,
          badges: [],
          rewards: [],
        });
      });
    } else {
      // Update last login
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
      }).catch(() => {
        // Ignore if user doc doesn't exist yet
      });
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error handling auth success:', error);
    return { success: false, error };
  }
}

/**
 * Get user profile from Firestore
 * @param {string} userId - User ID
 */
export async function getUserProfile(userId) {
  try {
    const { getDoc } = await import('firebase/firestore');
    const userDocRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userDocRef);

    if (snapshot.exists()) {
      return { success: true, profile: snapshot.data() };
    }
    return { success: false, profile: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error };
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 */
export async function updateUserProfile(userId, updates) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
}

// Export instances for advanced usage
export { app, auth, db, storage, messaging };

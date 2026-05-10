import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

/**
 * Fetch current user profile from Firestore
 * @param {string} uid - User ID from Firebase Auth
 * @returns {Promise<Object>} User document data with id and email
 */
export const getCurrentUserProfile = async (uid) => {
  if (!uid) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return {
        id: uid,
        email: auth.currentUser?.email || '',
        ...userDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }
};

/**
 * Get target users based on current user role
 * For investors: fetch entrepreneurs
 * For entrepreneurs: fetch investors
 * @param {string} role - Current user's role (investor/entrepreneur)
 * @returns {Query} Firestore query for target users
 */
export const getTargetUsersQuery = (role) => {
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'investor') {
    return query(collection(db, 'users'), where('role', 'in', ['entrepreneur', 'Entrepreneur']));
  }

  return query(collection(db, 'users'), where('role', 'in', ['investor', 'Investor']));
};

/**
 * Subscribe to real-time recommendations
 * Fetches target users and applies match algorithm
 * @param {string} uid - Current user ID
 * @param {Object} userData - Current user's profile data
 * @param {Function} matchAlgorithm - Matching algorithm function
 * @param {Function} onSuccess - Callback when data updates
 * @param {Function} onError - Callback on error
 * @returns {Function} Unsubscribe function
 */
export const subscribeToRecommendations = (uid, userData, matchAlgorithm, onSuccess, onError) => {
  if (!uid || !userData) {
    if (onError) onError(new Error('User not authenticated'));
    return () => {};
  }

  try {
    const targetQuery = getTargetUsersQuery(userData.role);

    const unsubscribe = onSnapshot(
      targetQuery,
      (snapshot) => {
        try {
          const candidates = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const ranked = matchAlgorithm(userData, candidates).slice(0, 6);
          onSuccess(ranked);
        } catch (error) {
          console.error('Error processing recommendations:', error);
          if (onError) onError(error);
        }
      },
      (error) => {
        console.error('Recommendation listener failed:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to recommendations:', error);
    if (onError) onError(error);
    return () => {};
  }
};

/**
 * Batch fetch all users (for search, filtering, etc.)
 * Note: Use subscribeToRecommendations for real-time updates
 * @param {string} roleFilter - Optional: filter by role (investor/entrepreneur)
 * @returns {Promise<Array>} Array of user documents
 */
export const getAllUsers = async (roleFilter = null) => {
  try {
    let targetQuery;

    if (roleFilter) {
      targetQuery = query(collection(db, 'users'), where('role', 'in', [roleFilter, roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)]));
    } else {
      targetQuery = collection(db, 'users');
    }

    const snapshot = await (typeof targetQuery === 'object' && targetQuery.where ? getQueryConstraint(targetQuery) : getDocs(targetQuery));

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Verify a user exists in Firestore
 * @param {string} uid - User ID to check
 * @returns {Promise<boolean>} True if user exists
 */
export const verifyUserExists = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists();
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};

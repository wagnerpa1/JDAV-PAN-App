'use client';

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

/**
 * Uploads a file to Firebase Storage and creates a corresponding document in Firestore.
 * @param file The file to upload.
 * @param uploaderId The UID of the user uploading the file.
 * @param firestore A Firestore instance.
 */
export async function uploadFileAndCreateDocument(
  file: File,
  uploaderId: string,
  firestore: Firestore
) {
  if (!file || !uploaderId || !firestore) {
    throw new Error('Missing file, uploader ID, or Firestore instance.');
  }

  const storage = getStorage();
  const storageRef = ref(storage, `documents/${file.name}`);

  // 1. Upload the file to Firebase Storage
  const snapshot = await uploadBytes(storageRef, file);

  // 2. Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  // 3. Create a document in the 'documents' collection in Firestore
  await addDoc(collection(firestore, 'documents'), {
    name: file.name,
    url: downloadURL,
    uploaderId: uploaderId,
    uploadedAt: new Date().toISOString(),
  });
}

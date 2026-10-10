import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { shrinkImageForStore } from "./imageUtils";

/**
 * Receipt photo storage - Firestore-backed (FREE, no Cloud Storage needed).
 *
 * Firebase Cloud Storage now requires the Blaze (paid) plan, so receipt
 * photos are stored as compressed base64 JPEGs inside Firestore, in a side
 * collection keyed by the transaction id:
 *
 *   receipt_photos/{transactionId} = {
 *     user_id, household_id?, image (base64), mime, size, created_at
 *   }
 *
 * The side-collection design keeps transaction queries light: the photo is
 * only fetched when the user clicks the paperclip on a specific entry.
 */

/**
 * Compresses the receipt blob and stores it as a Firestore doc.
 * Returns true when the photo was stored; false when the image could not
 * be compressed under the Firestore size budget (the entry stays valid).
 */
export async function uploadReceiptPhoto(
  userId: string,
  transactionId: string,
  blob: Blob,
  householdId?: string,
): Promise<boolean> {
  try {
    const shrunk = await shrinkImageForStore(blob);
    if (!shrunk) return false;

    await setDoc(doc(db, "receipt_photos", transactionId), {
      user_id: userId,
      household_id: householdId || null,
      image: shrunk.base64,
      mime: shrunk.mimeType,
      size: shrunk.base64.length,
      created_at: Timestamp.now(),
    });
    return true;
  } catch (e) {
    // Never let the attachment break saving the transaction itself.
    console.warn("Receipt photo store skipped:", e);
    return false;
  }
}

/**
 * Fetches a stored receipt photo and returns it as a data URL
 * (or null when there is none / it could not be read).
 */
export async function fetchReceiptPhoto(
  transactionId: string,
): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "receipt_photos", transactionId));
    if (!snap.exists()) return null;
    const data = snap.data() as { image?: string; mime?: string };
    if (!data.image) return null;
    return `data:${data.mime || "image/jpeg"};base64,${data.image}`;
  } catch (e) {
    console.warn("Receipt photo fetch failed:", e);
    return null;
  }
}

/**
 * Deletes a stored receipt photo (called when its transaction is deleted,
 * so orphaned images don't accumulate against the free-tier quota).
 */
export async function deleteReceiptPhoto(
  transactionId: string,
): Promise<void> {
  try {
    await deleteDoc(doc(db, "receipt_photos", transactionId));
  } catch (e) {
    console.warn("Receipt photo cleanup skipped:", e);
  }
}


/**
 * Expense Service
 * Decouples Firestore logic from UI and enforces data integrity
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types';
import { getPeriodFromDate } from '../utils/dateUtils';

const COLLECTION_NAME = 'expenses';

/**
 * Validates and saves an expense (Add or Update)
 */
export const saveExpense = async (
  form: Partial<Expense>, 
  id?: string
): Promise<void> => {
  if (!form.title || !form.amount || !form.date) {
    throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
  }

  if (Number(form.amount) < 0) {
    throw new Error('Số tiền không được nhỏ hơn 0.');
  }

  // Enforce period normalization
  const period = getPeriodFromDate(form.date);
  const data = {
    ...form,
    month: form.month || period.month,
    year: form.year || period.year,
    updatedAt: Timestamp.now()
  };

  if (id) {
    await updateDoc(doc(db, COLLECTION_NAME, id), data);
  } else {
    await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: Timestamp.now()
    });
  }
};

/**
 * Deletes an expense
 */
export const removeExpense = async (id: string): Promise<void> => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

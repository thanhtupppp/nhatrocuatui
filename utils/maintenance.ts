
/**
 * Data Normalization & Maintenance Utility
 * Used to fix legacy records missing month/year attribution
 */

import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { getPeriodFromDate } from './dateUtils';

/**
 * Normalizes all documents in a collection by deriving month/year from date/createdAt
 */
export const normalizeCollection = async (collectionName: string): Promise<number> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  let count = 0;

  querySnapshot.forEach((d) => {
    const data = d.data();
    if (data.month && data.year) return; // Already normalized

    // Derive from date if exists, otherwise from createdAt (if it's a timestamp)
    let derivedPeriod = null;
    if (data.date) {
      derivedPeriod = getPeriodFromDate(data.date);
    } else if (data.createdAt?.toDate) {
      const createdDate = data.createdAt.toDate();
      derivedPeriod = { 
        month: createdDate.getMonth() + 1, 
        year: createdDate.getFullYear() 
      };
    }

    if (derivedPeriod) {
      const updates: any = {
        month: derivedPeriod.month,
        year: derivedPeriod.year
      };

      // Backfill utility usage for invoices if missing
      if (collectionName === 'invoices') {
        if (data.newElectricity !== undefined && data.oldElectricity !== undefined && data.electricityUsage === undefined) {
           const usage = Number(data.newElectricity) - Number(data.oldElectricity);
           updates.electricityUsage = usage;
           updates.electricityCost = usage * (Number(data.electricityRate) || 0);
        }
        if (data.newWater !== undefined && data.oldWater !== undefined && data.waterUsage === undefined) {
           const usage = Number(data.newWater) - Number(data.oldWater);
           updates.waterUsage = usage;
           updates.waterCost = usage * (Number(data.waterRate) || 0);
        }
      }

      batch.update(doc(db, collectionName, d.id), updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
};

/**
 * Runs full system normalization
 */
export const runSystemNormalization = async () => {
  const expenseCount = await normalizeCollection('expenses');
  const invoiceCount = await normalizeCollection('invoices');
  return { expenseCount, invoiceCount };
};

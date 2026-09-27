import {
  collection,
  query,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  startAfter,
  limit,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, LeadActivity } from '../types';
import { fetchUsers } from './dataService';

const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbw-gqHjGYlWbaWTXmycrys0vATSqzvzpka5rm_-QXlITXlK6IG-iGRrn3y2hNHLvMLL/exec';

const syncLeadToSheets = async (leadId: string, action: 'update' | 'delete', leadSlNo?: string) => {
  try {
    if (action === 'delete') {
      await fetch(GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'delete', slNo: leadSlNo })
      });
      return;
    }

    const leadSnap = await getDoc(doc(db, 'leads', leadId));
    if (!leadSnap.exists()) return;
    
    const leadData = { id: leadSnap.id, ...leadSnap.data() } as Lead;
    
    const users = await fetchUsers();
    let assignedName = 'Unassigned';
    if (leadData.assignedTo) {
      const user = users.find((u: any) => u.id === leadData.assignedTo);
      if (user) assignedName = user.name;
    }

    const activities = await fetchLeadActivities(leadId);
    const leadLogs = activities
      .map(a => `[${new Date(a.scheduledAt).toLocaleDateString()}] ${a.type}: ${a.title} - ${a.description} (${a.completed ? 'Completed' : 'Pending'})`)
      .join(' | ');

    const payload = {
      ...leadData,
      assignedTo: assignedName,
      log: leadLogs,
      action: 'update'
    };

    await fetch(GOOGLE_SHEETS_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to trigger Google Sheets webhook:', error);
  }
};

/**
 * Fetch leads with optional pagination
 */
export const fetchLeads = async (
  limitCount?: number,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ leads: Lead[], lastVisible?: QueryDocumentSnapshot<DocumentData> }> => {
  try {
    let snapshot;
    try {
      let q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      if (limitCount) {
        if (startAfterDoc) {
          q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(limitCount));
        } else {
          q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(limitCount));
        }
      }
      snapshot = await getDocs(q);
    } catch (orderError) {
      console.warn('orderBy query failed, falling back to simple collection fetch:', orderError);
      snapshot = await getDocs(collection(db, 'leads'));
    }

    const leads: Lead[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Lead));

    // Sort client-side to ensure consistent ordering even if createdAt is missing on legacy/imported docs
    leads.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return { leads, lastVisible };
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

/**
 * Add a new lead
 */
export const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'leads'), {
      ...leadData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // --- Google Sheets Webhook Sync ---
    syncLeadToSheets(docRef.id, 'update').catch(console.error);
    // ----------------------------------

    return docRef.id;
  } catch (error) {
    console.error('Error adding lead:', error);
    throw error;
  }
};

/**
 * Bulk add leads
 */
export const bulkAddLeads = async (leadsData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'slNo'>[]): Promise<void> => {
  try {
    const snapshot = await getDocs(query(collection(db, 'leads')));
    const currentCount = snapshot.docs.length;
    
    const batch = writeBatch(db);
    
    leadsData.forEach((data, index) => {
      const docRef = doc(collection(db, 'leads'));
      const autoSlNo = `LEAD-${String(currentCount + index + 1).padStart(3, '0')}`;
      
      batch.set(docRef, {
        ...data,
        slNo: autoSlNo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error bulk adding leads:', error);
    throw error;
  }
};

/**
 * Update an existing lead
 */
export const updateLead = async (id: string, updateData: Partial<Omit<Lead, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const leadRef = doc(db, 'leads', id);
    await updateDoc(leadRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    syncLeadToSheets(id, 'update').catch(console.error);
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
};

/**
 * Delete a lead and all of its associated activities
 */
export const deleteLead = async (id: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Fetch lead to get slNo for webhook
    const leadRef = doc(db, 'leads', id);
    const leadSnap = await getDoc(leadRef);
    let slNo = '';
    if (leadSnap.exists()) {
      slNo = (leadSnap.data() as Lead).slNo;
    }

    // 1. Queue the lead document for deletion
    batch.delete(leadRef);

    // 2. Queue all associated activities for deletion
    const activitiesQuery = query(collection(db, 'leadActivities'), where('leadId', '==', id));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    
    activitiesSnapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // 3. Commit the atomic operation
    await batch.commit();

    if (slNo) {
      syncLeadToSheets(id, 'delete', slNo).catch(console.error);
    }
  } catch (error) {
    console.error('Error deleting lead and associated activities:', error);
    throw error;
  }
};


/**
 * Fetch activities for a specific lead
 */
export const fetchLeadActivities = async (leadId: string): Promise<LeadActivity[]> => {
  try {
    const q = query(
      collection(db, 'leadActivities'), 
      where('leadId', '==', leadId)
    );
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LeadActivity));

    // Sort client-side to avoid requiring a composite index in Firestore
    return activities.sort((a, b) => {
      // Sort by scheduled date
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error fetching lead activities:', error);
    throw error;
  }
};

export const fetchAllLeadActivities = async (): Promise<LeadActivity[]> => {
  try {
    const q = query(collection(db, 'leadActivities'));
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LeadActivity));

    return activities.sort((a, b) => {
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error fetching all lead activities:', error);
    throw error;
  }
};

/**
 * Add a new lead activity
 */
export const addLeadActivity = async (activityData: Omit<LeadActivity, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'leadActivities'), {
      ...activityData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding lead activity:', error);
    throw error;
  }
};

/**
 * Update an existing lead activity
 */
export const updateLeadActivity = async (id: string, updateData: Partial<Omit<LeadActivity, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const activityRef = doc(db, 'leadActivities', id);
    await updateDoc(activityRef, updateData);
  } catch (error) {
    console.error('Error updating lead activity:', error);
    throw error;
  }
};

/**
 * Delete a lead activity
 */
export const deleteLeadActivity = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'leadActivities', id));
  } catch (error) {
    console.error('Error deleting lead activity:', error);
    throw error;
  }
};

const LOCAL_COMPANIES_KEY = 'crm_companies_cache';

const getCachedCRMCompanies = (): string[] => {
  try {
    const data = localStorage.getItem(LOCAL_COMPANIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const cacheCRMCompany = (companyName: string) => {
  try {
    const existing = getCachedCRMCompanies();
    if (!existing.includes(companyName)) {
      const updated = [...existing, companyName];
      localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(updated));
    }
  } catch {}
};

/**
 * Fetch all B2B CRM companies
 */
export const fetchCRMCompanies = async (): Promise<string[]> => {
  const seedCompanies = ['Hirush Global LLP', 'Bisorto Institution', 'Acme Corporation'];
  const cached = getCachedCRMCompanies();
  const foundNames: string[] = [];

  try {
    const q = query(collection(db, 'crm_companies'));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      const name = doc.data().name;
      if (name && typeof name === 'string' && name.trim()) {
        foundNames.push(name.trim());
      }
    });
  } catch (error) {
    console.warn('Could not query crm_companies from Firestore, falling back to cache:', error);
  }

  // Also extract any company names saved across existing leads
  try {
    const leadsSnapshot = await getDocs(query(collection(db, 'leads')));
    leadsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.clientType === 'B2B' && data.clientTypeDetail && typeof data.clientTypeDetail === 'string' && data.clientTypeDetail.trim()) {
        foundNames.push(data.clientTypeDetail.trim());
      }
    });
  } catch {}

  const combined = Array.from(new Set([...seedCompanies, ...cached, ...foundNames])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  return combined;
};

/**
 * Add a new B2B company to CRM companies collection
 */
export const addCRMCompany = async (companyName: string): Promise<string> => {
  const trimmed = companyName.trim();
  if (!trimmed) throw new Error('Company name cannot be empty');

  // Always cache locally first so it immediately persists in this browser
  cacheCRMCompany(trimmed);

  try {
    const q = query(collection(db, 'crm_companies'), where('name', '==', trimmed));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(collection(db, 'crm_companies'), {
        name: trimmed,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn('Could not save company to Firestore crm_companies (saved locally):', error);
  }

  return trimmed;
};



import { useState, useEffect } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  Timestamp,
  writeBatch,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CalendarEvent, Permit, Group, MemberProfile } from '../types';

export const useFirestoreSync = (user: any) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setMembers([]);
      setEvents([]);
      setPermits([]);
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    const uid = user.uid;
    let unsubscribeGroups: () => void;
    let unsubscribeMembers: () => void;
    let unsubscribeEvents: () => void;
    let unsubscribePermits: () => void;
    let unsubscribeUsers: () => void;

    const setupListeners = async () => {
      // Check user role
      let userIsAdmin = false;
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        userIsAdmin = userData?.role === 'admin';
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
      setIsAdmin(userIsAdmin);

      // 1. Groups Listener — collectionGroup so members see workspace owner's groups
      const setupGroupsListener = () => {
        return onSnapshot(query(collectionGroup(db, 'groups')), (snapshot) => {
          const fetchedGroups = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate() || new Date(),
              _userId: doc.ref.parent.parent?.id,
            };
          }) as Group[];
          setGroups(fetchedGroups.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
        }, (error: any) => {
          if (error.code === 'permission-denied') return;
          console.error("Groups snapshot error:", error.message || error);
        });
      };
      unsubscribeGroups = setupGroupsListener();

      // 2. Members Listener — collectionGroup so members see all workspace members
      const setupMembersListener = () => {
        return onSnapshot(query(collectionGroup(db, 'members')), (snapshot) => {
          const fetchedMembers = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            _userId: doc.ref.parent.parent?.id,
          })) as MemberProfile[];
          setMembers(fetchedMembers);
        }, (error: any) => {
          if (error.code === 'permission-denied') return;
          console.error("Members snapshot error:", error.message || error);
        });
      };
      unsubscribeMembers = setupMembersListener();

      // 3. Events Listener — collectionGroup so members see workspace events
      const setupEventsListener = () => {
        return onSnapshot(query(collectionGroup(db, 'events')), (snapshot) => {
          const fetchedEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              start: data.start?.toDate() || new Date(),
              end: data.end?.toDate() || new Date(),
              _userId: doc.ref.parent.parent?.id,
            };
          }) as CalendarEvent[];
          setEvents(fetchedEvents);
        }, (error: any) => {
          if (error.code === 'permission-denied') return;
          console.error("Events snapshot error:", error.message || error);
        });
      };
      unsubscribeEvents = setupEventsListener();

      // 4. Permits Listener — collectionGroup so all workspace permits are visible
      const setupPermitsListener = () => {
        return onSnapshot(query(collectionGroup(db, 'permits')), (snapshot) => {
          const fetchedPermits = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              _userId: doc.ref.parent.parent?.id,
            };
          }) as Permit[];
          setPermits(fetchedPermits);
        }, (error: any) => {
          if (error.code === 'permission-denied') return;
          console.error("Permits snapshot error:", error.message || error);
        });
      };
      unsubscribePermits = setupPermitsListener();

      setLoading(false);
    };

    setupListeners();

    return () => {
      if (unsubscribeGroups) unsubscribeGroups();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribePermits) unsubscribePermits();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [user]);

  const addGroup = async (group: Group) => {
    if (!user) return;
    const { _userId, ...rest } = group;
    const targetUid = _userId || user.uid;
    const data = {
      ...rest,
      createdAt: Timestamp.fromDate(group.createdAt),
    };
    
    // Use a batch to create group and owner member entry
    const batch = writeBatch(db);
    batch.set(doc(db, `users/${targetUid}/groups/${group.id}`), data);
    
    const memberId = crypto.randomUUID();
    const memberData: Omit<MemberProfile, 'id'> = {
      groupId: group.id,
      name: user.displayName || user.email?.split('@')[0] || 'Admin',
      email: user.email || undefined,
      role: 'Admin',
      color: '#6366f1',
    };
    batch.set(doc(db, `users/${targetUid}/members/${memberId}`), memberData);
    
    await batch.commit();
  };

  const deleteGroup = async (id: string, _userId?: string) => {
    if (!user) return;
    const targetUid = _userId || user.uid;
    const batch = writeBatch(db);

    // Delete the group itself
    batch.delete(doc(db, `users/${targetUid}/groups/${id}`));

    // Cascade: delete all members that belong to this group
    members.filter(m => m.groupId === id).forEach(m => {
      batch.delete(doc(db, `users/${targetUid}/members/${m.id}`));
    });

    // Cascade: delete all events that belong to this group
    events.filter(e => e.groupId === id).forEach(e => {
      batch.delete(doc(db, `users/${targetUid}/events/${e.id}`));
    });

    await batch.commit();
  };

  const addMember = async (member: MemberProfile) => {
    if (!user) return;
    const { _userId, ...rest } = member;
    const targetUid = _userId || user.uid;
    try {
      await setDoc(doc(db, `users/${targetUid}/members/${member.id}`), rest);
    } catch (error: any) {
      console.error('addMember failed:', error.message || error);
      throw error; // re-throw so the UI can show a toast
    }
  };

  const updateMember = async (member: MemberProfile) => {
    if (!user) return;
    const { _userId, ...rest } = member;
    const targetUid = _userId || user.uid;
    await updateDoc(doc(db, `users/${targetUid}/members/${member.id}`), rest as any);
  };

  const deleteMember = async (id: string, _userId?: string) => {
    if (!user) return;
    const targetUid = _userId || user.uid;
    await deleteDoc(doc(db, `users/${targetUid}/members/${id}`));
  };

  const addEvent = async (event: CalendarEvent) => {
    if (!user) return;
    const { _userId, ...rest } = event;
    const targetUid = user.uid;
    const data = {
      ...rest,
      start: Timestamp.fromDate(event.start),
      end: Timestamp.fromDate(event.end),
      createdBy: event.createdBy || user.uid,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, `users/${targetUid}/events/${event.id}`), data);
  };

  const updateEvent = async (event: CalendarEvent) => {
    if (!user) return;
    const { _userId, ...rest } = event;
    const targetUid = _userId || user.uid;
    const data = {
      ...rest,
      start: Timestamp.fromDate(event.start),
      end: Timestamp.fromDate(event.end),
    };
    await updateDoc(doc(db, `users/${targetUid}/events/${event.id}`), data);
  };

  const deleteEvent = async (id: string, _userId?: string) => {
    if (!user) return;
    const targetUid = _userId || user.uid;
    await deleteDoc(doc(db, `users/${targetUid}/events/${id}`));
  };

  const addPermit = async (permit: Permit) => {
    if (!user) return;
    const { _userId, ...rest } = permit;
    // Write to the workspace owner's path (_userId) so the owner can approve it.
    // Falls back to user.uid if submitting to own workspace.
    const targetUid = _userId || user.uid;
    const data = {
      ...rest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      status: 'pending',
    };
    await setDoc(doc(db, `users/${targetUid}/permits/${permit.id}`), data);
  };

  const updatePermit = async (permit: Permit) => {
    if (!user) return;
    const { _userId, ...rest } = permit;
    const targetUid = _userId || user.uid;
    const data = {
      ...rest,
      createdAt: Timestamp.fromDate(permit.createdAt),
      updatedAt: Timestamp.fromDate(permit.updatedAt),
    };
    await updateDoc(doc(db, `users/${targetUid}/permits/${permit.id}`), data);
  };

  return {
    groups,
    members,
    events,
    permits,
    users,
    loading,
    isAdmin,
    addGroup,
    deleteGroup,
    addMember,
    updateMember,
    deleteMember,
    addEvent,
    updateEvent,
    deleteEvent,
    addPermit,
    updatePermit,
  };
};

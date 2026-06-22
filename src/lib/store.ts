import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import { Project, Task, TaskStatus, TaskPriority, UserProfile } from "../types";

// ==========================================
// 1. Projects CRUD
// ==========================================

export const createProject = async (
  name: string, 
  description: string, 
  deadline: string, 
  createdBy: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, "projects"), {
    name,
    description,
    deadline,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const updateProject = async (
  projectId: string, 
  updates: { name: string; description: string; deadline: string }
): Promise<void> => {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, updates);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  // First delete associated tasks or leave them? It's safer to delete them or let them delete.
  await deleteDoc(doc(db, "projects", projectId));
  
  // Clean up associated tasks
  const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
  const tasksSnap = await getDocs(tasksQuery);
  const deletePromises = tasksSnap.docs.map(taskDoc => deleteDoc(doc(db, "tasks", taskDoc.id)));
  await Promise.all(deletePromises);
};

// Real-time subscription to all projects
export const subscribeToProjects = (onUpdate: (projects: Project[]) => void) => {
  const q = query(collection(db, "projects"), orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const projects: Project[] = [];
    snapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    onUpdate(projects);
  });
};

// ==========================================
// 2. Tasks CRUD
// ==========================================

export const createTask = async (taskData: Omit<Task, "id" | "status" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "tasks"), {
    ...taskData,
    status: "Assigned" as TaskStatus,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const updateTask = async (
  taskId: string, 
  updates: Partial<Omit<Task, "id">>
): Promise<void> => {
  const docRef = doc(db, "tasks", taskId);
  await updateDoc(docRef, updates);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
  const docRef = doc(db, "tasks", taskId);
  await updateDoc(docRef, { status });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, "tasks", taskId));
};

// Real-time subscription to all tasks (for Managers)
export const subscribeToAllTasks = (onUpdate: (tasks: Task[]) => void) => {
  const q = query(collection(db, "tasks"), orderBy("deadline", "asc"));
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    onUpdate(tasks);
  });
};

// Real-time subscription to tasks assigned to a specific staff member
export const subscribeToStaffTasks = (staffId: string, onUpdate: (tasks: Task[]) => void) => {
  const q = query(
    collection(db, "tasks"), 
    where("assignedTo", "==", staffId)
  );
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as Task);
    });
    // Sort client-side by deadline as firestore composite indexes can take time to auto-generate
    tasks.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    onUpdate(tasks);
  });
};

// ==========================================
// 3. Team / Users CRUD
// ==========================================

// Subscribe to all staff members (so manager can assign tasks to them)
export const subscribeToStaffUsers = (onUpdate: (staff: UserProfile[]) => void) => {
  const q = query(collection(db, "users"), where("role", "==", "Staff"));
  return onSnapshot(q, (snapshot) => {
    const staff: UserProfile[] = [];
    snapshot.forEach((doc) => {
      staff.push({ uid: doc.id, ...doc.data() } as UserProfile);
    });
    onUpdate(staff);
  });
};

// Subscribe to all users in the system
export const subscribeToAllUsers = (onUpdate: (users: UserProfile[]) => void) => {
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as UserProfile);
    });
    onUpdate(users);
  });
};

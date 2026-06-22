export type UserRole = "Manager" | "Staff";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  createdBy: string; // Manager local auth UID
  createdAt?: any;
}

export type TaskStatus =
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Under Review"
  | "Approved"
  | "Rejected";

export type TaskPriority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string; // YYYY-MM-DD
  status: TaskStatus;
  assignedTo: string; // Staff member UID
  projectId: string;  // Project UID reference
  createdBy: string;  // Manager UID
  createdAt?: any;
  submissionLink?: string;
  submissionComment?: string;
  submissionFileName?: string;
  submissionFileType?: string;
  submissionFileSize?: number;
  submissionFileBase64?: string;
}

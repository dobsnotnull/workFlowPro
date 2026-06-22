import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { Project, Task, TaskPriority, TaskStatus, UserProfile } from "../types";
import { 
  createProject, 
  updateProject, 
  deleteProject, 
  createTask, 
  updateTask, 
  deleteTask,
  updateTaskStatus,
  subscribeToProjects, 
  subscribeToAllTasks, 
  subscribeToStaffUsers, 
  subscribeToAllUsers
} from "../lib/store";
import { motion, AnimatePresence } from "motion/react";
import { 
  Layers, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  Briefcase, 
  Clock, 
  Search,
  Filter, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  Activity, 
  TrendingUp, 
  Users,
  ChevronDown,
  ExternalLink,
  Link,
  Paperclip,
  FileText
} from "lucide-react";

export const ManagerDashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  
  // Data subscriptions state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});

  // Search & Filter state
  const [taskSearch, setTaskSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("All");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Project Drawer / Modal state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");

  // Task Drawer / Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskProjId, setTaskProjId] = useState("");

  // Status and Confirmation alerts state
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Custom Delete Confirmation Modal state
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<{
    isOpen: boolean;
    type: "project" | "task";
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: "project",
    id: "",
    title: "",
  });

  // Load subscriptions
  useEffect(() => {
    const unsubProjects = subscribeToProjects(setProjects);
    const unsubTasks = subscribeToAllTasks(setTasks);
    const unsubStaff = subscribeToStaffUsers(setStaffList);
    const unsubAllUsers = subscribeToAllUsers((users) => {
      const uMap: Record<string, UserProfile> = {};
      users.forEach(u => {
        uMap[u.uid] = u;
      });
      setUsersMap(uMap);
    });

    return () => {
      unsubProjects();
      unsubTasks();
      unsubStaff();
      unsubAllUsers();
    };
  }, []);

  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // ==========================================
  // Project Actions
  // ==========================================
  const handleOpenProjectModal = (proj: Project | null = null) => {
    if (proj) {
      setEditingProject(proj);
      setProjectName(proj.name);
      setProjectDesc(proj.description);
      setProjectDeadline(proj.deadline);
    } else {
      setEditingProject(null);
      setProjectName("");
      setProjectDesc("");
      setProjectDeadline("");
    }
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDeadline) {
      triggerNotification("error", "Please fill in project name and deadline");
      return;
    }
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: projectName,
          description: projectDesc,
          deadline: projectDeadline
        });
        triggerNotification("success", "Project updated successfully");
      } else {
        await createProject(projectName, projectDesc, projectDeadline, profile?.uid || "");
        triggerNotification("success", "Project created successfully");
      }
      setProjectModalOpen(false);
    } catch (err: any) {
      triggerNotification("error", err.message || "Failed to save project");
    }
  };

  const handleDeleteProject = (projId: string, name: string) => {
    setDeleteConfirmConfig({
      isOpen: true,
      type: "project",
      id: projId,
      title: name,
    });
  };

  // ==========================================
  // Task Actions
  // ==========================================
  const handleOpenTaskModal = (task: Task | null = null) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description);
      setTaskPriority(task.priority);
      setTaskDeadline(task.deadline);
      setTaskAssignee(task.assignedTo);
      setTaskProjId(task.projectId);
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDesc("");
      setTaskPriority("Medium");
      setTaskDeadline("");
      setTaskAssignee(staffList[0]?.uid || "");
      setTaskProjId(projects[0]?.id || "");
    }
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDeadline || !taskAssignee || !taskProjId) {
      triggerNotification("error", "Please fill in all required task fields");
      return;
    }

    const taskData = {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      priority: taskPriority,
      deadline: taskDeadline,
      assignedTo: taskAssignee,
      projectId: taskProjId,
      createdBy: profile?.uid || ""
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        triggerNotification("success", "Task details updated successfully");
      } else {
        await createTask(taskData);
        triggerNotification("success", "Task created and assigned successfully");
      }
      setTaskModalOpen(false);
    } catch (err: any) {
      triggerNotification("error", err.message || "Failed to save task");
    }
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    setDeleteConfirmConfig({
      isOpen: true,
      type: "task",
      id: taskId,
      title: title,
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id, title } = deleteConfirmConfig;
    setDeleteConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    try {
      if (type === "project") {
        await deleteProject(id);
        triggerNotification("success", `Project "${title}" and all its tasks were deleted`);
      } else {
        await deleteTask(id);
        triggerNotification("success", `Task "${title}" was deleted successfully`);
      }
    } catch (err: any) {
      triggerNotification("error", err.message || `Failed to delete ${type}`);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "Approved");
      triggerNotification("success", "Task approved successfully");
    } catch (err: any) {
      triggerNotification("error", "Failed to approve task");
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "Rejected");
      triggerNotification("success", "Task rejected and pushed back to staff");
    } catch (err: any) {
      triggerNotification("error", "Failed to reject task");
    }
  };

  // ==========================================
  // Calculations & Analytics Helper
  // ==========================================
  const getProjectProgress = (projId: string) => {
    const projTasks = tasks.filter(t => t.projectId === projId);
    if (projTasks.length === 0) return 0;
    const completedOrApproved = projTasks.filter(t => t.status === "Approved");
    return Math.round((completedOrApproved.length / projTasks.length) * 100);
  };

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "Approved").length;
  const reviewTasksCount = tasks.filter(t => t.status === "Under Review").length;
  const inProgressTasksCount = tasks.filter(t => t.status === "In Progress" || t.status === "Completed").length;
  const assignedTasksCount = tasks.filter(t => t.status === "Assigned" || t.status === "Rejected").length;

  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                        task.description.toLowerCase().includes(taskSearch.toLowerCase());
    const matchProject = selectedProjectId === "All" || task.projectId === selectedProjectId;
    const matchStaff = selectedStaffId === "All" || task.assignedTo === selectedStaffId;
    const matchPriority = selectedPriority === "All" || task.priority === selectedPriority;
    const matchStatus = selectedStatus === "All" || task.status === selectedStatus;

    return matchSearch && matchProject && matchStaff && matchPriority && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 pb-16">
      {/* Top Banner Notice */}
      <div className="bg-black text-white px-4 py-2.5 text-center text-xs font-light tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
        <Activity className="h-3.5 w-3.5 text-neutral-400 animate-pulse" />
        <span>Enterprise Workspace: Authenticated as <span className="font-semibold text-emerald-400">Manager ({profile?.name})</span></span>
      </div>

      {/* Responsive Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#eaeaea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5" id="header-logo">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 512 512">
                <path d="M256 32L480 432H32L256 32Z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-sm text-neutral-900">TaskOps</span>
            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono">Enterprise</span>
          </div>

          <div className="flex items-center gap-4" id="header-user-status">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-900">{profile?.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">SYSTEM MANAGER</p>
            </div>
            <button
              onClick={logout}
              id="logout-btn"
              className="p-1.5 text-gray-400 hover:text-black hover:bg-neutral-50 rounded-lg transition-all focus:outline-none"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Breadcrumb styled strictly per Geometric Balance theme specification */}
        <div className="flex items-center gap-2 text-xs text-[#666] font-mono mb-4" id="main-breadcrumb">
          <span>Enterprise Workspace</span>
          <span className="text-[#eaeaea] font-light">/</span>
          <span className="text-[#000] font-medium font-sans">Workspace Control</span>
        </div>

        {/* Workspace Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Workspace Control</h1>
            <p className="text-xs text-gray-500 mt-1">Deploy tasks, track user execution metrics, and audit team deliverables.</p>
          </div>
          <div className="flex flex-wrap gap-2.5" id="dashboard-main-actions">
            <button
              onClick={() => handleOpenProjectModal()}
              id="create-project-btn"
              className="flex items-center gap-1.5 bg-white border border-[#eaeaea] text-neutral-700 hover:text-black hover:border-neutral-500 font-medium text-xs px-3.5 py-2 rounded-md shadow-sm transition-all"
            >
              <Layers className="h-3.5 w-3.5 text-neutral-400" />
              New Project
            </button>
            <button
              onClick={() => handleOpenTaskModal()}
              id="create-task-btn"
              className="flex items-center gap-1.5 bg-black text-white hover:bg-neutral-800 font-medium text-xs px-3.5 py-2 rounded-md shadow-sm transition-all"
              disabled={projects.length === 0}
              title={projects.length === 0 ? "You must create a project first before creating tasks!" : ""}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Global Success/Error Notification Overlay */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-6 p-4 rounded-lg border flex items-center justify-between text-xs font-light shadow-sm ${
                notification.type === "success" 
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800" 
                  : "border-red-100 bg-red-50 text-red-800"
              }`}
              id="dashboard-notification-alert"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${notification.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="p-0.5 text-neutral-400 hover:text-black">
                <X className="h-4.5 w-4.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8" id="statistics-grid">
          <div className="p-5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-neutral-300">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Total Projects</p>
            <p className="text-xl font-medium text-neutral-900 mt-1">{projects.length}</p>
          </div>
          <div className="p-5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-neutral-300">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono font-medium">Active Tasks</p>
            <p className="text-xl font-medium text-neutral-900 mt-1">{totalTasksCount}</p>
          </div>
          <div className="p-5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-neutral-300">
            <p className="text-[10px] text-amber-500 uppercase tracking-wider font-mono font-medium">Pending Review</p>
            <p className="text-xl font-medium text-amber-600 mt-1">{reviewTasksCount}</p>
          </div>
          <div className="p-5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-neutral-300">
            <p className="text-[10px] text-blue-500 uppercase tracking-wider font-mono font-medium">In Action</p>
            <p className="text-xl font-medium text-blue-600 mt-1">{inProgressTasksCount}</p>
          </div>
          <div className="p-5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] col-span-2 md:col-span-1 transition-all hover:border-neutral-300">
            <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-mono font-medium">Completed</p>
            <p className="text-xl font-medium text-emerald-600 mt-1">{completedTasksCount}</p>
          </div>
        </div>

        {/* Project Board Slider / Summary List */}
        <section className="mb-10" id="projects-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Projects Overview ({projects.length})</h2>
            {projects.length === 0 && (
              <span className="text-xs text-red-500 font-light flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Create a project to start assigning tasks
              </span>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="border border-dashed border-[#eaeaea] bg-white rounded-xl p-8 text-center">
              <Layers className="h-8 w-8 mx-auto text-neutral-300 mb-2.5" />
              <h3 className="text-sm font-medium text-neutral-800">No active projects</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Create lists to bundle task streams, set target deadlines, and record progress metrics.</p>
              <button
                onClick={() => handleOpenProjectModal()}
                className="mt-4 bg-black text-white hover:bg-neutral-800 text-xs px-3.5 py-1.5 rounded-md"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="project-cards-grid">
              {projects.map((proj) => {
                const progressNum = getProjectProgress(proj.id);
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                return (
                  <motion.div
                    key={proj.id}
                    layoutId={`proj-card-${proj.id}`}
                    className="p-5 bg-white border border-[#eaeaea] rounded-xl flex flex-col justify-between transition-all duration-200 hover:border-neutral-400 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono font-medium">Project ID: {proj.id.substring(0,6)}</span>
                        <div className="flex items-center gap-1.5 text-[#888]">
                          <button
                            onClick={() => handleOpenProjectModal(proj)}
                            className="p-1 hover:text-black hover:bg-neutral-50 rounded"
                            title="Edit project"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id, proj.name)}
                            className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-neutral-950 mt-3">{proj.name}</h3>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed h-[36px]">{proj.description || "No description provided."}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-neutral-100">
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-neutral-500 font-medium">Progress</span>
                        <span className="font-mono font-medium text-black">{progressNum}%</span>
                      </div>
                      {/* Geometric Balance Progress Bar */}
                      <div className="w-full bg-[#eaeaea] shrink-0 mb-4" style={{ height: "6px", borderRadius: "3px", marginTop: "4px" }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressNum}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="bg-[#000]"
                          style={{ height: "100%", borderRadius: "3px" }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-neutral-400" /> Deadline: <span className="font-mono text-neutral-600">{proj.deadline}</span>
                        </span>
                        <span className="font-mono text-neutral-500">{projTasks.length} tasks</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Task Management Module */}
        <section id="tasks-section" className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          {/* Module Header & Filters */}
          <div className="p-5 border-b border-[#eaeaea] bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Task Deliverables Suite</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Filter, monitor status, and review submissions in real-time.</p>
              </div>

              {/* Task Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute inset-y-0 left-0 pl-2.5 h-full w-4 text-gray-400 flex items-center pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-[#eaeaea] rounded-md placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all"
                />
              </div>
            </div>

            {/* Rich Filters row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-neutral-100" id="task-filter-controls">
              {/* Filter Project */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-mono text-gray-400 mb-1">Project</label>
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="block w-full text-xs font-light bg-[#fafafa] border border-[#eaeaea] rounded-md px-2 py-1.5 pr-6 appearance-none focus:outline-none focus:border-black"
                  >
                    <option value="All">All Projects</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Filter Staff */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-mono text-gray-400 mb-1">Assignee</label>
                <div className="relative">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="block w-full text-xs font-light bg-[#fafafa] border border-[#eaeaea] rounded-md px-2 py-1.5 pr-6 appearance-none focus:outline-none focus:border-black"
                  >
                    <option value="All">All Staff</option>
                    {staffList.map(s => (
                      <option key={s.uid} value={s.uid}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Filter Priority */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-mono text-gray-400 mb-1">Priority</label>
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="block w-full text-xs font-light bg-[#fafafa] border border-[#eaeaea] rounded-md px-2 py-1.5 pr-6 appearance-none focus:outline-none focus:border-black"
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Filter Status */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-mono text-gray-400 mb-1">Status</label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="block w-full text-xs font-light bg-[#fafafa] border border-[#eaeaea] rounded-md px-2 py-1.5 pr-6 appearance-none focus:outline-none focus:border-black"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Table / List representation */}
          <div className="overflow-x-auto w-full">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-xs font-light font-mono">No tasks match your filter variables</p>
                {projects.length > 0 && (
                  <button 
                    onClick={() => handleOpenTaskModal()}
                    className="mt-3 text-xs bg-black text-white hover:bg-neutral-800 rounded px-3 py-1 shadow"
                  >
                    Create Task
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto text-xs font-light" id="tasks-data-table">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-[#eaeaea] text-gray-400 uppercase font-mono text-[9px] tracking-wider">
                    <th className="px-6 py-3 font-semibold">Title & Description</th>
                    <th className="px-6 py-3 font-semibold">Project Code</th>
                    <th className="px-6 py-3 font-semibold">Assignee</th>
                    <th className="px-6 py-3 font-semibold text-center">Priority</th>
                    <th className="px-6 py-3 font-semibold">Deadline</th>
                    <th className="px-6 py-3 font-semibold text-center">Workflow</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea] bg-white">
                  {filteredTasks.map((task) => {
                    const mappedProj = projects.find(p => p.id === task.projectId);
                    const assigneeProfile = usersMap[task.assignedTo];

                    return (
                      <tr key={task.id} className="hover:bg-neutral-50/40 transition-colors" id={`task-row-${task.id}`}>
                        <td className="px-6 py-4 max-w-sm">
                          <p className="font-semibold text-neutral-900 text-[13px]">{task.title}</p>
                          <p className="text-gray-400 line-clamp-1 text-[11px] mt-0.5">{task.description || "No summary provided."}</p>
                          
                          {(task.submissionLink || task.submissionComment || task.submissionFileName) && (
                            <div className="mt-2.5 flex flex-wrap gap-2 items-center" id={`deliverables-badges-${task.id}`}>
                              <span className="text-[9px] uppercase tracking-wider font-mono text-gray-400 font-semibold mr-1">Deliverables:</span>
                              
                              {/* Submission Link Badge */}
                              {task.submissionLink && (
                                <a 
                                  href={task.submissionLink.startsWith("http") ? task.submissionLink : `https://${task.submissionLink}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link className="h-3 w-3" />
                                  <span>Link</span>
                                </a>
                              )}

                              {/* Physical File attachment badge */}
                              {task.submissionFileName && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (task.submissionFileBase64) {
                                      const downloadLink = document.createElement("a");
                                      downloadLink.href = task.submissionFileBase64;
                                      downloadLink.download = task.submissionFileName || "submission";
                                      downloadLink.click();
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 hover:text-emerald-900 bg-emerald-50/75 hover:bg-emerald-50 border border-[#bbf7d0]/65 px-2 py-0.5 rounded transition-all"
                                  title={`Download ${task.submissionFileName}`}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]">{task.submissionFileName}</span>
                                </button>
                              )}

                              {/* Comments tooltip indicator */}
                              {task.submissionComment && (
                                <div 
                                  className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-600 bg-neutral-100/80 border border-neutral-200/50 px-2 py-0.5 rounded cursor-help"
                                  title={task.submissionComment}
                                >
                                  <FileText className="h-3 w-3 text-neutral-400" />
                                  <span>Comment</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-gray-500 font-medium">{mappedProj ? mappedProj.name : "N/A"}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="rounded-full bg-black text-white flex items-center justify-center text-[10px] uppercase font-bold shrink-0" style={{ width: "24px", height: "24px", marginRight: "8px" }}>
                              {assigneeProfile?.name ? assigneeProfile.name.charAt(0) : "S"}
                            </div>
                            <span className="font-medium text-neutral-700">{assigneeProfile ? assigneeProfile.name : "Unassigned"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] inline-block font-mono ${
                            task.priority === "High" 
                              ? "text-[#ef4444] font-semibold bg-red-50" 
                              : task.priority === "Medium"
                                ? "bg-amber-50 text-amber-700 font-medium"
                                : "bg-neutral-100 text-neutral-600 font-medium"
                          }`}>
                            {task.priority}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                          {task.deadline}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex flex-col items-center gap-1.5">
                            {/* Visual pill for state */}
                            <span className={`rounded-full px-[10px] py-[4px] text-[12px] font-medium font-mono ${
                              task.status === "Approved"
                                ? "bg-[#dcfce7] text-[#166534]"
                                : task.status === "Under Review"
                                  ? "bg-[#fef3c7] text-[#92400e] border border-amber-200 animate-pulse"
                                  : task.status === "In Progress" || task.status === "Completed"
                                    ? "bg-[#e0f2fe] text-[#0369a1]"
                                    : task.status === "Assigned"
                                      ? "bg-[#f5f5f5] text-[#666666]"
                                      : "bg-[#fee2e2] text-[#991b1b]" /* Rejected */
                            }`}>
                              {task.status}
                            </span>

                            {/* Manager Controls for Review Workflow */}
                            {task.status === "Under Review" && (
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  onClick={() => handleApproveTask(task.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 transition-all"
                                  title="Approve Deliverable"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectTask(task.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white rounded p-1 transition-all"
                                  title="Reject & Request Edits"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleOpenTaskModal(task)}
                              className="text-neutral-500 hover:text-black p-1 rounded hover:bg-neutral-100 transition-all font-mono text-[11px]"
                              title="Edit config"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="text-neutral-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all"
                              title="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* 1. Project Creation / Edit Drawer Modal                  */}
      {/* ======================================================== */}
      <AnimatePresence>
        {projectModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="project-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectModalOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#eaeaea]"
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {editingProject ? "Reconfigure Project Schema" : "Initiate Project Schema"}
                  </h3>
                  <button onClick={() => setProjectModalOpen(false)} className="text-gray-400 hover:text-black">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Core Engine Migration"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Brief Outline Description
                    </label>
                    <textarea
                      placeholder="Specify deliverables scope, stack, and responsibilities..."
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 focus:outline-none focus:border-black min-h-[90px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Target Deliverable Deadline *
                    </label>
                    <input
                      type="date"
                      value={projectDeadline}
                      onChange={(e) => setProjectDeadline(e.target.value)}
                      className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setProjectModalOpen(false)}
                      className="w-1/2 border border-[#eaeaea] text-neutral-600 hover:text-black text-xs font-medium py-2 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-black text-white hover:bg-neutral-800 text-xs font-medium py-2 rounded-md"
                    >
                      {editingProject ? "Update Base" : "Create Base"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. Task Creation / Edit Drawer Modal                     */}
      {/* ======================================================== */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="task-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskModalOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#eaeaea]"
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {editingTask ? "Edit Workspace Task" : "Deploy New Workspace Task"}
                  </h3>
                  <button onClick={() => setTaskModalOpen(false)} className="text-gray-400 hover:text-black">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Parent Project Connection *
                    </label>
                    <div className="relative">
                      <select
                        value={taskProjId}
                        onChange={(e) => setTaskProjId(e.target.value)}
                        className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-black"
                        required
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Integrate endpoints"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Task Descriptions
                    </label>
                    <textarea
                      placeholder="Provide concrete step-by-step instructions..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 focus:outline-none focus:border-black min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Priority Level
                      </label>
                      <div className="relative">
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                          className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-black"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Task Deadline *
                      </label>
                      <input
                        type="date"
                        value={taskDeadline}
                        onChange={(e) => setTaskDeadline(e.target.value)}
                        className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 focus:outline-none focus:border-black"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Workspace Staff Assignee *
                    </label>
                    <div className="relative">
                      {staffList.length === 0 ? (
                        <div className="text-xs text-rose-600 py-2 border border-dashed rounded px-3 border-rose-300">
                          No registered staff users found in organization.
                        </div>
                      ) : (
                        <>
                          <select
                            value={taskAssignee}
                            onChange={(e) => setTaskAssignee(e.target.value)}
                            className="block w-full text-sm bg-white border border-[#eaeaea] rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-black"
                            required
                          >
                            {staffList.map(s => (
                              <option key={s.uid} value={s.uid}>{s.name} ({s.email})</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                        </>
                      )}
                    </div>
                  </div>

                  {editingTask && (editingTask.submissionLink || editingTask.submissionComment || editingTask.submissionFileName) && (
                    <div className="border border-[#eaeaea] bg-neutral-50/50 p-4 rounded-lg space-y-3 mt-4 text-xs">
                      <p className="font-semibold text-neutral-800 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" /> Staff Submission Deliverables
                      </p>

                      {/* Submitted URL */}
                      {editingTask.submissionLink && (
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono block font-semibold">Submitted URL</span>
                          <a 
                            href={editingTask.submissionLink.startsWith("http") ? editingTask.submissionLink : `https://${editingTask.submissionLink}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-600 hover:underline font-mono break-all inline-flex items-center gap-1 mt-0.5"
                          >
                            <Link className="h-3.5 w-3.5 shrink-0" />
                            {editingTask.submissionLink}
                          </a>
                        </div>
                      )}

                      {/* Explanatory Comments */}
                      {editingTask.submissionComment && (
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono block font-semibold">Staff Explanatory Comments</span>
                          <div className="text-xs text-neutral-700 mt-1 p-2 rounded border border-neutral-200/40 bg-white whitespace-pre-wrap leading-relaxed font-light">
                            {editingTask.submissionComment}
                          </div>
                        </div>
                      )}

                      {/* Linked File Attachment */}
                      {editingTask.submissionFileName && (
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono block font-semibold">Linked File Attachment</span>
                          <div className="mt-1 flex items-center justify-between p-2 rounded border border-[#eaeaea] bg-white">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-neutral-800 truncate" title={editingTask.submissionFileName}>
                                  {editingTask.submissionFileName}
                                </p>
                                <p className="text-[9px] text-gray-400 font-mono">
                                  {Math.round(editingTask.submissionFileSize! / 102.4) / 10} KB • {editingTask.submissionFileType}
                                </p>
                              </div>
                            </div>
                            {editingTask.submissionFileBase64 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingTask.submissionFileBase64) {
                                    const dLink = document.createElement("a");
                                    dLink.href = editingTask.submissionFileBase64;
                                    dLink.download = editingTask.submissionFileName || "filename";
                                    dLink.click();
                                  }
                                }}
                                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
                                title="Download staff attachment"
                              >
                                <svg className="h-3.5 w-3.5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setTaskModalOpen(false)}
                      className="w-1/2 border border-[#eaeaea] text-neutral-600 hover:text-black hover:border-black/50 text-xs font-medium py-2 rounded-md"
                    >
                      Close Form
                    </button>
                    <button
                      type="submit"
                      disabled={staffList.length === 0}
                      className="w-1/2 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 text-xs font-medium py-2 rounded-md"
                    >
                      {editingTask ? "Apply Updates" : "Deploy Task"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmConfig.isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="delete-confirmation-modal">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
              />

              <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

              {/* Confirmation Panel */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all border border-neutral-100 relative z-10"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-neutral-950 font-mono uppercase tracking-wider">
                      Delete {deleteConfirmConfig.type === "project" ? "Project" : "Task"}
                    </h3>
                    <p className="text-xs text-neutral-700 leading-relaxed font-light">
                      Are you sure you want to permanently delete <strong className="font-semibold text-neutral-900 font-mono">"{deleteConfirmConfig.title}"</strong>?
                    </p>
                    {deleteConfirmConfig.type === "project" && (
                      <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2 font-light leading-normal">
                        ⚠️ Deleting this project will permanently remove all associated deliverables and tasks from the database. This action is irreversible.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                    className="border border-[#eaeaea] text-neutral-600 hover:text-black hover:border-black/50 text-xs font-semibold py-1.5 px-3.5 rounded-md transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold py-1.5 px-4 rounded-md shadow-sm transition-all flex items-center gap-1 font-mono uppercase tracking-wider"
                  >
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

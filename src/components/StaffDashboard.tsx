import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { Project, Task, TaskPriority, TaskStatus } from "../types";
import { 
  subscribeToStaffTasks, 
  subscribeToProjects, 
  updateTaskStatus,
  updateTask
} from "../lib/store";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, 
  Calendar, 
  Check, 
  Clock, 
  LogOut, 
  Play, 
  Send, 
  AlertTriangle, 
  Layers, 
  Search, 
  CheckCircle2, 
  X,
  FileText,
  Link,
  UploadCloud,
  Trash2,
  Download,
  Paperclip
} from "lucide-react";

export const StaffDashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Filtering & searching states
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Task Detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Submission fields
  const [subLink, setSubLink] = useState("");
  const [subComment, setSubComment] = useState("");
  const [subFileName, setSubFileName] = useState("");
  const [subFileType, setSubFileType] = useState("");
  const [subFileSize, setSubFileSize] = useState(0);
  const [subFileBase64, setSubFileBase64] = useState("");
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state values when modal is opened
  useEffect(() => {
    if (selectedTask) {
      setSubLink(selectedTask.submissionLink || "");
      setSubComment(selectedTask.submissionComment || "");
      setSubFileName(selectedTask.submissionFileName || "");
      setSubFileType(selectedTask.submissionFileType || "");
      setSubFileSize(selectedTask.submissionFileSize || 0);
      setSubFileBase64(selectedTask.submissionFileBase64 || "");
    } else {
      setSubLink("");
      setSubComment("");
      setSubFileName("");
      setSubFileType("");
      setSubFileSize(0);
      setSubFileBase64("");
    }
  }, [selectedTask]);

  // Keep track of active task from global tasks sync
  const activeSelectedTask = selectedTask ? (tasks.find(t => t.id === selectedTask.id) || selectedTask) : null;

  // Alert/Notification State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;

    // Subscribe only to tasks assigned to this staff user
    const unsubTasks = subscribeToStaffTasks(profile.uid, setTasks);
    // Subscribe to projects to display details
    const unsubProjects = subscribeToProjects(setProjects);

    return () => {
      unsubTasks();
      unsubProjects();
    };
  }, [profile?.uid]);

  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ==========================================
  // File & Deliverables Processing
  // ==========================================
  const processFile = (file: File) => {
    // Limit to 400KB so it fits nicely inside standard Firestore single document (1MB limit)
    const MAX_SIZE = 400 * 1024;
    if (file.size > MAX_SIZE) {
      triggerNotification("error", "Please select a file smaller than 400KB to attach.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSubFileName(file.name);
      setSubFileType(file.type || "application/octet-stream");
      setSubFileSize(file.size);
      setSubFileBase64(reader.result as string);
      triggerNotification("success", `File "${file.name}" ready! Remember to save deliverables.`);
    };
    reader.onerror = () => {
      triggerNotification("error", "Error loading file content");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSubFileName("");
    setSubFileType("");
    setSubFileSize(0);
    setSubFileBase64("");
    triggerNotification("success", "File removed. Click Save to apply changes.");
  };

  const handleSaveDeliverables = async () => {
    if (!activeSelectedTask) return;
    setIsSavingSub(true);
    try {
      await updateTask(activeSelectedTask.id, {
        submissionLink: subLink.trim(),
        submissionComment: subComment.trim(),
        submissionFileName: subFileName,
        submissionFileType: subFileType,
        submissionFileSize: subFileSize,
        submissionFileBase64: subFileBase64
      });
      triggerNotification("success", "Your team deliverables were saved successfully.");
    } catch (err: any) {
      console.error(err);
      triggerNotification("error", "Failed to save details to server database.");
    } finally {
      setIsSavingSub(false);
    }
  };

  const handleDownloadFile = (base64: string, name: string) => {
    try {
      const downloadLink = document.createElement("a");
      downloadLink.href = base64;
      downloadLink.download = name;
      downloadLink.click();
    } catch (err) {
      console.error("Failed to download file attachment", err);
      triggerNotification("error", "Attachment download failed.");
    }
  };

  // ==========================================
  // Workflow Transitions
  // ==========================================
  const handleStartWork = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "In Progress");
      triggerNotification("success", "Task is now set to In Progress. Happy coding!");
    } catch (err: any) {
      triggerNotification("error", "Failed to start task");
    }
  };

  const handleMarkCompleted = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "Completed");
      triggerNotification("success", "Task marked as Completed. Ready for review submission!");
    } catch (err: any) {
      triggerNotification("error", "Failed to complete task");
    }
  };

  const handleSubmitForReview = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, "Under Review");
      triggerNotification("success", "Task submitted! The manager has been notified to review your deliverable.");
    } catch (err: any) {
      triggerNotification("error", "Failed to submit task for review");
    }
  };

  // Calculations
  const todoCount = tasks.filter(t => t.status === "Assigned" || t.status === "Rejected").length;
  const inProgressCount = tasks.filter(t => t.status === "In Progress").length;
  const readyCount = tasks.filter(t => t.status === "Completed").length;
  const underReviewCount = tasks.filter(t => t.status === "Under Review").length;
  const approvedCount = tasks.filter(t => t.status === "Approved").length;

  // Filter tasks based on Search bar and Status checkboxes
  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                        task.description.toLowerCase().includes(taskSearch.toLowerCase());
    const matchStatus = statusFilter === "All" || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 pb-16">
      {/* Top Banner Notice */}
      <div className="bg-black text-white px-4 py-2.5 text-center text-xs font-light tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
        <Briefcase className="h-4 w-4 text-neutral-400" />
        <span>Enterprise Workspace: Authenticated as <span className="font-semibold text-emerald-400">Staff Member ({profile?.name})</span></span>
      </div>

      {/* Responsive Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#eaeaea]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5" id="staff-header-logo">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 512 512">
                <path d="M256 32L480 432H32L256 32Z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-sm text-neutral-900">TaskOps</span>
            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-mono">Team</span>
          </div>

          <div className="flex items-center gap-4" id="staff-header-user">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-900">{profile?.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">{profile?.email}</p>
            </div>
            <button
              onClick={logout}
              id="staff-logout-btn"
              className="p-1.5 text-gray-400 hover:text-black hover:bg-neutral-50 rounded-lg transition-all focus:outline-none"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Breadcrumb styled strictly per Geometric Balance theme specification */}
        <div className="flex items-center gap-2 text-xs text-[#666] font-mono mb-4" id="staff-breadcrumb">
          <span>Enterprise Workspace</span>
          <span className="text-[#eaeaea] font-light">/</span>
          <span className="text-[#000] font-medium font-sans">Staff Deck</span>
        </div>

        {/* Header summary */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">My Workspace Assignments</h1>
            <p className="text-xs text-gray-500 mt-1">Review your assigned tasks, check connected project details, and submit completions.</p>
          </div>
        </div>

        {/* Real-time Toast Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              className={`mb-6 p-4 rounded-lg border flex items-center justify-between text-xs font-light shadow-sm ${
                notification.type === "success" 
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800" 
                  : "border-red-100 bg-red-50 text-red-800"
              }`}
              id="staff-toast"
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

        {/* Grid Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8" id="staff-stats-grid">
          <div className="p-4.5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Assigned Tasks</p>
            <p className="text-lg font-medium text-neutral-900 mt-1">{tasks.length}</p>
          </div>
          <div className="p-4.5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] text-rose-500 uppercase tracking-wider font-mono">To Do / Rejected</p>
            <p className="text-lg font-medium text-rose-600 mt-1">{todoCount}</p>
          </div>
          <div className="p-4.5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] text-blue-500 uppercase tracking-wider font-mono">In Progress</p>
            <p className="text-lg font-medium text-blue-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="p-4.5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] text-amber-500 uppercase tracking-wider font-mono">Pending Review</p>
            <p className="text-lg font-medium text-amber-600 mt-1">{readyCount + underReviewCount}</p>
          </div>
          <div className="p-4.5 border border-[#eaeaea] bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] col-span-2 md:col-span-1">
            <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-mono">Approved / Done</p>
            <p className="text-lg font-medium text-emerald-600 mt-1">{approvedCount}</p>
          </div>
        </div>

        {/* Task Search Controls & List */}
        <section className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="p-5 border-b border-[#eaeaea] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">My Queue</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Filter items by stage or search deliverables.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block text-xs font-light bg-[#fafafa] border border-[#eaeaea] rounded-md px-3 py-1.5 focus:outline-none focus:border-black appearance-none pr-8"
                >
                  <option value="All">All Statuses</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <Clock className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative max-w-xs">
                <Search className="absolute inset-y-0 left-0 pl-2.5 h-full w-4 text-gray-400 flex items-center pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search my tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="block pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-[#eaeaea] rounded-md placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#eaeaea]" id="staff-tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="py-12 bg-white text-center text-gray-400">
                <Briefcase className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-light font-mono">No tasks found in this section</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const assignedProj = projects.find(p => p.id === task.projectId);

                return (
                  <motion.div
                    key={task.id}
                    layoutId={`staff-task-item-${task.id}`}
                    className="p-5 bg-white hover:bg-[#fafafa]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0" onClick={() => setSelectedTask(task)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority Tab */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium font-mono ${
                          task.priority === "High" 
                            ? "text-[#ef4444] font-semibold bg-red-50" 
                            : task.priority === "Medium"
                              ? "bg-amber-50 text-amber-700 font-medium"
                              : "bg-neutral-100 text-neutral-600 font-medium"
                        }`}>
                          {task.priority} Priority
                        </span>

                        {/* Status Label */}
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

                        {task.status === "Rejected" && (
                          <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3 inline text-red-500 mr-0.5" /> Re-submission needed
                          </span>
                        )}
                      </div>

                      <h3 className="text-[14px] font-semibold text-neutral-900 mt-2 hover:underline cursor-pointer">
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 max-w-xl leading-relaxed">
                        {task.description || "No instructions provided."}
                      </p>

                      {assignedProj && (
                        <div className="mt-4 flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-neutral-400" /> Project: <span className="font-semibold text-neutral-700">{assignedProj.name}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-neutral-400" /> Due: <span className="text-neutral-700">{task.deadline}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Workflow Actions Column */}
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center" id={`workflow-actions-${task.id}`}>
                      {/* ASSIGNED or REJECTED → Click Start Work to enter IN PROGRESS */}
                      {(task.status === "Assigned" || task.status === "Rejected") && (
                        <button
                          onClick={() => handleStartWork(task.id)}
                          className="flex items-center gap-1 bg-black text-white hover:bg-neutral-800 text-xs font-medium px-4 py-1.5 rounded-md shadow-sm transition-all"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Start Work
                        </button>
                      )}

                      {/* IN PROGRESS → Click Mark Completed */}
                      {task.status === "In Progress" && (
                        <button
                          onClick={() => handleMarkCompleted(task.id)}
                          className="flex items-center gap-1 bg-white border border-neutral-300 text-neutral-700 hover:text-black hover:border-black text-xs font-medium px-4 py-1.5 rounded-md shadow-sm transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark Completed
                        </button>
                      )}

                      {/* COMPLETED → Click Submit for Review */}
                      {task.status === "Completed" && (
                        <button
                          onClick={() => handleSubmitForReview(task.id)}
                          className="flex items-center gap-1.5 bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm transition-all"
                        >
                          <Send className="h-3 w-3" />
                          Submit to Manager
                        </button>
                      )}

                      {/* UNDER REVIEW → Displays review clock */}
                      {task.status === "Under Review" && (
                        <div className="text-[11px] font-mono text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded border border-amber-100">
                          <Clock className="h-3 w-3 text-amber-500 animate-spin" />
                          <span>Under Manager Audit</span>
                        </div>
                      )}

                      {/* APPROVED → Shows final check */}
                      {task.status === "Approved" && (
                        <div className="text-[11px] font-mono text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded border border-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Task Approved</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* 3. Deep-Dive Detail View Modal (Project Details Lookup)   */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="staff-detail-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-[#eaeaea]"
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-500 px-2.5 py-0.5 rounded-full">Task Specifications</span>
                  <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-black">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Task Details */}
                <h3 className="text-lg font-bold text-neutral-900 leading-tight">{activeSelectedTask?.title}</h3>
                <div className="mt-2.5 p-3 rounded bg-neutral-50 text-xs text-neutral-700 leading-relaxed font-light min-h-[50px] border border-neutral-100 whitespace-pre-wrap">
                  {activeSelectedTask?.description || "No description provided."}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="border rounded p-2.5 border-[#eaeaea]">
                    <span className="text-gray-400 font-mono text-[9px] uppercase block">Task Deadline</span>
                    <span className="font-semibold font-mono text-neutral-800 block mt-0.5">{activeSelectedTask?.deadline}</span>
                  </div>
                  <div className="border rounded p-2.5 border-[#eaeaea]">
                    <span className="text-gray-400 font-mono text-[9px] uppercase block">Assigned Stage</span>
                    <span className="font-semibold font-mono text-neutral-800 block mt-0.5">{activeSelectedTask?.status}</span>
                  </div>
                </div>

                {/* Deliverables Submission Section */}
                <div className="mt-5 border-t pt-4" id="staff-modal-deliverables">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 font-mono flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5 text-neutral-400" /> Submission Deliverables
                  </h4>
                  
                  {/* Read-Only Mode (If Approved or Under Review) */}
                  {(activeSelectedTask?.status === "Approved" || activeSelectedTask?.status === "Under Review") ? (
                    <div className="mt-2.5 p-4 rounded-lg border border-[#eaeaea] bg-neutral-50/50 space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-mono block">Submission Link</span>
                        {activeSelectedTask?.submissionLink ? (
                          <a 
                            href={activeSelectedTask.submissionLink.startsWith("http") ? activeSelectedTask.submissionLink : `https://${activeSelectedTask.submissionLink}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-600 hover:underline font-mono break-all inline-flex items-center gap-1 mt-0.5"
                          >
                            <Link className="h-3.5 w-3.5 shrink-0" />
                            {activeSelectedTask.submissionLink}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic font-mono mt-0.5 block">No Link Provided</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 font-mono block">Comments / Notes</span>
                        <div className="text-xs text-neutral-700 mt-0.5 whitespace-pre-wrap leading-relaxed font-light">
                          {activeSelectedTask?.submissionComment || "No comments left."}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 font-mono block">Attached File</span>
                        {activeSelectedTask?.submissionFileName ? (
                          <div className="mt-1 flex items-center justify-between p-2 rounded border border-[#eaeaea] bg-white">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-neutral-800 truncate" title={activeSelectedTask.submissionFileName}>
                                  {activeSelectedTask.submissionFileName}
                                </p>
                                <p className="text-[9px] text-gray-400 font-mono">
                                  {Math.round(activeSelectedTask.submissionFileSize! / 102.4) / 10} KB • {activeSelectedTask.submissionFileType}
                                </p>
                              </div>
                            </div>
                            {activeSelectedTask.submissionFileBase64 && (
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(activeSelectedTask.submissionFileBase64!, activeSelectedTask.submissionFileName!)}
                                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
                                title="Download attachment"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic font-mono mt-0.5 block">No File Attached</span>
                        )}
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-2.5 rounded text-[10px] text-amber-800 leading-relaxed font-mono">
                        🔒 Deliverables are locked for revision while task is in <strong>{activeSelectedTask?.status}</strong> stage.
                      </div>
                    </div>
                  ) : (
                    /* Editable mode (In Progress, Completed, Assigned, Rejected) */
                    <div className="mt-2.5 space-y-4">
                      {/* Link input */}
                      <div>
                        <label className="block text-[10px] text-gray-500 font-mono uppercase mb-1" htmlFor="sub-link-input">
                          Submission URL / Link
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                            <Link className="h-3.5 w-3.5" />
                          </div>
                          <input
                            id="sub-link-input"
                            type="text"
                            placeholder="e.g. https://github.com/my-repo"
                            value={subLink}
                            onChange={(e) => setSubLink(e.target.value)}
                            className="block w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#eaeaea] rounded focus:outline-none focus:border-black font-mono transition-all"
                          />
                        </div>
                      </div>

                      {/* Comment input */}
                      <div>
                        <label className="block text-[10px] text-gray-500 font-mono uppercase mb-1" htmlFor="sub-comment-input">
                          Performance Notes / Comments
                        </label>
                        <textarea
                          id="sub-comment-input"
                          placeholder="List key endpoints, deliverables accomplished, or login credentials if needed..."
                          value={subComment}
                          onChange={(e) => setSubComment(e.target.value)}
                          className="block w-full text-xs px-2.5 py-1.5 bg-white border border-[#eaeaea] rounded focus:outline-none focus:border-black min-h-[60px] font-light leading-relaxed resize-y"
                        />
                      </div>

                      {/* File Upload Box */}
                      <div>
                        <label className="block text-[10px] text-gray-500 font-mono uppercase mb-1">
                          File Attachment <span className="text-gray-400 font-sans">(Max 400KB)</span>
                        </label>
                        
                        {subFileName ? (
                          <div className="flex items-center justify-between p-2 rounded border border-[#eaeaea] bg-neutral-50/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-neutral-800 truncate" title={subFileName}>
                                  {subFileName}
                                </p>
                                <p className="text-[9px] text-gray-400 font-mono">
                                  {Math.round(subFileSize / 102.4) / 10} KB • {subFileType}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {subFileBase64 && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(subFileBase64, subFileName)}
                                  className="p-1 hover:bg-neutral-200/50 rounded text-neutral-600 transition-colors"
                                  title="Download asset"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded text-neutral-400 transition-colors"
                                title="Remove file"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("sub-file-picker")?.click()}
                            className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                              isDragging 
                                ? "border-black bg-black/5" 
                                : "border-[#eaeaea] hover:border-gray-400 bg-[#fafafa]/50"
                            }`}
                          >
                            <input
                              type="file"
                              id="sub-file-picker"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            <UploadCloud className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
                            <p className="text-[10px] font-medium text-neutral-700">Drag & drop files here or click to scan</p>
                            <p className="text-[8px] text-gray-400 mt-0.5">PDF, ZIP, PNG, TXT or DOC (Image or Document)</p>
                          </div>
                        )}
                      </div>

                      {/* Save deliverables button */}
                      <button
                        type="button"
                        id="save-deliverables-btn"
                        onClick={handleSaveDeliverables}
                        disabled={isSavingSub}
                        className="w-full flex items-center justify-center gap-1.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-[11px] font-semibold py-1.5 rounded transition-all shadow-sm font-mono uppercase tracking-wider"
                      >
                        {isSavingSub ? "Writing to Registry..." : "Save Submission Deliverables"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Associated Project details */}
                {(() => {
                  const pDet = projects.find(pro => pro.id === (activeSelectedTask?.projectId || ""));
                  if (!pDet) return null;
                  return (
                    <div className="mt-5 border-t pt-4">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 font-mono flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-neutral-400" /> Connected Project Details
                      </h4>
                      <div className="mt-2.5 p-4 rounded-lg border border-[#eaeaea] bg-neutral-50/50">
                        <p className="text-sm font-semibold text-neutral-800">{pDet.name}</p>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-light">{pDet.description || "No project overview available."}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono mt-3.5">
                          <Calendar className="h-3 w-3" />
                          <span>Project Target Deadline: <span className="text-neutral-700 font-medium">{pDet.deadline}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Workflow Action controls in details modal */}
                <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-2.5">
                  {/* Start Work */}
                  {(activeSelectedTask?.status === "Assigned" || activeSelectedTask?.status === "Rejected") && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleStartWork(activeSelectedTask.id);
                      }}
                      className="w-full bg-black text-white hover:bg-neutral-800 text-xs font-semibold py-2 rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Start Work
                    </button>
                  )}

                  {/* Mark Completed */}
                  {activeSelectedTask?.status === "In Progress" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveDeliverables();
                        await handleMarkCompleted(activeSelectedTask.id);
                      }}
                      className="w-full bg-neutral-900 text-white hover:bg-black text-xs font-semibold py-2 rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      Save & Mark Completed
                    </button>
                  )}

                  {/* Submit to Manager */}
                  {activeSelectedTask?.status === "Completed" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveDeliverables();
                        await handleSubmitForReview(activeSelectedTask.id);
                      }}
                      className="w-full bg-[#166534] text-white hover:bg-[#14532d] text-xs font-semibold py-2 rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit to Manager
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="w-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold py-2 rounded-md"
                  >
                    Close Inspection
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

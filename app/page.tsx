"use client";

import "@fontsource-variable/fraunces";
import Image from "next/image";
import {
  Archive,
  ArrowDownUp,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GripVertical,
  Home as HomeIcon,
  Inbox,
  LayoutDashboard,
  Link2,
  List,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Group = { id: string; label: string; color: string };
type Profile = { name: string; role: string; initials: string; tone: string };
type WorkspaceItem = { id: string; name: string; color: string };
type AttachmentMeta = { id: string; name: string; type: string; size: number; url?: string };
type Task = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  due: string;
  tags: string[];
  comments: number;
  commentBodies?: string[];
  attachments: AttachmentMeta[];
  subtasks: { id: string; title: string; done: boolean }[];
  updatedAt: number;
};

const defaultGroups: Group[] = [
  { id: "ideas", label: "Ideas", color: "#ce7e5c" },
  { id: "backlog", label: "Backlog", color: "#bf9d64" },
  { id: "progress", label: "In progress", color: "#708b98" },
  { id: "review", label: "Review", color: "#887f9e" },
  { id: "done", label: "Done", color: "#77866c" },
];

const defaultWorkspaces: WorkspaceItem[] = [
  { id: "product", name: "Product", color: "#ce7e5c" },
  { id: "design", name: "Design", color: "#77866c" },
  { id: "engineering", name: "Engineering", color: "#887f9e" },
  { id: "insights", name: "Insights", color: "#bf9d64" },
];

const people: Record<string, { name: string; initials: string; tone: string }> = {
  maya: { name: "Maya Chen", initials: "MC", tone: "rose" },
  jon: { name: "Jon Bell", initials: "JB", tone: "mint" },
  eli: { name: "Eli Stone", initials: "ES", tone: "gold" },
  nina: { name: "Nina Park", initials: "NP", tone: "lilac" },
};

const seed: Task[] = [
  { id: "n1", workspaceId: "product", title: "Rethink command palette", description: "Explore a calmer, context-aware command menu for frequent actions.", status: "ideas", priority: "Medium", due: "2026-08-08", tags: ["navigation", "ux"], comments: 4, attachments: [], subtasks: [], updatedAt: 11 },
  { id: "n2", workspaceId: "product", title: "AI-powered release notes", description: "Turn merged work into a clear first draft for the release team.", status: "ideas", priority: "Low", due: "", tags: ["ai"], comments: 2, attachments: [], subtasks: [], updatedAt: 8 },
  { id: "n3", workspaceId: "engineering", title: "Improve search relevance", description: "Tune ranking signals and add lightweight query intent detection.", status: "backlog", priority: "High", due: "2026-08-02", tags: ["search", "quality"], comments: 8, attachments: [], subtasks: [{ id: "s1", title: "Audit zero-result queries", done: true }, { id: "s2", title: "Define relevance benchmark", done: false }], updatedAt: 12 },
  { id: "n4", workspaceId: "design", title: "Mobile navigation patterns", description: "Refine workspace switching and quick-create on smaller screens.", status: "backlog", priority: "Medium", due: "2026-08-12", tags: ["mobile"], comments: 3, attachments: [], subtasks: [], updatedAt: 6 },
  { id: "n5", workspaceId: "design", title: "Redesign task details panel", description: "Make task editing feel focused without losing the board context.", status: "progress", priority: "High", due: "2026-07-31", tags: ["core", "ux"], comments: 11, attachments: [], subtasks: [{ id: "s3", title: "Map information hierarchy", done: true }, { id: "s4", title: "Prototype keyboard flow", done: true }, { id: "s5", title: "Review responsive states", done: false }], updatedAt: 15 },
  { id: "n6", workspaceId: "engineering", title: "Nested project structure", description: "Model project groups without complicating the everyday workflow.", status: "progress", priority: "Urgent", due: "2026-07-30", tags: ["architecture"], comments: 6, attachments: [], subtasks: [{ id: "s6", title: "Review data model", done: false }], updatedAt: 14 },
  { id: "n7", workspaceId: "insights", title: "Onboarding research synthesis", description: "Condense interviews into themes and opportunity areas.", status: "review", priority: "Medium", due: "2026-07-29", tags: ["onboarding"], comments: 7, attachments: [], subtasks: [], updatedAt: 13 },
  { id: "n8", workspaceId: "product", title: "Accessibility audit: round one", description: "Keyboard, contrast, naming, and focus-order review of core flows.", status: "review", priority: "High", due: "2026-08-01", tags: ["a11y"], comments: 5, attachments: [], subtasks: [{ id: "s7", title: "Keyboard sweep", done: true }, { id: "s8", title: "Screen reader pass", done: false }], updatedAt: 10 },
  { id: "n9", workspaceId: "insights", title: "Event tracking cleanup", description: "Standardize event names and remove duplicate legacy signals.", status: "done", priority: "Medium", due: "2026-07-25", tags: ["data"], comments: 3, attachments: [], subtasks: [{ id: "s9", title: "Validate dashboards", done: true }], updatedAt: 5 },
  { id: "n10", workspaceId: "product", title: "Magic-link invitations", description: "Invite teammates with a clear, secure single-step flow.", status: "done", priority: "High", due: "2026-07-24", tags: ["growth"], comments: 9, attachments: [], subtasks: [], updatedAt: 4 },
];

const STORAGE_KEY = "mytodo.workspace.v3";
const OLD_STORAGE_KEY = "northboard.workspace.v2";
const LEGACY_KEY = "northboard.tasks.v1";
const defaultProfile: Profile = { name: "Maya Chen", role: "Product lead", initials: "MC", tone: "rose" };
const colors = ["#ce7e5c", "#bf9d64", "#708b98", "#887f9e", "#77866c", "#b95e55", "#6d8b7e", "#9a745a"];
const makeId = () => `nb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const ATTACHMENT_DB = "mytodo-attachments";

function attachmentStore(mode: IDBTransactionMode) {
  return new Promise<IDBObjectStore>((resolve, reject) => {
    const request = indexedDB.open(ATTACHMENT_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.transaction("files", mode).objectStore("files"));
  });
}

async function saveAttachment(id: string, file: File) {
  const store = await attachmentStore("readwrite");
  await new Promise<void>((resolve, reject) => {
    const request = store.put(file, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function readAttachment(id: string) {
  const store = await attachmentStore("readonly");
  return new Promise<File | undefined>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAttachment(id: string) {
  const store = await attachmentStore("readwrite");
  store.delete(id);
}

async function clearAttachments() {
  const store = await attachmentStore("readwrite");
  store.clear();
}

function AnimatedIcon({ icon: Icon, size = 16 }: { icon: typeof HomeIcon; size?: number }) {
  return <span aria-hidden="true" className="animated-icon"><Icon size={size} strokeWidth={1.8} /></span>;
}

function Avatar({ id, small = false, profile }: { id: string; small?: boolean; profile?: Profile }) {
  const person = id === "maya" && profile ? profile : (people[id] ?? people.maya);
  return <span className={`avatar ${person.tone} ${small ? "small" : ""}`} title={person.name}>{person.initials}</span>;
}

const isImageAttachment = (attachment: AttachmentMeta) => attachment.type.startsWith("image/");

function attachmentHost(attachment: AttachmentMeta) {
  if (!attachment.url) return `${Math.max(1, Math.round(attachment.size / 1024))} KB`;
  try {
    return new URL(attachment.url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

function AttachmentPreview({ attachment, compact = false }: { attachment: AttachmentMeta; compact?: boolean }) {
  const [src, setSrc] = useState(attachment.url ?? "");
  const [open, setOpen] = useState(false);
  const { id, name, type, url } = attachment;

  useEffect(() => {
    if (url || !type.startsWith("image/")) return;
    let objectUrl = "";
    let active = true;
    readAttachment(id).then((file) => {
      if (!active || !file) return;
      objectUrl = URL.createObjectURL(file);
      setSrc(objectUrl);
    }).catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, type, url]);

  if (!src) return null;
  return (
    <>
      <button className={`attachment-preview ${compact ? "compact" : ""}`} onClick={(event) => { event.stopPropagation(); setOpen(true); }} onKeyDown={(event) => event.stopPropagation()} aria-label={`Preview ${attachment.name}`}>
        <Image src={src} alt={name} width={720} height={480} loading="lazy" unoptimized />
      </button>
      {open && <div className="image-lightbox" role="presentation" onMouseDown={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) setOpen(false); }}>
        <div role="dialog" aria-modal="true" aria-label={`Preview ${attachment.name}`}>
          <header><strong>{attachment.name}</strong><button onClick={() => setOpen(false)} aria-label="Close preview"><X size={18} /></button></header>
          <Image src={src} alt={name} width={1600} height={1000} unoptimized />
          {url && <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Open original</a>}
        </div>
      </div>}
    </>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(seed);
  const [groups, setGroups] = useState<Group[]>(defaultGroups);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(defaultWorkspaces);
  const [notes, setNotes] = useState("Ideas worth protecting:\n\n• Keep the core workflow calm.\n• Make progress visible without making it noisy.");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All priorities");
  const [sort, setSort] = useState("Manual order");
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tab, setTab] = useState("Board");
  const [workspaceId, setWorkspaceId] = useState("product");
  const [dragged, setDragged] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"groups" | "workspaces" | "settings" | "profile" | null>(null);
  const [storageIssue, setStorageIssue] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks.map((task: Task & { attachments?: number | AttachmentMeta[]; workspaceId?: string; category?: string; assignee?: string }) => {
            const normalized = { ...task };
            const legacyCategory = normalized.category;
            delete normalized.category;
            delete normalized.assignee;
            return {
              ...normalized,
              workspaceId: task.workspaceId ?? (legacyCategory === "Design" ? "design" : legacyCategory === "Engineering" ? "engineering" : legacyCategory === "Analytics" || legacyCategory === "Research" ? "insights" : "product"),
              attachments: Array.isArray(task.attachments) ? task.attachments : [],
            };
          }));
          if (Array.isArray(parsed.groups) && parsed.groups.length) setGroups(parsed.groups);
          const savedWorkspaces = Array.isArray(parsed.workspaces) && parsed.workspaces.length ? parsed.workspaces : defaultWorkspaces;
          if (Array.isArray(parsed.workspaces) && parsed.workspaces.length) setWorkspaces(parsed.workspaces);
          if (typeof parsed.workspaceId === "string" && savedWorkspaces.some((item: WorkspaceItem) => item.id === parsed.workspaceId)) setWorkspaceId(parsed.workspaceId);
          if (typeof parsed.notes === "string") setNotes(parsed.notes);
          if (parsed.density === "compact") setDensity("compact");
          if (typeof parsed.sidebarCollapsed === "boolean") setSidebarCollapsed(parsed.sidebarCollapsed);
          if (parsed.profile?.name && parsed.profile?.role) setProfile({ ...defaultProfile, ...parsed.profile });
        } else {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed)) setTasks(parsed);
          }
        }
      } catch {
        setStorageIssue(true);
      } finally {
        setHydrated(true);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, groups, workspaces, notes, density, profile, sidebarCollapsed, workspaceId }));
    } catch {
      queueMicrotask(() => setStorageIssue(true));
    }
  }, [tasks, groups, workspaces, notes, density, profile, sidebarCollapsed, workspaceId, hydrated]);

  useEffect(() => {
    const dismissPopovers = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-popover-root]")) return;
      setFilterOpen(false);
      setOverflowOpen(false);
      setWorkspaceOpen(false);
      setUserOpen(false);
    };
    document.addEventListener("pointerdown", dismissPopovers);
    return () => document.removeEventListener("pointerdown", dismissPopovers);
  }, []);

  useEffect(() => {
    const handle = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) && !typing) {
        event.preventDefault();
        document.getElementById("board-search")?.focus();
      }
      if (event.key.toLowerCase() === "n" && !typing) setCreateStatus(groups[0]?.id ?? null);
      if (event.key === "Escape") {
        setSelected(null);
        setCreateStatus(null);
        setFilterOpen(false);
        setOverflowOpen(false);
        setWorkspaceOpen(false);
        setUserOpen(false);
        setModal(null);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [groups]);

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let next = tasks.filter((task) => {
      const haystack = [task.title, task.description, ...task.tags].join(" ").toLowerCase();
      return task.workspaceId === workspaceId
        && (!needle || haystack.includes(needle))
        && (priority === "All priorities" || task.priority === priority);
    });
    if (sort === "Due date") next = [...next].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
    if (sort === "Priority") {
      const rank: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      next = [...next].sort((a, b) => rank[a.priority] - rank[b.priority]);
    }
    if (sort === "Recently updated") next = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    if (sort === "Alphabetical") next = [...next].sort((a, b) => a.title.localeCompare(b.title));
    return next;
  }, [tasks, workspaceId, query, priority, sort]);

  const activeTask = tasks.find((task) => task.id === selected);
  const activeWorkspace = workspaces.find((item) => item.id === workspaceId) ?? workspaces[0] ?? defaultWorkspaces[0];
  const workspaceTasks = tasks.filter((task) => task.workspaceId === workspaceId);
  const doneGroupId = groups.find((group) => group.id === "done")?.id ?? groups.at(-1)?.id ?? "done";
  const done = workspaceTasks.filter((task) => task.status === doneGroupId).length;
  const activeGroupId = groups.find((group) => group.id === "progress")?.id ?? groups[1]?.id;
  const progress = workspaceTasks.filter((task) => task.status === activeGroupId).length;
  const dueSoon = workspaceTasks.filter((task) => task.due && task.status !== doneGroupId && task.due <= "2026-08-04").length;
  const inboxTasks = tasks.filter((task) => task.status !== doneGroupId && (task.priority === "Urgent" || (task.due && task.due <= new Date().toISOString().slice(0, 10))));
  const filterCount = Number(priority !== "All priorities");

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const persistWorkspace = (nextTasks: Task[], nextGroups: Group[], nextWorkspaces: WorkspaceItem[], nextNotes: string, nextDensity: "comfortable" | "compact", nextProfile: Profile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: nextTasks, groups: nextGroups, workspaces: nextWorkspaces, notes: nextNotes, density: nextDensity, profile: nextProfile, sidebarCollapsed, workspaceId }));
    } catch {
      setStorageIssue(true);
    }
  };
  const commitTasks = (change: (current: Task[]) => Task[]) => setTasks((current) => {
    const next = change(current);
    persistWorkspace(next, groups, workspaces, notes, density, profile);
    return next;
  });
  const commitGroups = (change: (current: Group[]) => Group[]) => setGroups((current) => {
    const next = change(current);
    persistWorkspace(tasks, next, workspaces, notes, density, profile);
    return next;
  });
  const commitWorkspaces = (change: (current: WorkspaceItem[]) => WorkspaceItem[]) => setWorkspaces((current) => {
    const next = change(current);
    persistWorkspace(tasks, groups, next, notes, density, profile);
    return next;
  });
  const commitNotes = (value: string) => {
    setNotes(value);
    persistWorkspace(tasks, groups, workspaces, value, density, profile);
  };
  const commitDensity = (value: "comfortable" | "compact") => {
    setDensity(value);
    persistWorkspace(tasks, groups, workspaces, notes, value, profile);
  };
  const commitProfile = (value: Profile) => {
    setProfile(value);
    persistWorkspace(tasks, groups, workspaces, notes, density, value);
  };
  const updateTask = (id: string, patch: Partial<Task>) => commitTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch, updatedAt: Date.now() } : task));
  const moveTask = (id: string, status: string) => {
    updateTask(id, { status });
    setDragged(null);
    showNotice(`Moved to ${groups.find((group) => group.id === status)?.label ?? "group"}`);
  };
  const reorderTask = (id: string, beforeId: string, status: string) => {
    commitTasks((current) => {
      const moving = current.find((task) => task.id === id);
      if (!moving) return current;
      const remaining = current.filter((task) => task.id !== id);
      const index = remaining.findIndex((task) => task.id === beforeId);
      const updated = { ...moving, status, updatedAt: Date.now() };
      remaining.splice(index < 0 ? remaining.length : index, 0, updated);
      return remaining;
    });
    setDragged(null);
  };
  const clearFilters = () => {
    setPriority("All priorities");
    setQuery("");
  };
  const chooseWorkspace = (id: string) => {
    setWorkspaceId(id);
    setTab("Board");
    setSidebarOpen(false);
  };
  const exportBoard = () => {
    const blob = new Blob([JSON.stringify({ workspaces, groups, tasks, notes, profile }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mytodo-export.json";
    link.click();
    URL.revokeObjectURL(url);
    setOverflowOpen(false);
    showNotice("Board exported");
  };
  const resetBoard = () => {
    if (!window.confirm("Reset mytodo to its original demo data?")) return;
    setTasks(seed);
    setGroups(defaultGroups);
    const resetNotes = "Ideas worth protecting:\n\n• Keep the core workflow calm.\n• Make progress visible without making it noisy.";
    setNotes(resetNotes);
    setWorkspaces(defaultWorkspaces);
    setWorkspaceId("product");
    clearAttachments();
    persistWorkspace(seed, defaultGroups, defaultWorkspaces, resetNotes, density, profile);
    showNotice("Demo data restored");
  };

  return (
    <main className={`app-shell ${density === "compact" ? "compact" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><AnimatedIcon icon={Menu} /></button>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-row">
          <button className="brand-mark" onClick={() => sidebarCollapsed ? setSidebarCollapsed(false) : setTab("Home")} aria-label={sidebarCollapsed ? "Expand sidebar" : "mytodo home"}>
            <Image src="/mytodo-icon.png" alt="" width={31} height={31} priority unoptimized />
            <span className="brand-expand"><PanelLeftOpen size={16} /></span>
          </button>
          <span className="brand">mytodo</span>
          <button className="sidebar-collapse" onClick={() => setSidebarCollapsed(true)} aria-label="Collapse sidebar"><AnimatedIcon icon={PanelLeftClose} /></button>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={tab === "Home" ? "active" : ""} onClick={() => { setTab("Home"); setSidebarOpen(false); }}><AnimatedIcon icon={HomeIcon} />Home</button>
          <button onClick={() => { setTab("Board"); setSidebarOpen(false); window.setTimeout(() => document.getElementById("board-search")?.focus(), 50); }}><AnimatedIcon icon={Search} />Search <kbd>⌘K</kbd></button>
          <button className={tab === "Inbox" ? "active" : ""} onClick={() => { setTab("Inbox"); setSidebarOpen(false); }}><AnimatedIcon icon={Inbox} />Inbox <span className="badge">{inboxTasks.length}</span></button>
        </nav>
        <div className="nav-label-row"><p className="nav-label">Workspaces</p><button onClick={() => setModal("workspaces")} aria-label="Edit workspaces"><Pencil size={12} /></button></div>
        <nav className="workspace-nav">
          {workspaces.map((item) => (
            <button key={item.id} className={workspaceId === item.id && tab !== "Inbox" ? "active" : ""} onClick={() => chooseWorkspace(item.id)}>
              <span className="workspace-icon" style={{ background: `${item.color}22`, color: item.color }}>{item.name[0]?.toUpperCase()}</span><span className="nav-text">{item.name}</span><small>{tasks.filter((task) => task.workspaceId === item.id).length}</small>
            </button>
          ))}
        </nav>
        <div className="user-menu-wrap" data-popover-root>
          <button className="user-card" onClick={() => { setUserOpen((value) => !value); setWorkspaceOpen(false); setFilterOpen(false); setOverflowOpen(false); }}>
            <Avatar id="maya" profile={profile} />
            <span><strong>{profile.name}</strong><small>{profile.role}</small></span>
            <MoreHorizontal size={15} />
          </button>
          {userOpen && <div className="mini-menu user-popover"><button onClick={() => { setModal("profile"); setUserOpen(false); }}><UserRound size={14} />Edit profile</button><button onClick={() => { setModal("settings"); setUserOpen(false); }}><Settings size={14} />Settings</button><button onClick={exportBoard}><Download size={14} />Export my data</button></div>}
        </div>
      </aside>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <section className="workspace">
        {storageIssue && <div className="storage-banner">Changes may not persist in this browser. Your board is still usable.</div>}
        <header className="topbar">
          <div className="menu-anchor" data-popover-root>
            <button className="crumb" onClick={() => { setWorkspaceOpen((value) => !value); setFilterOpen(false); setOverflowOpen(false); setUserOpen(false); }}><span className="workspace-icon" style={{ background: `${activeWorkspace.color}22`, color: activeWorkspace.color }}>{activeWorkspace.name[0]}</span><span>{activeWorkspace.name}</span><ChevronDown size={13} /></button>
            {workspaceOpen && <div className="mini-menu workspace-menu">{workspaces.map((item) => <button key={item.id} onClick={() => { chooseWorkspace(item.id); setWorkspaceOpen(false); }}>{item.id === workspaceId && <Check size={13} />}{item.name}</button>)}</div>}
          </div>
          <div className="header-actions">
            <div className="search-wrap"><Search size={14} /><input id="board-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" aria-label="Search tasks" /><kbd>⌘K</kbd></div>
            <div className="menu-anchor" data-popover-root>
              <button className={`icon-button ${filterCount ? "has-filter" : ""}`} onClick={() => { setFilterOpen((value) => !value); setWorkspaceOpen(false); setOverflowOpen(false); setUserOpen(false); }} aria-label={`Filter tasks${filterCount ? `, ${filterCount} active` : ""}`}><AnimatedIcon icon={Filter} />{filterCount > 0 && <span className="filter-count">{filterCount}</span>}</button>
              {filterOpen && (
                <div className="filter-popover">
                  <div><strong>Filter board</strong><button onClick={clearFilters}>Clear all</button></div>
                  <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}>{["All priorities", "Urgent", "High", "Medium", "Low"].map((value) => <option key={value}>{value}</option>)}</select></label>
                </div>
              )}
            </div>
            <div className="menu-anchor" data-popover-root>
              <button className="icon-button" onClick={() => { setOverflowOpen((value) => !value); setWorkspaceOpen(false); setFilterOpen(false); setUserOpen(false); }} aria-label="More options"><AnimatedIcon icon={MoreHorizontal} /></button>
              {overflowOpen && <div className="mini-menu overflow-menu"><button onClick={() => { setModal("groups"); setOverflowOpen(false); }}><Pencil size={14} />Edit groups</button><button onClick={exportBoard}><Download size={14} />Export JSON</button><button onClick={() => { resetBoard(); setOverflowOpen(false); }}><RotateCcw size={14} />Reset demo data</button></div>}
            </div>
            <button className="primary-button" onClick={() => setCreateStatus(groups[0]?.id ?? null)}><Plus size={15} />New task</button>
          </div>
        </header>

        {tab === "Home" ? (
          <HomeView tasks={tasks} groups={groups} profile={profile} onOpen={setSelected} onBoard={() => setTab("Board")} />
        ) : tab === "Inbox" ? (
          <InboxView tasks={inboxTasks} workspaces={workspaces} groups={groups} onOpen={setSelected} onSearch={() => { setTab("Board"); window.setTimeout(() => document.getElementById("board-search")?.focus(), 50); }} />
        ) : (
          <>
            <div className="page-head">
              <div>
                <div className="eyebrow">{activeWorkspace.name.toUpperCase()} WORKSPACE</div>
                <h1>{activeWorkspace.name === "Product" ? "Product Roadmap" : activeWorkspace.name}</h1>
                <p>Aligning initiatives and shipping with intention.</p>
              </div>
            </div>

            <nav className="tabs" aria-label="Roadmap views">
              {[
                ["Board", LayoutDashboard],
                ["List", List],
                ["Timeline", CalendarDays],
                ["Insights", BarChart3],
                ["Notes", FileText],
              ].map(([item, Icon]) => <button key={item as string} className={tab === item ? "active" : ""} onClick={() => setTab(item as string)}><Icon size={13} />{item as string}</button>)}
            </nav>

            <section className="summary-strip">
              <div><span>All tasks</span><strong>{workspaceTasks.length}</strong></div>
              <div><span>Completed</span><strong>{Math.round((done / Math.max(workspaceTasks.length, 1)) * 100)}%</strong></div>
              <div><span>In progress</span><strong>{progress}</strong></div>
              <div><span>Due this week</span><strong>{dueSoon}</strong></div>
              <div className="status-meter" aria-label={`${done} of ${workspaceTasks.length} tasks completed`}>
                <span><i style={{ width: `${(done / Math.max(workspaceTasks.length, 1)) * 100}%` }} /></span>
                <p>Keep shipping small improvements.</p>
              </div>
            </section>

            <div className="board-toolbar">
              <div>
                <button onClick={() => setModal("groups")}><AnimatedIcon icon={GripVertical} />Groups: <strong>Status</strong><Pencil size={11} /></button>
                <label className="sort-control"><ArrowDownUp size={13} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tasks">{["Manual order", "Due date", "Priority", "Recently updated", "Alphabetical"].map((value) => <option key={value}>{value}</option>)}</select></label>
              </div>
              {(query || filterCount > 0) && <button className="clear-filter" onClick={clearFilters}><X size={12} />Clear filters</button>}
              <span>{visibleTasks.length} shown</span>
            </div>

            {tab === "Board" && (
              <div className="board" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(235px, 1fr))`, minWidth: `${Math.max(groups.length * 248, 760)}px` }} aria-label="Product roadmap kanban board">
                {groups.map((group) => {
                  const columnTasks = visibleTasks.filter((task) => task.status === group.id);
                  return (
                    <section className={`column ${dragged ? "drag-active" : ""}`} key={group.id} onDragOver={(event) => event.preventDefault()} onDrop={() => dragged && moveTask(dragged, group.id)}>
                      <header>
                        <div><span className="status-dot" style={{ background: group.color }} /><h2>{group.label}</h2><span className="count">{columnTasks.length}</span></div>
                        <div className="column-actions"><button onClick={() => setModal("groups")} aria-label={`Edit ${group.label}`}><Pencil size={12} /></button><button onClick={() => setCreateStatus(group.id)} aria-label={`Add task to ${group.label}`}><Plus size={15} /></button></div>
                      </header>
                      <div className="cards">
                        {columnTasks.map((task) => <TaskCard key={task.id} task={task} isDone={task.status === doneGroupId} onOpen={() => setSelected(task.id)} onDrag={() => setDragged(task.id)} onDrop={() => dragged && reorderTask(dragged, task.id, group.id)} />)}
                        {columnTasks.length === 0 && <button className="empty-column" onClick={() => setCreateStatus(group.id)}><Plus size={17} />{query || filterCount ? "No matching tasks" : "Add the first task"}</button>}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            {tab === "List" && <ListView tasks={visibleTasks} groups={groups} onOpen={setSelected} />}
            {tab === "Timeline" && <TimelineView tasks={visibleTasks} groups={groups} onOpen={setSelected} />}
            {tab === "Insights" && <InsightsView tasks={workspaceTasks} groups={groups} />}
            {tab === "Notes" && <NotesView value={notes} onChange={commitNotes} />}
          </>
        )}
      </section>

      {activeTask && <TaskPanel task={activeTask} groups={groups} workspaces={workspaces} profile={profile} doneGroupId={doneGroupId} onClose={() => setSelected(null)} onUpdate={(patch) => updateTask(activeTask.id, patch)} onDuplicate={() => {
        const copy = { ...activeTask, id: makeId(), title: `${activeTask.title} (copy)`, attachments: [], updatedAt: Date.now() };
        commitTasks((current) => [...current, copy]);
        setSelected(copy.id);
        showNotice("Task duplicated");
      }} onDelete={() => {
        if (window.confirm("Delete this task? This action cannot be undone.")) {
          activeTask.attachments.forEach((attachment) => deleteAttachment(attachment.id));
          commitTasks((current) => current.filter((task) => task.id !== activeTask.id));
          setSelected(null);
          showNotice("Task deleted");
        }
      }} onNotice={showNotice} />}

      {createStatus && <CreateDialog status={createStatus} workspaceId={workspaceId} groups={groups} onClose={() => setCreateStatus(null)} onCreate={(task) => {
        commitTasks((current) => [...current, task]);
        setCreateStatus(null);
        setSelected(task.id);
        showNotice("Task created");
      }} />}
      {modal === "groups" && <GroupManager groups={groups} tasks={tasks} onClose={() => setModal(null)} onChange={(next) => commitGroups(() => next)} onMoveTasks={(from, to) => commitTasks((current) => current.map((task) => task.status === from ? { ...task, status: to } : task))} onNotice={showNotice} />}
      {modal === "workspaces" && <WorkspaceManager workspaces={workspaces} tasks={tasks} activeId={workspaceId} onClose={() => setModal(null)} onChange={(next) => commitWorkspaces(() => next)} onDelete={(id, fallbackId) => {
        commitTasks((current) => current.map((task) => task.workspaceId === id ? { ...task, workspaceId: fallbackId } : task));
        if (workspaceId === id) setWorkspaceId(fallbackId);
      }} onNotice={showNotice} />}
      {modal === "settings" && <SimpleModal title="Workspace settings" icon={Settings} onClose={() => setModal(null)}>
        <div className="settings-stack">
          <div className="setting-row"><span><strong>Profile</strong><small>Edit your name, role, and initials.</small></span><button className="secondary-button" onClick={() => setModal("profile")}><UserRound size={14} />Edit profile</button></div>
          <div className="setting-row"><span><strong>Card density</strong><small>Choose how much task detail appears at once.</small></span><div className="segmented"><button className={density === "comfortable" ? "active" : ""} onClick={() => commitDensity("comfortable")}>Comfortable</button><button className={density === "compact" ? "active" : ""} onClick={() => commitDensity("compact")}>Compact</button></div></div>
          <div className="setting-row"><span><strong>Local data</strong><small>Everything stays in this browser on this device.</small></span><button className="secondary-button" onClick={exportBoard}><Download size={14} />Export task data</button></div>
          <div className="setting-row danger-row"><span><strong>Reset workspace</strong><small>Restore the original groups, tasks, and notes.</small></span><button className="danger-button" onClick={resetBoard}><RotateCcw size={14} />Reset</button></div>
        </div>
      </SimpleModal>}
      {modal === "profile" && <ProfileEditor profile={profile} onClose={() => setModal(null)} onSave={(next) => { commitProfile(next); setModal(null); showNotice("Profile updated"); }} />}
      {notice && <div className="toast" role="status"><CircleCheck size={15} />{notice}</div>}
    </main>
  );
}

function TaskCard({ task, isDone, onOpen, onDrag, onDrop }: { task: Task; isDone: boolean; onOpen: () => void; onDrag: () => void; onDrop: () => void }) {
  const doneCount = task.subtasks.filter((subtask) => subtask.done).length;
  const firstImage = task.attachments.find(isImageAttachment);
  const links = task.attachments.filter((attachment) => attachment.url && !isImageAttachment(attachment));
  const due = task.due ? new Date(`${task.due}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" }) : "";
  const handleKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <article className={`task-card ${isDone ? "complete" : ""}`} draggable onDragStart={onDrag} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); onDrop(); }} onClick={onOpen} onKeyDown={handleKey} tabIndex={0} role="button" aria-label={`Open ${task.title}`}>
      <div className="card-top"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>
      <h3>{isDone && <span className="done-check"><Check size={10} /></span>}{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      {firstImage && <AttachmentPreview attachment={firstImage} compact />}
      {links.length > 0 && <div className="card-links">{links.slice(0, 2).map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><Link2 size={10} /><span>{attachment.name}</span><ExternalLink size={9} /></a>)}</div>}
      {task.subtasks.length > 0 && <div className="progress-row"><span><i style={{ width: `${(doneCount / task.subtasks.length) * 100}%` }} /></span><small>{doneCount}/{task.subtasks.length}</small></div>}
      <footer><div>{due && <span className="due"><CalendarDays size={10} />{due}</span>}{task.comments > 0 && <span><MessageCircle size={10} />{task.comments}</span>}{task.attachments.length > 0 && <span><Paperclip size={10} />{task.attachments.length}</span>}</div></footer>
    </article>
  );
}

function CreateDialog({ status, workspaceId, groups, onClose, onCreate }: { status: string; workspaceId: string; groups: Group[]; onClose: () => void; onCreate: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState(status);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [due, setDue] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError("Give this task a clear title.");
    if (title.trim().length > 90) return setError("Keep the title under 90 characters.");
    onCreate({ id: makeId(), workspaceId, title: title.trim(), description: description.trim(), status: taskStatus, priority, due, tags: [], comments: 0, commentBodies: [], attachments: [], subtasks: [], updatedAt: Date.now() });
  };
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="task-modal" role="dialog" aria-modal="true" aria-labelledby="new-task-title" onSubmit={submit}>
        <header><div><span className="modal-kicker">PRODUCT ROADMAP</span><h2 id="new-task-title">Create a new task</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        <label className="field"><span>Title</span><input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="What needs to happen?" maxLength={100} />{error && <small className="form-error">{error}</small>}</label>
        <label className="field"><span>Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add useful context…" rows={4} /></label>
        <div className="field-grid">
          <label className="field"><span>Status</span><select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)}>{groups.map((group) => <option value={group.id} key={group.id}>{group.label}</option>)}</select></label>
          <label className="field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{["Low", "Medium", "High", "Urgent"].map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        <label className="field"><span>Due date</span><input type="date" value={due} onChange={(event) => setDue(event.target.value)} /></label>
        <footer><span>Press <kbd>Esc</kbd> to cancel</span><div><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Plus size={14} />Create task</button></div></footer>
      </form>
    </div>
  );
}

function TaskPanel({ task, groups, workspaces, profile, doneGroupId, onClose, onUpdate, onDuplicate, onDelete, onNotice }: { task: Task; groups: Group[]; workspaces: WorkspaceItem[]; profile: Profile; doneGroupId: string; onClose: () => void; onUpdate: (patch: Partial<Task>) => void; onDuplicate: () => void; onDelete: () => void; onNotice: (message: string) => void }) {
  const [panelTab, setPanelTab] = useState("Details");
  const [newSubtask, setNewSubtask] = useState("");
  const [comment, setComment] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    onUpdate({ subtasks: [...task.subtasks, { id: makeId(), title: newSubtask.trim(), done: false }] });
    setNewSubtask("");
  };
  const postComment = () => {
    if (!comment.trim()) return;
    onUpdate({ comments: task.comments + 1, commentBodies: [...(task.commentBodies ?? []), comment.trim()] });
    setComment("");
    onNotice("Comment saved locally");
  };
  const addAttachments = async (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = [...files].filter((file) => file.size <= 10 * 1024 * 1024);
    if (accepted.length !== files.length) onNotice("Some files were over the 10 MB limit");
    const metadata: AttachmentMeta[] = [];
    for (const file of accepted) {
      const id = makeId();
      await saveAttachment(id, file);
      metadata.push({ id, name: file.name, type: file.type, size: file.size });
    }
    if (metadata.length) {
      onUpdate({ attachments: [...task.attachments, ...metadata] });
      onNotice(`${metadata.length} attachment${metadata.length > 1 ? "s" : ""} saved locally`);
    }
  };
  const downloadAttachment = async (attachment: AttachmentMeta) => {
    const file = await readAttachment(attachment.id);
    if (!file) return onNotice("This local file is no longer available");
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.name;
    link.click();
    URL.revokeObjectURL(url);
  };
  const removeAttachment = async (attachment: AttachmentMeta) => {
    if (!attachment.url) await deleteAttachment(attachment.id);
    onUpdate({ attachments: task.attachments.filter((item) => item.id !== attachment.id) });
    onNotice("Attachment removed");
  };
  const addLink = (asImage = false) => {
    const value = attachmentUrl.trim();
    if (!value) return;
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      const fallbackName = asImage ? "Linked image" : url.hostname.replace(/^www\./, "");
      const pathnameName = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
      onUpdate({ attachments: [...task.attachments, { id: makeId(), name: pathnameName || fallbackName, type: asImage ? "image/remote" : "text/uri-list", size: 0, url: url.toString() }] });
      setAttachmentUrl("");
      onNotice(asImage ? "Image link added" : "Link added");
    } catch {
      onNotice("Enter a valid http or https link");
    }
  };
  return (
    <>
      <button className="panel-scrim" onClick={onClose} aria-label="Close task details" />
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="task-panel-title">
        <header className="panel-header"><span>NB-{task.id.slice(-3).toUpperCase()}</span><div><button onClick={onDuplicate} title="Duplicate task"><Copy size={16} /></button><button onClick={onClose} aria-label="Close"><X size={18} /></button></div></header>
        <div className="panel-scroll">
          <div className="panel-title">
            <button className={`completion ${task.status === doneGroupId ? "checked" : ""}`} onClick={() => onUpdate({ status: task.status === doneGroupId ? groups[0]?.id : doneGroupId })} aria-label="Toggle complete">{task.status === doneGroupId && <Check size={13} />}</button>
            <input id="task-panel-title" value={task.title} onChange={(event) => onUpdate({ title: event.target.value })} aria-label="Task title" />
          </div>
          <div className="panel-tabs"><button className={panelTab === "Details" ? "active" : ""} onClick={() => setPanelTab("Details")}>Details</button><button className={panelTab === "Activity" ? "active" : ""} onClick={() => setPanelTab("Activity")}>Activity <span>{task.comments}</span></button></div>
          {panelTab === "Details" ? (
            <>
              <div className="properties">
                <label><span>Workspace</span><select value={task.workspaceId} onChange={(event) => onUpdate({ workspaceId: event.target.value })}>{workspaces.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
                <label><span>Status</span><select value={task.status} onChange={(event) => onUpdate({ status: event.target.value })}>{groups.map((group) => <option value={group.id} key={group.id}>{group.label}</option>)}</select></label>
                <label><span>Priority</span><select value={task.priority} onChange={(event) => onUpdate({ priority: event.target.value as Priority })}>{["Low", "Medium", "High", "Urgent"].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label><span>Due date</span><input type="date" value={task.due} onChange={(event) => onUpdate({ due: event.target.value })} /></label>
              </div>
              <section className="panel-section"><h3>Description</h3><textarea value={task.description} onChange={(event) => onUpdate({ description: event.target.value })} rows={5} placeholder="Add a description…" /></section>
              <section className="panel-section">
                <div className="section-heading"><h3>Subtasks</h3><span>{task.subtasks.filter((subtask) => subtask.done).length}/{task.subtasks.length}</span></div>
                <div className="subtasks">
                  {task.subtasks.map((subtask) => <div key={subtask.id}><button className={`mini-check ${subtask.done ? "checked" : ""}`} onClick={() => onUpdate({ subtasks: task.subtasks.map((item) => item.id === subtask.id ? { ...item, done: !item.done } : item) })}>{subtask.done && <Check size={10} />}</button><input value={subtask.title} className={subtask.done ? "done-text" : ""} onChange={(event) => onUpdate({ subtasks: task.subtasks.map((item) => item.id === subtask.id ? { ...item, title: event.target.value } : item) })} /><button className="subtask-delete" onClick={() => onUpdate({ subtasks: task.subtasks.filter((item) => item.id !== subtask.id) })} aria-label={`Delete ${subtask.title}`}><X size={13} /></button></div>)}
                  <div className="add-subtask"><Plus size={14} /><input value={newSubtask} onChange={(event) => setNewSubtask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addSubtask()} placeholder="Add a subtask" /><button onClick={addSubtask}>Add</button></div>
                </div>
              </section>
              <section className="panel-section attachment-section">
                <div className="section-heading"><h3>Attachments</h3><span>Saved only in this browser</span></div>
                {task.attachments.length > 0 && <div className="attachment-list">{task.attachments.map((attachment) => <div key={attachment.id}>
                  {isImageAttachment(attachment) ? <AttachmentPreview attachment={attachment} /> : <Link2 size={14} />}
                  {attachment.url ? <a href={attachment.url} target="_blank" rel="noreferrer"><strong>{attachment.name}</strong><small>{attachmentHost(attachment)}</small><ExternalLink size={12} /></a> : <button onClick={() => downloadAttachment(attachment)}><strong>{attachment.name}</strong><small>{attachmentHost(attachment)}</small></button>}
                  <button onClick={() => removeAttachment(attachment)} aria-label={`Remove ${attachment.name}`}><Trash2 size={13} /></button>
                </div>)}</div>}
                <div className="attachment-link-form">
                  <input type="url" value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLink(false); } }} placeholder="Paste a link or image URL…" aria-label="Attachment URL" />
                  <button onClick={() => addLink(false)}><Link2 size={13} />Add link</button>
                  <button onClick={() => addLink(true)}>Image URL</button>
                </div>
                <div className="attachment-actions"><label className="attachment-upload"><Plus size={13} />Upload files<input type="file" multiple onChange={(event) => { addAttachments(event.target.files); event.target.value = ""; }} /></label><small className="attachment-hint">Images preview on cards · up to 10 MB · this device only</small></div>
              </section>
            </>
          ) : (
            <section className="activity-list">
              <div><span className="activity-mark"><CircleCheck size={13} /></span><p><strong>Status</strong> is {groups.find((group) => group.id === task.status)?.label}.<span>Latest board state</span></p></div>
              {(task.commentBodies ?? []).map((body, index) => <div key={`${body}-${index}`}><Avatar id="maya" profile={profile} small /><p><strong>{profile.name}</strong> commented: “{body}”<span>Saved locally</span></p></div>)}
              <div><span className="activity-mark"><Archive size={13} /></span><p><strong>mytodo</strong> saves every change in this browser.<span>A moment ago</span></p></div>
              <label><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Leave a thoughtful comment…" rows={4} /><button onClick={postComment}><MessageCircle size={13} />Post comment</button></label>
            </section>
          )}
        </div>
        <footer className="panel-footer"><button onClick={onDelete}><Trash2 size={13} />Delete task</button><span>Changes save automatically</span></footer>
      </aside>
    </>
  );
}

function ProfileEditor({ profile, onClose, onSave }: { profile: Profile; onClose: () => void; onSave: (profile: Profile) => void }) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return setError("Add your name.");
    if (!draft.role.trim()) return setError("Add your role.");
    onSave({
      ...draft,
      name: draft.name.trim().slice(0, 40),
      role: draft.role.trim().slice(0, 48),
      initials: draft.initials.trim().toUpperCase().slice(0, 3) || draft.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    });
  };
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="simple-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onSubmit={submit}>
        <header><div><span><UserRound size={17} /></span><h2 id="profile-title">Edit profile</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        <div className="simple-modal-body">
          <div className="profile-preview"><Avatar id="maya" profile={draft} /><span><strong>{draft.name || "Your name"}</strong><small>{draft.role || "Your role"}</small></span></div>
          <label className="field"><span>Name</span><input autoFocus value={draft.name} onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setError(""); }} maxLength={40} /></label>
          <label className="field"><span>Role</span><input value={draft.role} onChange={(event) => { setDraft({ ...draft, role: event.target.value }); setError(""); }} maxLength={48} /></label>
          <div className="profile-grid">
            <label className="field"><span>Initials</span><input value={draft.initials} onChange={(event) => setDraft({ ...draft, initials: event.target.value.toUpperCase().slice(0, 3) })} maxLength={3} /></label>
            <label className="field"><span>Avatar color</span><select value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value })}><option value="rose">Rose</option><option value="mint">Mint</option><option value="gold">Gold</option><option value="lilac">Lilac</option></select></label>
          </div>
          {error && <p className="profile-error">{error}</p>}
          <footer className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">Save profile</button></footer>
        </div>
      </form>
    </div>
  );
}

function GroupManager({ groups, tasks, onClose, onChange, onMoveTasks, onNotice }: { groups: Group[]; tasks: Task[]; onClose: () => void; onChange: (groups: Group[]) => void; onMoveTasks: (from: string, to: string) => void; onNotice: (message: string) => void }) {
  const addGroup = () => onChange([...groups, { id: makeId(), label: "New group", color: colors[groups.length % colors.length] }]);
  const updateGroup = (id: string, patch: Partial<Group>) => onChange(groups.map((group) => group.id === id ? { ...group, ...patch } : group));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= groups.length) return;
    const next = [...groups];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const remove = (group: Group) => {
    if (groups.length === 1) return onNotice("Keep at least one group");
    const fallback = groups.find((item) => item.id !== group.id);
    const count = tasks.filter((task) => task.status === group.id).length;
    if (count && !window.confirm(`Move ${count} task${count > 1 ? "s" : ""} to ${fallback?.label} and delete ${group.label}?`)) return;
    if (fallback) onMoveTasks(group.id, fallback.id);
    onChange(groups.filter((item) => item.id !== group.id));
    onNotice("Group removed");
  };
  return (
    <SimpleModal title="Edit board groups" icon={GripVertical} onClose={onClose}>
      <p className="modal-intro">Rename, recolor, reorder, add, or remove columns. The last group counts as completed.</p>
      <div className="group-editor">
        {groups.map((group, index) => <div key={group.id}>
          <span className="drag-handle"><GripVertical size={15} /></span>
          <input className="color-input" type="color" value={group.color} onChange={(event) => updateGroup(group.id, { color: event.target.value })} aria-label={`${group.label} color`} />
          <input value={group.label} onChange={(event) => updateGroup(group.id, { label: event.target.value.slice(0, 28) })} aria-label={`Rename ${group.label}`} />
          <span className="group-task-count">{tasks.filter((task) => task.status === group.id).length} tasks</span>
          <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${group.label} left`}><ChevronLeft size={15} /></button>
          <button onClick={() => move(index, 1)} disabled={index === groups.length - 1} aria-label={`Move ${group.label} right`}><ChevronRight size={15} /></button>
          <button className="delete-icon" onClick={() => remove(group)} aria-label={`Delete ${group.label}`}><Trash2 size={14} /></button>
        </div>)}
      </div>
      <button className="add-group-button" onClick={addGroup}><Plus size={14} />Add group</button>
    </SimpleModal>
  );
}

function WorkspaceManager({ workspaces, tasks, activeId, onClose, onChange, onDelete, onNotice }: { workspaces: WorkspaceItem[]; tasks: Task[]; activeId: string; onClose: () => void; onChange: (workspaces: WorkspaceItem[]) => void; onDelete: (id: string, fallbackId: string) => void; onNotice: (message: string) => void }) {
  const addWorkspace = () => onChange([...workspaces, { id: makeId(), name: "New workspace", color: colors[workspaces.length % colors.length] }]);
  const updateWorkspace = (id: string, patch: Partial<WorkspaceItem>) => onChange(workspaces.map((item) => item.id === id ? { ...item, ...patch } : item));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= workspaces.length) return;
    const next = [...workspaces];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const remove = (item: WorkspaceItem) => {
    if (workspaces.length === 1) return onNotice("Keep at least one workspace");
    const fallback = workspaces.find((candidate) => candidate.id !== item.id);
    if (!fallback) return;
    const count = tasks.filter((task) => task.workspaceId === item.id).length;
    if (count && !window.confirm(`Move ${count} task${count > 1 ? "s" : ""} to ${fallback.name} and delete ${item.name}?`)) return;
    onDelete(item.id, fallback.id);
    onChange(workspaces.filter((candidate) => candidate.id !== item.id));
    onNotice("Workspace removed");
  };
  return (
    <SimpleModal title="Edit workspaces" icon={LayoutDashboard} onClose={onClose}>
      <p className="modal-intro">Workspaces are separate task collections. Rename, recolor, reorder, add, or remove them.</p>
      <div className="workspace-editor">
        {workspaces.map((item, index) => <div key={item.id}>
          <input className="color-input" type="color" value={item.color} onChange={(event) => updateWorkspace(item.id, { color: event.target.value })} aria-label={`${item.name} color`} />
          <input value={item.name} onChange={(event) => updateWorkspace(item.id, { name: event.target.value.slice(0, 28) })} aria-label={`Rename ${item.name}`} />
          <span>{tasks.filter((task) => task.workspaceId === item.id).length} tasks{item.id === activeId ? " · active" : ""}</span>
          <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.name} up`}><ChevronLeft size={15} /></button>
          <button onClick={() => move(index, 1)} disabled={index === workspaces.length - 1} aria-label={`Move ${item.name} down`}><ChevronRight size={15} /></button>
          <button className="delete-icon" onClick={() => remove(item)} aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button>
        </div>)}
      </div>
      <button className="add-group-button" onClick={addWorkspace}><Plus size={14} />Add workspace</button>
    </SimpleModal>
  );
}

function SimpleModal({ title, icon: Icon, onClose, children }: { title: string; icon: typeof HomeIcon; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="simple-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header><div><span><Icon size={17} /></span><h2>{title}</h2></div><button onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        <div className="simple-modal-body">{children}</div>
      </section>
    </div>
  );
}

function HomeView({ tasks, groups, profile, onOpen, onBoard }: { tasks: Task[]; groups: Group[]; profile: Profile; onOpen: (id: string) => void; onBoard: () => void }) {
  const recent = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  return (
    <div className="home-view">
      <div className="home-hero"><span className="eyebrow">TUESDAY · MYTODO</span><h1>Good morning, {profile.name.split(" ")[0]}.</h1><p>Here’s what deserves your attention today.</p><button className="primary-button" onClick={onBoard}><LayoutDashboard size={14} />Open roadmap</button></div>
      <div className="home-grid">
        <section><header><h2>Focus now</h2><span>{tasks.filter((task) => task.priority === "Urgent").length} urgent</span></header>{tasks.filter((task) => task.priority === "Urgent").map((task) => <button className="home-task" key={task.id} onClick={() => onOpen(task.id)}><span style={{ background: groups.find((group) => group.id === task.status)?.color }} /><div><strong>{task.title}</strong><small>{task.due || "No due date"}</small></div><ChevronRight size={15} /></button>)}</section>
        <section><header><h2>Recently touched</h2><span>{recent.length} tasks</span></header>{recent.map((task) => <button className="home-task" key={task.id} onClick={() => onOpen(task.id)}><span style={{ background: groups.find((group) => group.id === task.status)?.color }} /><div><strong>{task.title}</strong><small>{groups.find((group) => group.id === task.status)?.label}</small></div><ChevronRight size={15} /></button>)}</section>
      </div>
    </div>
  );
}

function InboxView({ tasks, workspaces, groups, onOpen, onSearch }: { tasks: Task[]; workspaces: WorkspaceItem[]; groups: Group[]; onOpen: (id: string) => void; onSearch: () => void }) {
  return (
    <div className="inbox-view">
      <div className="inbox-hero"><span className="eyebrow">PRIORITY INBOX</span><h1>What needs attention</h1><p>Inbox gathers urgent and overdue work across every workspace. Search is different: it finds matching text inside the workspace you’re viewing.</p><button className="secondary-button" onClick={onSearch}><Search size={14} />Search current workspace</button></div>
      <section className="inbox-list">
        <header><h2>Open priorities</h2><span>{tasks.length} task{tasks.length === 1 ? "" : "s"}</span></header>
        {tasks.length ? tasks.map((task) => {
          const workspace = workspaces.find((item) => item.id === task.workspaceId);
          const overdue = Boolean(task.due && task.due <= new Date().toISOString().slice(0, 10));
          return <button key={task.id} onClick={() => onOpen(task.id)}><span className="status-dot" style={{ background: groups.find((group) => group.id === task.status)?.color }} /><div><strong>{task.title}</strong><small>{workspace?.name}</small></div><span className={`priority ${overdue ? "urgent" : task.priority.toLowerCase()}`}>{overdue ? "Overdue" : task.priority}</span><ChevronRight size={15} /></button>;
        }) : <div className="empty-view">Nothing urgent or overdue. Nice.</div>}
      </section>
    </div>
  );
}

function ListView({ tasks, groups, onOpen }: { tasks: Task[]; groups: Group[]; onOpen: (id: string) => void }) {
  return (
    <div className="list-view"><div className="list-head"><span>Task</span><span>Status</span><span>Priority</span><span>Due</span></div>{tasks.map((task) => <button key={task.id} onClick={() => onOpen(task.id)}><span><span className="status-dot" style={{ background: groups.find((group) => group.id === task.status)?.color }} /><strong>{task.title}</strong></span><span>{groups.find((group) => group.id === task.status)?.label}</span><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span>{task.due || "—"}</span></button>)}</div>
  );
}

function TimelineView({ tasks, groups, onOpen }: { tasks: Task[]; groups: Group[]; onOpen: (id: string) => void }) {
  const dated = tasks.filter((task) => task.due).sort((a, b) => a.due.localeCompare(b.due));
  return (
    <div className="timeline-view"><div className="timeline-line" />{dated.length ? dated.map((task, index) => <button key={task.id} onClick={() => onOpen(task.id)}><span className="timeline-date">{new Date(`${task.due}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })}</span><i style={{ background: groups.find((group) => group.id === task.status)?.color }} /><div><small>{groups.find((group) => group.id === task.status)?.label}</small><strong>{task.title}</strong><span>{task.priority}</span></div>{index === 0 && <em>Next</em>}</button>) : <div className="empty-view">No due dates in this view.</div>}</div>
  );
}

function InsightsView({ tasks, groups }: { tasks: Task[]; groups: Group[] }) {
  const total = Math.max(tasks.length, 1);
  return (
    <div className="insights-view">
      <section className="insight-callout"><BarChart3 size={22} /><div><span>Momentum</span><h2>{tasks.filter((task) => task.status === groups.at(-1)?.id).length} tasks shipped</h2><p>Your workflow is balanced. Review is the best place to unblock next.</p></div></section>
      <section className="insight-bars"><header><h2>Status distribution</h2><span>{tasks.length} total</span></header>{groups.map((group) => { const count = tasks.filter((task) => task.status === group.id).length; return <div key={group.id}><span>{group.label}</span><div><i style={{ width: `${(count / total) * 100}%`, background: group.color }} /></div><strong>{count}</strong></div>; })}</section>
      <section className="priority-grid">{(["Urgent", "High", "Medium", "Low"] as Priority[]).map((item) => <div key={item}><span className={`priority ${item.toLowerCase()}`}>{item}</span><strong>{tasks.filter((task) => task.priority === item).length}</strong><small>tasks</small></div>)}</section>
    </div>
  );
}

function NotesView({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="notes-view"><header><div><FileText size={17} /><span><strong>Roadmap notes</strong><small>Saved automatically in this browser</small></span></div><span>{value.length} characters</span></header><textarea value={value} onChange={(event) => onChange(event.target.value)} aria-label="Roadmap notes" /></div>;
}

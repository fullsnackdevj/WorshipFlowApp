import React, { useState, useEffect, useRef } from "react";
import { Music, FileText, Hash, Search, Plus, Edit, Trash2, X, Save, Tag as TagIcon, Menu, LayoutDashboard, BookOpen, ChevronLeft, ChevronRight, Users, Calendar, Moon, Sun, List, ImagePlus, Loader2, Youtube, ExternalLink } from "lucide-react";
import { Song, Tag, Member, Role, Schedule, ScheduleAssignment } from "./types";
import { GoogleGenAI } from "@google/genai";

type Module = "dashboard" | "worship" | "team";
type WorshipTab = "lyrics" | "chords" | "tags";
type TeamTab = "members" | "roles" | "schedule";

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [activeTab, setActiveTab] = useState<WorshipTab>("lyrics");
  const [activeTeamTab, setActiveTeamTab] = useState<TeamTab>("members");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleView, setScheduleView] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Form states
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editLyrics, setEditLyrics] = useState("");
  const [editChords, setEditChords] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isOcrLoading, setIsOcrLoading] = useState<"lyrics" | "chords" | null>(null);

  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const chordsInputRef = useRef<HTMLInputElement>(null);

  const LYRICS_TEMPLATE = "Verse:\n\nPre Chorus:\n\nChorus:\n\nBridge:";
  const CHORDS_TEMPLATE = "Verse:\n\nPre Chorus:\n\nChorus:\n\nBridge:";

  // Tag form states
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("bg-gray-100 text-gray-800");

  // Member form states
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editMemberRoles, setEditMemberRoles] = useState<string[]>([]);

  // Role form states
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("bg-gray-100 text-gray-800");

  // Schedule form states
  const [editScheduleDate, setEditScheduleDate] = useState("");
  const [editScheduleTitle, setEditScheduleTitle] = useState("");
  const [editScheduleAssignments, setEditScheduleAssignments] = useState<ScheduleAssignment[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchTags();
    fetchRoles();
    fetchMembers();
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [searchQuery, selectedTagId]);

  const fetchSongs = async () => {
    try {
      const url = new URL("/api/songs", window.location.origin);
      if (searchQuery) url.searchParams.append("search", searchQuery);
      if (selectedTagId) url.searchParams.append("tagId", selectedTagId);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (Array.isArray(data)) {
        setSongs(data);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error("Failed to fetch songs", error);
      setSongs([]);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTags(data);
      } else {
        setTags([]);
      }
    } catch (error) {
      console.error("Failed to fetch tags", error);
      setTags([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
      setRoles([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Failed to fetch members", error);
      setMembers([]);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Failed to fetch schedules", error);
      setSchedules([]);
    }
  };

  const handleSaveSong = async () => {
    const payload = {
      title: editTitle,
      artist: editArtist,
      lyrics: editLyrics,
      chords: editChords,
      tags: editTags,
      video_url: editVideoUrl,
    };

    try {
      let response;
      if (selectedSong?.id) {
        response = await fetch(`/api/songs/${selectedSong.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save song");
      }

      setIsEditing(false);
      setSelectedSong(null);
      fetchSongs();
    } catch (error: any) {
      console.error("Failed to save song", error);
      alert(error.message || "Failed to save song. Please check if Firebase is configured correctly.");
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    try {
      await fetch(`/api/songs/${id}`, { method: "DELETE" });
      if (selectedSong?.id === id) {
        setSelectedSong(null);
        setIsEditing(false);
      }
      fetchSongs();
    } catch (error) {
      console.error("Failed to delete song", error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      setNewTagName("");
      fetchTags();
    } catch (error) {
      console.error("Failed to create tag", error);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      fetchTags();
      fetchSongs();
    } catch (error) {
      console.error("Failed to delete tag", error);
    }
  };

  const openEditor = (song?: Song) => {
    if (song) {
      setSelectedSong(song);
      setEditTitle(song.title);
      setEditArtist(song.artist || "");
      setEditVideoUrl(song.video_url || "");
      setEditLyrics(song.lyrics);
      setEditChords(song.chords);
      setEditTags(Array.isArray(song.tags) ? song.tags.map((t) => t.id) : []);
    } else {
      setSelectedSong(null);
      setEditTitle("");
      setEditArtist("");
      setEditVideoUrl("");
      setEditLyrics(LYRICS_TEMPLATE);
      setEditChords(CHORDS_TEMPLATE);
      setEditTags([]);
    }
    setIsEditing(true);
  };

  const toggleTagSelection = (tagId: string) => {
    setEditTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "lyrics" | "chords") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(type);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            {
              text: `Extract the ${type} from this image. Only return the raw text of the ${type}, formatted clearly. Do NOT use any Markdown formatting like bolding (no asterisks). If there are chords and lyrics mixed, and this is for ${type}, try to extract only the relevant parts. For chords, preserve the alignment if possible.`,
            },
          ],
        },
      });

      const extractedText = response.text?.replace(/\*\*/g, "");
      if (extractedText) {
        if (type === "lyrics") {
          setEditLyrics(extractedText);
        } else {
          setEditChords(extractedText);
        }
      }
    } catch (error) {
      console.error("OCR failed", error);
      alert("Failed to extract text from image. Please try again.");
    } finally {
      setIsOcrLoading(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName, color: newRoleColor }),
      });
      setNewRoleName("");
      fetchRoles();
    } catch (error) {
      console.error("Failed to create role", error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await fetch(`/api/roles/${id}`, { method: "DELETE" });
      fetchRoles();
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete role", error);
    }
  };

  const openMemberEditor = (member?: Member) => {
    if (member) {
      setSelectedMember(member);
      setEditFirstName(member.first_name);
      setEditLastName(member.last_name);
      setEditNickname(member.nickname || "");
      setEditPhone(member.phone || "");
      setEditMemberRoles(member.roles.map((r) => r.id));
    } else {
      setSelectedMember(null);
      setEditFirstName("");
      setEditLastName("");
      setEditNickname("");
      setEditPhone("");
      setEditMemberRoles([]);
    }
    setIsEditingMember(true);
  };

  const toggleRoleSelection = (roleId: string) => {
    setEditMemberRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveMember = async () => {
    const payload = {
      first_name: editFirstName,
      last_name: editLastName,
      nickname: editNickname,
      phone: editPhone,
      roles: editMemberRoles,
    };

    try {
      if (selectedMember?.id) {
        await fetch(`/api/members/${selectedMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsEditingMember(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error("Failed to save member", error);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to delete this member? This action cannot be undone.")) return;
    try {
      await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (selectedMember?.id === id) {
        setSelectedMember(null);
        setIsEditingMember(false);
      }
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete member", error);
    }
  };

  const openScheduleEditor = (schedule?: Schedule) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setEditScheduleDate(schedule.date);
      setEditScheduleTitle(schedule.title);
      setEditScheduleAssignments(schedule.assignments);
    } else {
      setSelectedSchedule(null);
      setEditScheduleDate("");
      setEditScheduleTitle("");
      setEditScheduleAssignments([]);
    }
    setIsEditingSchedule(true);
  };

  const handleSaveSchedule = async () => {
    const payload = {
      date: editScheduleDate,
      title: editScheduleTitle,
      assignments: editScheduleAssignments,
    };

    try {
      if (selectedSchedule?.id) {
        await fetch(`/api/schedules/${selectedSchedule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsEditingSchedule(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error("Failed to save schedule", error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (selectedSchedule?.id === id) {
        setSelectedSchedule(null);
        setIsEditingSchedule(false);
      }
      fetchSchedules();
    } catch (error) {
      console.error("Failed to delete schedule", error);
    }
  };

  const handleAddAssignment = () => {
    setEditScheduleAssignments([...editScheduleAssignments, { id: Date.now().toString(), schedule_id: "", member_id: "", role_name: "" }]);
  };

  const handleUpdateAssignment = (index: number, field: string, value: any) => {
    const newAssignments = [...editScheduleAssignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setEditScheduleAssignments(newAssignments);
  };

  const handleRemoveAssignment = (index: number) => {
    const newAssignments = [...editScheduleAssignments];
    newAssignments.splice(index, 1);
    setEditScheduleAssignments(newAssignments);
  };

  const renderCalendarView = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} className="p-1 sm:p-2" />;
            
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const daySchedules = schedules.filter(s => s.date === dateString);
            const hasSchedule = daySchedules.length > 0;
            const isToday = new Date().toDateString() === date.toDateString();
            
            return (
              <div 
                key={date.toISOString()} 
                className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 rounded-xl border transition-all ${
                  isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                } ${hasSchedule ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm' : 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-500'}`}
                onClick={() => {
                  if (hasSchedule) {
                    openScheduleEditor(daySchedules[0]);
                  } else {
                    setEditScheduleDate(dateString);
                    setEditScheduleTitle("");
                    setEditScheduleAssignments([]);
                    setSelectedSchedule(null);
                    setIsEditingSchedule(true);
                  }
                }}
              >
                <div className={`text-right text-xs sm:text-sm font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {date.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {daySchedules.map(s => (
                    <div key={s.id} className="text-[10px] sm:text-xs p-1 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 truncate" title={s.title}>
                      <span className="hidden sm:inline">{s.title}</span>
                      <span className="sm:hidden">•</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTeam = () => (
    <div className="flex flex-col h-full">
      {!isEditingMember && !selectedMember && !isEditingSchedule && !selectedSchedule && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex gap-4 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTeamTab("members")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTeamTab === "members" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTeamTab("roles")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTeamTab === "roles" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTeamTab("schedule")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTeamTab === "schedule" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Schedule
          </button>
        </div>
      )}

      <div className="p-4 sm:p-6 overflow-auto">
        {activeTeamTab === "members" && !isEditingMember && !selectedMember && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Team Members</h2>
              <button
                onClick={() => openMemberEditor()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Roles</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(members) && members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{member.first_name} {member.last_name}</div>
                        {member.nickname && <div className="text-sm text-gray-500 dark:text-gray-400">"{member.nickname}"</div>}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-gray-600 dark:text-gray-300">{member.phone || "-"}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(member.roles) && member.roles.map((role) => (
                            <span key={role.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openMemberEditor(member)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors mr-2">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteMember(member.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(members) || members.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No members found. Add one above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTeamTab === "members" && isEditingMember && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedMember ? "Edit Member" : "Add Member"}</h2>
              <button onClick={() => { setIsEditingMember(false); setSelectedMember(null); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="First Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Last Name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nickname</label>
                  <input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Nickname" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Phone Number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(roles) && roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => toggleRoleSelection(role.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                        editMemberRoles.includes(role.id)
                          ? `${role.color} border-transparent`
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => { setIsEditingMember(false); setSelectedMember(null); }} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">Cancel</button>
                <button onClick={handleSaveMember} disabled={!editFirstName.trim() || !editLastName.trim()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={18} /> Save Member
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTeamTab === "roles" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Manage Roles</h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8">
              <h3 className="text-lg font-medium mb-4">Create New Role</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" placeholder="Role Name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                <select value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 outline-none">
                  <option value="bg-gray-100 text-gray-800">Gray</option>
                  <option value="bg-red-100 text-red-800">Red</option>
                  <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                  <option value="bg-green-100 text-green-800">Green</option>
                  <option value="bg-blue-100 text-blue-800">Blue</option>
                  <option value="bg-indigo-100 text-indigo-800">Indigo</option>
                  <option value="bg-purple-100 text-purple-800">Purple</option>
                  <option value="bg-pink-100 text-pink-800">Pink</option>
                </select>
                <button onClick={handleCreateRole} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium">Add</button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(roles) && roles.map((role) => (
                    <tr key={role.id}>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color}`}>{role.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(roles) || roles.length === 0) && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No roles found. Create one above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTeamTab === "schedule" && !isEditingSchedule && !selectedSchedule && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Service Schedule</h2>
              <div className="flex items-center gap-3">
                <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => setScheduleView("list")}
                    className={`p-1.5 rounded-md transition-colors ${scheduleView === "list" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    title="List View"
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setScheduleView("calendar")}
                    className={`p-1.5 rounded-md transition-colors ${scheduleView === "calendar" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                    title="Calendar View"
                  >
                    <Calendar size={18} />
                  </button>
                </div>
                <button
                  onClick={() => openScheduleEditor()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm text-sm"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Schedule</span>
                </button>
              </div>
            </div>
            
            {scheduleView === "list" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.isArray(schedules) && schedules.map((schedule) => (
                  <div key={schedule.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{schedule.title}</h3>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium">{new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openScheduleEditor(schedule)} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteSchedule(schedule.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 flex-1">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Assignments</h4>
                      {Array.isArray(schedule.assignments) && schedule.assignments.map((assignment) => (
                        <div key={assignment.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{assignment.role_name}</span>
                          <span className="text-gray-900 dark:text-gray-100">{assignment.member?.first_name} {assignment.member?.last_name}</span>
                        </div>
                      ))}
                      {(!Array.isArray(schedule.assignments) || schedule.assignments.length === 0) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No assignments yet.</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!Array.isArray(schedules) || schedules.length === 0) && (
                  <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                    No schedules found. Create one to get started.
                  </div>
                )}
              </div>
            ) : (
              renderCalendarView()
            )}
          </div>
        )}

        {activeTeamTab === "schedule" && isEditingSchedule && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedSchedule ? "Edit Schedule" : "Add Schedule"}</h2>
              <button onClick={() => { setIsEditingSchedule(false); setSelectedSchedule(null); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Title</label>
                  <input type="text" value={editScheduleTitle} onChange={(e) => setEditScheduleTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="e.g. Sunday Service" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" value={editScheduleDate} onChange={(e) => setEditScheduleDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignments</label>
                  <button onClick={handleAddAssignment} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1">
                    <Plus size={16} /> Add Role
                  </button>
                </div>
                <div className="space-y-3">
                  {Array.isArray(editScheduleAssignments) && editScheduleAssignments.map((assignment, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <select 
                        value={assignment.role_name} 
                        onChange={(e) => handleUpdateAssignment(index, 'role_name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 outline-none"
                      >
                        <option value="">Select Role</option>
                        {Array.isArray(roles) && roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                      <select 
                        value={assignment.member_id} 
                        onChange={(e) => handleUpdateAssignment(index, 'member_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 outline-none"
                      >
                        <option value="">Select Member</option>
                        {Array.isArray(members) && members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                      </select>
                      <button onClick={() => handleRemoveAssignment(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(!Array.isArray(editScheduleAssignments) || editScheduleAssignments.length === 0) && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">No assignments added. Click "Add Role" to assign members.</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => { setIsEditingSchedule(false); setSelectedSchedule(null); }} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">Cancel</button>
                <button onClick={handleSaveSchedule} disabled={!editScheduleTitle.trim() || !editScheduleDate} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={18} /> Save Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Music size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Songs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(songs) ? songs.length : 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-xl">
            <Hash size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Tags</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(tags) ? tags.length : 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Members</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(members) ? members.length : 0}</p>
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recently Added Songs</h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tags</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.isArray(songs) && songs.slice(0, 5).map((song) => (
              <tr key={song.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => { setActiveModule("worship"); setSelectedSong(song); }}>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{song.title}</td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(song.tags) && song.tags.slice(0, 2).map((tag) => (
                      <span key={tag.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tag.color}`}>
                        {tag.name}
                      </span>
                    ))}
                    {Array.isArray(song.tags) && song.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        +{song.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                  {song.created_at ? new Date(song.created_at).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {(!Array.isArray(songs) || songs.length === 0) && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No songs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 transform ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between h-16">
          <div className={`flex items-center gap-2 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? "justify-center w-full" : ""}`}>
            <Music className="text-indigo-600 dark:text-indigo-400 shrink-0" size={24} />
            {!isSidebarCollapsed && <span className="text-xl font-bold dark:text-white">WorshipFlow</span>}
          </div>
          <button 
            className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveModule("dashboard"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeModule === "dashboard" ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            } ${isSidebarCollapsed ? "justify-center" : ""}`}
            title="Dashboard"
          >
            <LayoutDashboard size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => { setActiveModule("worship"); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              activeModule === "worship" ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            } ${isSidebarCollapsed ? "justify-center" : ""}`}
            title="Worship"
          >
            <BookOpen size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span>Worship</span>}
          </button>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex w-full items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div className="text-xs text-gray-400 font-mono">
            {isSidebarCollapsed ? "v1.6.1" : "Version 1.6.1"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4 h-16 shrink-0">
          <button 
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          {activeModule === "worship" && (
            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by title, artist, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all outline-none text-sm dark:text-white"
                />
              </div>
              {activeTab !== "tags" && !isEditing && !selectedSong && (
                <button
                  onClick={() => openEditor()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm text-sm shrink-0"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">New Song</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {activeModule === "dashboard" ? (
            renderDashboard()
          ) : activeModule === "team" ? (
            renderTeam()
          ) : (
            <div className="flex flex-col h-full">
              {/* Worship Sub-navigation */}
              {!isEditing && !selectedSong && (
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-2 flex gap-4 overflow-x-auto shrink-0">
                  <button
                    onClick={() => setActiveTab("lyrics")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "lyrics" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    Lyrics
                  </button>
                  <button
                    onClick={() => setActiveTab("chords")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "chords" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    Chords
                  </button>
                  <button
                    onClick={() => setActiveTab("tags")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "tags" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    Tags
                  </button>
                </div>
              )}

              <div className="p-4 sm:p-6">
                {activeTab === "tags" && !isEditing && !selectedSong ? (
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">Manage Tags</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8">
                      <h3 className="text-lg font-medium mb-4">Create New Tag</h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input
                          type="text"
                          placeholder="Tag Name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                        />
                        <select
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 outline-none"
                        >
                          <option value="bg-gray-100 text-gray-800">Gray</option>
                          <option value="bg-red-100 text-red-800">Red</option>
                          <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                          <option value="bg-green-100 text-green-800">Green</option>
                          <option value="bg-blue-100 text-blue-800">Blue</option>
                          <option value="bg-indigo-100 text-indigo-800">Indigo</option>
                          <option value="bg-purple-100 text-purple-800">Purple</option>
                          <option value="bg-pink-100 text-pink-800">Pink</option>
                        </select>
                        <button
                          onClick={handleCreateTag}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tag</th>
                            <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Array.isArray(tags) && tags.map((tag) => (
                            <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.color}`}>
                                  {tag.name}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!Array.isArray(tags) || tags.length === 0) && (
                            <tr>
                              <td colSpan={2} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                No tags found. Create one above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : isEditing ? (
                  <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">{selectedSong ? "Edit Song" : "New Song"}</h2>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="Song Title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artist</label>
                          <input
                            type="text"
                            value={editArtist}
                            onChange={(e) => setEditArtist(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                            placeholder="Artist Name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Link (YouTube/Reference)</label>
                        <input
                          type="text"
                          value={editVideoUrl}
                          onChange={(e) => setEditVideoUrl(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => toggleTagSelection(tag.id)}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                                editTags.includes(tag.id)
                                  ? `${tag.color} border-transparent`
                                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <TagIcon size={14} />
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lyrics</label>
                            <button
                              type="button"
                              onClick={() => lyricsInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                              disabled={!!isOcrLoading}
                            >
                              {isOcrLoading === "lyrics" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <ImagePlus size={14} />
                              )}
                              <span>Upload Screenshot</span>
                            </button>
                            <input
                              type="file"
                              ref={lyricsInputRef}
                              onChange={(e) => handleImageUpload(e, "lyrics")}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                          <textarea
                            value={editLyrics}
                            onChange={(e) => setEditLyrics(e.target.value)}
                            rows={15}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-sans resize-none"
                            placeholder="Paste lyrics here..."
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chords</label>
                            <button
                              type="button"
                              onClick={() => chordsInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                              disabled={!!isOcrLoading}
                            >
                              {isOcrLoading === "chords" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <ImagePlus size={14} />
                              )}
                              <span>Upload Screenshot</span>
                            </button>
                            <input
                              type="file"
                              ref={chordsInputRef}
                              onChange={(e) => handleImageUpload(e, "chords")}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                          <textarea
                            value={editChords}
                            onChange={(e) => setEditChords(e.target.value)}
                            rows={15}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-mono text-sm resize-none"
                            placeholder="Paste chords here..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSong}
                          disabled={!editTitle.trim()}
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save size={18} />
                          Save Song
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedSong ? (
                  <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">{selectedSong.title}</h2>
                        {selectedSong.artist && (
                          <p className="text-lg text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                            {selectedSong.artist}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Added on {selectedSong.created_at ? new Date(selectedSong.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Unknown date"}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedSong.tags.map((tag) => (
                            <span key={tag.id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.color}`}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                        {selectedSong.video_url && (
                          <a
                            href={selectedSong.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium mb-4"
                          >
                            <Youtube size={18} />
                            Watch Reference Video
                            <ExternalLink size={14} className="opacity-50" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => openEditor(selectedSong)}
                          className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteSong(selectedSong.id)}
                          className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                        <button
                          onClick={() => setSelectedSong(null)}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors sm:ml-2"
                          title="Close"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                      <div className="col-span-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">
                          {activeTab === "lyrics" ? "Lyrics" : "Chords"}
                        </h3>
                        <pre className={`whitespace-pre-wrap overflow-x-auto ${activeTab === "chords" ? "font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-gray-700" : "font-sans text-gray-700 dark:text-gray-300 leading-relaxed text-base sm:text-lg"}`}>
                          {activeTab === "lyrics" ? selectedSong.lyrics || "No lyrics added." : selectedSong.chords || "No chords added."}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tag Filter Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <button
                        onClick={() => setSelectedTagId(null)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                          selectedTagId === null
                            ? "bg-indigo-600 text-white border-transparent"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        All Songs
                      </button>
                      {Array.isArray(tags) && tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                            selectedTagId === tag.id
                              ? `${tag.color} border-transparent shadow-sm`
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.isArray(songs) && songs.map((song) => (
                        <div
                          key={song.id}
                          onClick={() => setSelectedSong(song)}
                          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer group flex flex-col h-full"
                        >
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {song.title}
                            </h3>
                            {song.video_url && (
                              <Youtube size={16} className="text-red-500 shrink-0 mt-1" />
                            )}
                          </div>
                          {song.artist && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                              {song.artist}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider font-medium">
                            {song.created_at ? new Date(song.created_at).toLocaleDateString() : ""}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {Array.isArray(song.tags) && song.tags.slice(0, 3).map((tag) => (
                              <span key={tag.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tag.color}`}>
                                {tag.name}
                              </span>
                            ))}
                            {Array.isArray(song.tags) && song.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                +{song.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mt-auto">
                            {activeTab === "lyrics" ? song.lyrics : song.chords}
                          </p>
                        </div>
                      ))}
                      {(!Array.isArray(songs) || songs.length === 0) && (
                        <div className="col-span-full py-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 mb-4">
                            <Search size={32} />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No songs found</h3>
                          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

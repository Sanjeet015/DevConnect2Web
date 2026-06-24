import React, { useEffect, useState } from "react";
import { FiLogOut, FiUser, FiSettings, FiLock, FiFolder, FiTrash2, FiEdit3, FiGithub, FiExternalLink, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-hot-toast";

import { BASE_URL } from "../utils/constants";
import { addUser, removeUser } from "../utils/userSlice";

const Setting = () => {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "projects" | "security"

  // --- Tab 1: Profile States ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- Tab 2: Projects States ---
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    techStack: "",
    gitHubUrl: "",
    liveUrl: "",
  });
  const [loadingProjectSave, setLoadingProjectSave] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // --- Tab 3: Security States ---
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // --- Load Initial User Data ---
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setAbout(user.about || "");
    setAge(user.age || "");
    setPhotoUrl(user.photoUrl || "");
    setSkills(user.skills || []);
    setGender(user.gender || "");
  }, [user]);

  // --- Fetch My Projects (Triggered on Projects Tab active) ---
  const fetchMyProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await axios.get(`${BASE_URL}/project/my`, { withCredentials: true });
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your project portfolio");
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === "projects" && user) {
      fetchMyProjects();
    }
  }, [activeTab, user?._id]);

  // --- Tab 1 Handlers (Profile Update & Cloudinary Image Upload) ---
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("photo", file);

    const loadingToastId = toast.loading("Uploading image...");

    try {
      setUploadingImage(true);
      const res = await axios.post(`${BASE_URL}/profile/upload`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const secureUrl = res.data?.photoUrl;
      if (secureUrl) {
        setPhotoUrl(secureUrl);
        // Automatically save back to profile update
        const backendRes = await axios.patch(
          `${BASE_URL}/profile/update`,
          { firstName, lastName, photoUrl: secureUrl, about, age, skills, gender },
          { withCredentials: true }
        );
        dispatch(addUser(backendRes.data?.data));
        toast.success("Profile picture updated and saved successfully!", { id: loadingToastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload image.", { id: loadingToastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (uploadingImage) return toast.error("Please wait for the image upload to complete.");
    if (!firstName.trim()) return toast.error("First name is required.");

    try {
      const res = await axios.patch(
        `${BASE_URL}/profile/update`,
        { firstName, lastName, photoUrl, about, age, skills, gender },
        { withCredentials: true }
      );
      dispatch(addUser(res.data?.data));
      toast.success("Profile details updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Profile update failed.");
    }
  };

  const addSkill = (e) => {
    e.preventDefault();
    const skill = skillInput.trim();
    if (!skill) return;
    if (skills.includes(skill)) {
      setSkillInput("");
      return;
    }
    setSkills((prev) => [...prev, skill]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // --- Tab 2 Handlers (Projects Manager CRUD) ---
  const openEditProjectModal = (proj) => {
    setEditingProjectId(proj._id);
    setProjectData({
      title: proj.title || "",
      description: proj.description || "",
      techStack: proj.techStack ? proj.techStack.join(", ") : "",
      gitHubUrl: proj.gitHubUrl || "",
      liveUrl: proj.liveUrl || "",
    });
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setEditingProjectId(null);
    setProjectData({ title: "", description: "", techStack: "", gitHubUrl: "", liveUrl: "" });
  };

  const handleSaveProject = async () => {
    if (!projectData.title.trim() || !projectData.description.trim()) {
      return toast.error("Project title and description are required.");
    }

    try {
      setLoadingProjectSave(true);
      const rawTechStack = projectData.techStack;
      const techStackArray = typeof rawTechStack === "string"
        ? rawTechStack.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: projectData.title,
        description: projectData.description,
        techStack: techStackArray,
        gitHubUrl: projectData.gitHubUrl,
        liveUrl: projectData.liveUrl,
      };

      if (editingProjectId) {
        // Edit existing project
        const res = await axios.patch(`${BASE_URL}/project/${editingProjectId}`, payload, { withCredentials: true });
        const updated = res.data?.data || res.data;
        setProjects((prev) => prev.map((p) => (p._id === editingProjectId ? updated : p)));
        toast.success("Project updated successfully!");
      } else {
        // Create new project
        const res = await axios.post(`${BASE_URL}/project`, payload, { withCredentials: true });
        setProjects((prev) => [...prev, res.data?.data]);
        toast.success("Project published successfully!");
      }
      closeProjectModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save project.");
    } finally {
      setLoadingProjectSave(false);
    }
  };

  const executeDeleteProject = async () => {
    if (!deleteTargetId) return;
    try {
      await axios.delete(`${BASE_URL}/project/${deleteTargetId}`, { withCredentials: true });
      setProjects((prev) => prev.filter((p) => p._id !== deleteTargetId));
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete project");
    } finally {
      setDeleteTargetId(null);
    }
  };

  // --- Tab 3 Handlers (Security/Password Update) ---
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      return toast.error("Both password fields are required");
    }

    try {
      setUpdatingPassword(true);
      await axios.patch(`${BASE_URL}/profile/password`, passwords, { withCredentials: true });
      toast.success("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data || "Failed to change password. Make sure current password is correct.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 bg-[#f8fafc] min-h-screen font-sans">
      
      {/* Top Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#091e42] tracking-tight">Console Settings</h1>
          <p className="text-[#62718b] font-medium text-lg mt-1">Configure your developer profile and security tokens.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Tabs Sidebar (Vercel Style) */}
        <div className="w-full lg:w-64 bg-white border border-[#edf2f7] rounded-[24px] p-3 flex flex-row lg:flex-col gap-1.5 shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.01)] select-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "profile" ? "bg-[#0091ff]/8 text-[#0091ff] font-extrabold" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FiUser size={16} />
            <span>Developer Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "projects" ? "bg-[#0091ff]/8 text-[#0091ff] font-extrabold" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FiFolder size={16} />
            <span>Project Portfolio</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "security" ? "bg-[#0091ff]/8 text-[#0091ff] font-extrabold" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FiLock size={16} />
            <span>Console Security</span>
          </button>
        </div>

        {/* Right Active Panel Content */}
        <div className="flex-1 w-full bg-white border border-[#edf2f7] rounded-[32px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          {activeTab === "profile" && (
            <div className="animate-fade-in-up space-y-8">
              <div>
                <h3 className="text-xl font-bold text-[#091e42] tracking-tight">Profile Settings</h3>
                <p className="text-xs text-slate-400 mt-1">Configure your identity details visible on matches feeds.</p>
              </div>

              {/* Avatar upload panel */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="relative group w-20 h-20 shrink-0">
                  <img
                    src={photoUrl || "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full object-cover border bg-white shadow-sm"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer text-[9px] font-bold text-center p-1.5 select-none">
                    {uploadingImage ? "Uploading..." : "Upload 📷"}
                    <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleUpload} className="hidden" />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-800">Avatar Image</p>
                  <p className="text-slate-400 text-xs mt-1">Accepts PNG or JPG up to 5MB. Click on image to change photo file.</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" required className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Age</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="24" className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition text-slate-700 font-medium"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>

                {/* Skills manager */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Skills & Technologies</label>
                  <div className="flex gap-2">
                    <input type="text" value={skillInput} placeholder="React, Node.js, GraphQL..." onChange={(e) => setSkillInput(e.target.value)} className="flex-1 bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white" />
                    <button type="button" onClick={addSkill} className="px-5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">Add</button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 select-none">
                      {skills.map((skill) => (
                        <div key={skill} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100/50 text-xs font-bold animate-scale-up">
                          <span>{skill}</span>
                          <button type="button" onClick={() => removeSkill(skill)} className="text-red-500 hover:text-red-700 text-base cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Bio / Professional Summary</label>
                  <textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Full Stack dev looking to collaborate on developer workspace dashboards..." className="w-full p-3 bg-slate-50/30 border rounded-2xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white resize-none transition" />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={uploadingImage} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="animate-fade-in-up space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#091e42] tracking-tight">Project Portfolio</h3>
                  <p className="text-xs text-slate-400 mt-1">Publish projects to showcase on match details panels.</p>
                </div>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 cursor-pointer transition"
                >
                  <FiPlus /> Add Project
                </button>
              </div>

              {loadingProjects ? (
                <div className="py-20 flex items-center justify-center">
                  <span className="loading loading-spinner text-blue-500 loading-lg"></span>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center border-2 border-dashed rounded-[24px] py-16 space-y-4">
                  <p className="text-slate-400 text-xs font-semibold">Your portfolio is currently empty.</p>
                  <button onClick={() => setShowProjectModal(true)} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm">Publish First Project</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((proj) => (
                    <div key={proj._id} className="border border-[#edf2f7] rounded-3xl p-5 hover:shadow-md bg-white transition flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-base font-bold text-slate-800 truncate">{proj.title}</h4>
                          <div className="flex items-center gap-2 shrink-0 select-none">
                            <button onClick={() => openEditProjectModal(proj)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition"><FiEdit3 size={14} /></button>
                            <button onClick={() => setDeleteTargetId(proj._id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition"><FiTrash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{proj.description}</p>
                        {proj.techStack?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.techStack.map((tech) => (
                              <span key={tech} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">{tech}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-slate-50 mt-5">
                        {proj.gitHubUrl && (
                          <a href={proj.gitHubUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1"><FiGithub /> GitHub</a>
                        )}
                        {proj.liveUrl && (
                          <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1"><FiExternalLink /> Live Demo</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-fade-in-up space-y-8">
              <div>
                <h3 className="text-xl font-bold text-[#091e42] tracking-tight">Console Security</h3>
                <p className="text-xs text-slate-400 mt-1">Update passwords to maintain secure account session tokens.</p>
              </div>

              <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Current Password</label>
                  <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">New Password</label>
                  <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={updatingPassword} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition">
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Tab 2 Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl p-6 border border-slate-100 animate-scale-up max-h-[90vh] flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-[#091e42] mb-1">{editingProjectId ? "Edit Project Details" : "Publish Project Portfolio"}</h3>
              <p className="text-xs text-slate-400">Add detailed references to showcase your engineering expertise.</p>
            </div>

            <div className="space-y-4 my-6 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Project Title *</label>
                <input type="text" value={projectData.title} onChange={(e) => setProjectData({ ...projectData, title: e.target.value })} placeholder="DevConnect Workspace" required className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Description *</label>
                <textarea rows={4} value={projectData.description} onChange={(e) => setProjectData({ ...projectData, description: e.target.value })} placeholder="A real-time developer social community platform utilizing websockets and cookie rotations..." required className="w-full p-3 bg-slate-50/30 border rounded-2xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white resize-none transition" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Tech Stack (comma separated)</label>
                <input type="text" value={projectData.techStack} onChange={(e) => setProjectData({ ...projectData, techStack: e.target.value })} placeholder="React, Express.js, Socket.IO" className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">GitHub URL</label>
                  <input type="url" value={projectData.gitHubUrl} onChange={(e) => setProjectData({ ...projectData, gitHubUrl: e.target.value })} placeholder="https://github.com/..." className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Live URL</label>
                  <input type="url" value={projectData.liveUrl} onChange={(e) => setProjectData({ ...projectData, liveUrl: e.target.value })} placeholder="https://devconnect-workspace.com" className="w-full bg-slate-50/30 border rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
              <button onClick={closeProjectModal} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSaveProject} disabled={loadingProjectSave} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition">
                {loadingProjectSave ? "Saving..." : editingProjectId ? "Update Project" : "Publish Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 Delete Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Project</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">Are you sure you want to permanently delete this project? This action is irreversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold text-xs rounded-xl hover:bg-slate-50 transition">Keep Project</button>
              <button onClick={executeDeleteProject} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Setting;
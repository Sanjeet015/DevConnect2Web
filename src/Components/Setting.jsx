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

  const [activeTab, setActiveTab] = useState("profile"); 

  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  
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

  
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  
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
        
        const res = await axios.patch(`${BASE_URL}/project/${editingProjectId}`, payload, { withCredentials: true });
        const updated = res.data?.data || res.data;
        setProjects((prev) => prev.map((p) => (p._id === editingProjectId ? updated : p)));
        toast.success("Project updated successfully!");
      } else {
        
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
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 bg-slate-50 dark:bg-zinc-950 min-h-screen font-sans transition-colors">
      
      {}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#091e42] dark:text-zinc-150 tracking-tight">Console Settings</h1>
          <p className="text-[#62718b] dark:text-zinc-450 font-medium text-sm mt-1">Configure your developer profile and security tokens.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {}
        <div className="w-full lg:w-64 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[24px] p-3 flex flex-row lg:flex-col gap-1.5 shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.01)] select-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "profile" 
                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-100/50 dark:border-indigo-900/30" 
                : "text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850"
            }`}
          >
            <FiUser size={16} />
            <span>Developer Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "projects" 
                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-100/50 dark:border-indigo-900/30" 
                : "text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850"
            }`}
          >
            <FiFolder size={16} />
            <span>Project Portfolio</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "security" 
                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-100/50 dark:border-indigo-900/30" 
                : "text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850"
            }`}
          >
            <FiLock size={16} />
            <span>Console Security</span>
          </button>
        </div>

        {/* Right Active Panel Content */}
        <div className="flex-1 w-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          {activeTab === "profile" && (
            <div className="animate-fade-in-up space-y-8">
              <div>
                <h3 className="text-xl font-bold text-[#091e42] dark:text-zinc-200 tracking-tight">Profile Settings</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Configure your identity details visible on matches feeds.</p>
              </div>

              {/* Avatar upload panel */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800 rounded-2xl">
                <div className="relative group w-20 h-20 shrink-0">
                  <img
                    src={photoUrl || "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full object-cover border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer text-[9px] font-bold text-center p-1.5 select-none">
                    {uploadingImage ? "Uploading..." : "Upload 📷"}
                    <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleUpload} className="hidden" />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Avatar Image</p>
                  <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1.5">Accepts PNG or JPG up to 5MB. Click on image to change photo file.</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" required className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-800 dark:text-zinc-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-800 dark:text-zinc-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Age</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="24" className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-800 dark:text-zinc-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-700 dark:text-zinc-300 font-medium"
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
                  <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Skills & Technologies</label>
                  <div className="flex gap-2">
                    <input type="text" value={skillInput} placeholder="React, Node.js, GraphQL..." onChange={(e) => setSkillInput(e.target.value)} className="flex-1 bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950" />
                    <button type="button" onClick={addSkill} className="px-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">Add</button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 select-none">
                      {skills.map((skill) => (
                        <div key={skill} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/35 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30 text-xs font-bold animate-scale-up">
                          <span>{skill}</span>
                          <button type="button" onClick={() => removeSkill(skill)} className="text-rose-500 hover:text-rose-700 text-base cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Bio / Professional Summary</label>
                  <textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Full Stack dev looking to collaborate on developer workspace dashboards..." className="w-full p-3 bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 resize-none transition text-slate-800 dark:text-zinc-200" />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={uploadingImage} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition">
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
                  <h3 className="text-xl font-bold text-[#091e42] dark:text-zinc-200 tracking-tight">Project Portfolio</h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Publish projects to showcase on match details panels.</p>
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
                  <span className="loading loading-spinner text-indigo-600 dark:text-indigo-450 loading-lg"></span>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-[24px] py-16 space-y-4">
                  <p className="text-slate-450 dark:text-zinc-550 text-xs font-semibold">Your portfolio is currently empty.</p>
                  <button onClick={() => setShowProjectModal(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm">Publish First Project</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((proj) => (
                    <div key={proj._id} className="border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-md bg-white dark:bg-zinc-900/60 transition flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-base font-bold text-slate-800 dark:text-zinc-250 truncate">{proj.title}</h4>
                          <div className="flex items-center gap-2 shrink-0 select-none">
                            <button onClick={() => openEditProjectModal(proj)} className="p-2 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition cursor-pointer"><FiEdit3 size={14} /></button>
                            <button onClick={() => setDeleteTargetId(proj._id)} className="p-2 hover:bg-rose-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 rounded-xl transition cursor-pointer"><FiTrash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-3">{proj.description}</p>
                        {proj.techStack?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.techStack.map((tech) => (
                              <span key={tech} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold">{tech}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-zinc-800/80 mt-5 font-semibold text-xs">
                        {proj.gitHubUrl && (
                          <a href={proj.gitHubUrl} target="_blank" rel="noreferrer" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 flex items-center gap-1"><FiGithub /> GitHub</a>
                        )}
                        {proj.liveUrl && (
                          <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"><FiExternalLink /> Live Demo</a>
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
                <h3 className="text-xl font-bold text-[#091e42] dark:text-zinc-200 tracking-tight">Console Security</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Update passwords to maintain secure account session tokens.</p>
              </div>

              <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Current Password</label>
                  <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-800 dark:text-zinc-200" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">New Password</label>
                  <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-800 dark:text-zinc-200" />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={updatingPassword} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition">
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl w-full max-w-xl p-6 border border-slate-100 dark:border-zinc-800 animate-scale-up max-h-[90vh] flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-[#091e42] dark:text-zinc-150 mb-1">{editingProjectId ? "Edit Project Details" : "Publish Project Portfolio"}</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Add detailed references to showcase your engineering expertise.</p>
            </div>

            <div className="space-y-4 my-6 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Project Title *</label>
                <input type="text" value={projectData.title} onChange={(e) => setProjectData({ ...projectData, title: e.target.value })} placeholder="DevConnect Workspace" required className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-850 dark:text-zinc-200" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Description *</label>
                <textarea rows={4} value={projectData.description} onChange={(e) => setProjectData({ ...projectData, description: e.target.value })} placeholder="A real-time developer social community platform utilizing websockets and cookie rotations..." required className="w-full p-3 bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 resize-none transition text-slate-850 dark:text-zinc-200" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Tech Stack (comma separated)</label>
                <input type="text" value={projectData.techStack} onChange={(e) => setProjectData({ ...projectData, techStack: e.target.value })} placeholder="React, Express.js, Socket.IO" className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-855 dark:text-zinc-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">GitHub URL</label>
                  <input type="url" value={projectData.gitHubUrl} onChange={(e) => setProjectData({ ...projectData, gitHubUrl: e.target.value })} placeholder="https://github.com/..." className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-855 dark:text-zinc-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-655 dark:text-zinc-400 uppercase mb-2">Live URL</label>
                  <input type="url" value={projectData.liveUrl} onChange={(e) => setProjectData({ ...projectData, liveUrl: e.target.value })} placeholder="https://devconnect-workspace.com" className="w-full bg-slate-50/30 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-855 dark:text-zinc-200" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-50 dark:border-zinc-800/80">
              <button onClick={closeProjectModal} className="px-5 py-2.5 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition cursor-pointer">Cancel</button>
              <button onClick={handleSaveProject} disabled={loadingProjectSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer">
                {loadingProjectSave ? "Saving..." : editingProjectId ? "Update Project" : "Publish Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100 dark:border-zinc-800 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-1">Delete Project</h3>
            <p className="text-slate-400 dark:text-zinc-550 text-xs leading-relaxed mb-6 font-medium">Are you sure you want to permanently delete this project? This action is irreversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 border border-slate-200 dark:border-zinc-850 text-slate-500 dark:text-zinc-400 font-semibold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition cursor-pointer">Keep Project</button>
              <button onClick={executeDeleteProject} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Setting;
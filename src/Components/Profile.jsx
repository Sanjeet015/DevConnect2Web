import axios from "axios";
import { useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Profile = ({ viewedUser = null, isReadOnly = false }) => {
  const user = isReadOnly ? viewedUser : useSelector((store) => store.user);
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState(null);

  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    techStack: "",
    gitHubUrl: "",
    liveUrl: "",
  });
  const [loadingProject, setLoadingProject] = useState(false);

  const fetchProject = async () => {
    try {
      const targetUrl = isReadOnly 
        ? `${BASE_URL}/project/user/${user._id}` 
        : `${BASE_URL}/project/my`;

      const res = await axios.get(targetUrl, { withCredentials: true });
      setProjects(res?.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (project) => {
    if (isReadOnly) return;
    setEditingProjectId(project._id);
    setProjectData({
      title: project.title || "",
      description: project.description || "",
      techStack: project.techStack ? project.techStack.join(", ") : "",
      gitHubUrl: project.gitHubUrl || "",
      liveUrl: project.liveUrl || "",
    });
    setShowProjectModal(true);
  };

  const closeModal = () => {
    setShowProjectModal(false);
    setEditingProjectId(null);
    setProjectData({
      title: "",
      description: "",
      techStack: "",
      gitHubUrl: "",
      liveUrl: "",
    });
  };

  const handleSaveProject = async () => {
    if (isReadOnly) return;
    try {
      setLoadingProject(true);

      const rawTechStack = typeof projectData.techStack === "string" 
        ? projectData.techStack 
        : Array.isArray(projectData.techStack) 
          ? projectData.techStack.join(", ") 
          : "";

      const payload = {
        title: projectData.title,
        description: projectData.description,
        techStack: rawTechStack
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean),
        gitHubUrl: projectData.gitHubUrl,
        liveUrl: projectData.liveUrl,
      };

      if (editingProjectId) {
        const res = await axios.patch(
          `${BASE_URL}/project/${editingProjectId}`,
          payload,
          { withCredentials: true }
        );

        const updatedProject = res?.data?.data || res?.data;
        if (!updatedProject) throw new Error("No data received from update API");

        setProjects((prev) =>
          prev.map((p) => (p._id.toString() === editingProjectId.toString() ? { ...p, ...updatedProject } : p))
        );
      } else {
        const res = await axios.post(
          BASE_URL + "/project",
          payload,
          { withCredentials: true }
        );
        setProjects((prev) => [...prev, (res?.data?.data || res?.data)]);
      }

      closeModal();
    } catch (err) {
      console.error("Error saving/updating project:", err);
      const serverErrorMessage = err.response?.data?.message || err.message || "Unknown validation error occurred.";
      setErrorModalMessage(`Failed to save changes: ${serverErrorMessage}`);
    } finally {
      setLoadingProject(false);
    }
  };

  const executeDeleteProject = async () => {
    if (isReadOnly || !deleteTargetId) return;
    try {
      await axios.delete(`${BASE_URL}/project/${deleteTargetId}`, { withCredentials: true });
      setProjects((prev) => prev.filter((p) => p._id !== deleteTargetId));
    } catch (err) {
      console.error("Failed to delete project:", err);
      setErrorModalMessage("Could not delete this project. Please check network logs.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchProject();
    }
  }, [user?._id]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        <div className="flex flex-col items-center text-center p-8 border-b">
          <img
            src={user.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt={user.firstName}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <h1 className="mt-4 text-3xl font-bold text-gray-800">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-blue-600 font-semibold mt-2">{user.about}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span>Age: {user.age}</span>
            <span>•</span>
            <span>{user.gender}</span>
          </div>
          {!isReadOnly && (
            <Link to={"/setting"}>
              <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
                Edit Profile
              </button>
            </Link>
          )}
        </div>

        <div className="p-8 border-b">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Skills</h2>
          {user.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {user.skills.map((skill, index) => (
                <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No skills added yet.</p>
          )}
        </div>

        <div className="p-8 border-b">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Projects</h2> 
            {!isReadOnly && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                + Add Project
              </button>
            )}
          </div>

          {projects?.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project._id} className="border rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between bg-white w-full">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{project.title}</h3>
                      {!isReadOnly && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditModal(project)}
                            className="text-xs font-medium text-gray-500 hover:text-blue-600 px-2 py-1 hover:bg-blue-50 rounded-md transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(project._id)}
                            className="text-xs font-medium text-gray-500 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-md transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{project.description}</p>
                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {project.techStack.map((tech, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-5 pt-2 border-t border-gray-50">
                    {project.gitHubUrl && (
                      <a href={project.gitHubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium text-sm">
                        GitHub
                      </a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-medium text-sm">
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center border rounded-2xl py-10">
              <p className="text-gray-500">No projects added yet.</p>
              {!isReadOnly && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Your First Project
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div><p className="text-gray-500 text-sm">First Name</p><p className="font-medium">{user.firstName}</p></div>
            <div><p className="text-gray-500 text-sm">Last Name</p><p className="font-medium">{user.lastName}</p></div>
            <div><p className="text-gray-500 text-sm">Age</p><p className="font-medium">{user.age}</p></div>
            <div><p className="text-gray-500 text-sm">Gender</p><p className="font-medium">{user.gender}</p></div>
            <div><p className="text-gray-500 text-sm">Role</p><p className="font-medium">{user.about}</p></div>
          </div>
        </div>

      </div>

      {!isReadOnly && showProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl my-auto flex flex-col max-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-center p-6 border-b border-gray-200/60">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProjectId ? "Edit Project" : "Add Project"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl transition-colors leading-none">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  placeholder="DevConnect"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  placeholder="Developer networking platform..."
                  rows={4}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tech Stack</label>
                <input
                  type="text"
                  value={projectData.techStack}
                  onChange={(e) => setProjectData({ ...projectData, techStack: e.target.value })}
                  placeholder="React, Node.js, MongoDB"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={projectData.gitHubUrl}
                    onChange={(e) => setProjectData({ ...projectData, gitHubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Live URL</label>
                  <input
                    type="url"
                    value={projectData.liveUrl}
                    onChange={(e) => setProjectData({ ...projectData, liveUrl: e.target.value })}
                    placeholder="https://yourproject.com"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200/60 bg-gray-100/70 rounded-b-3xl">
              <button onClick={closeModal} className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-sm">
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={loadingProject}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl shadow-sm"
              >
                {loadingProject ? "Saving..." : editingProjectId ? "Update Project" : "Save Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isReadOnly && deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to permanently delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={executeDeleteProject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {!isReadOnly && errorModalMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-t-4 border-red-500">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-50 text-red-600 p-2 rounded-full font-bold text-lg leading-none">⚠️</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Operation Error</h3>
                <p className="text-gray-600 text-sm mt-1 break-words">{errorModalMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModalMessage(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
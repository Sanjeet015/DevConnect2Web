import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { Link } from "react-router-dom";
import { FiGithub, FiExternalLink, FiSettings } from "react-icons/fi";

const Profile = ({ viewedUser = null, isReadOnly = false }) => {
  // If no viewedUser is passed, use the currently logged-in user
  const currentUser = useSelector((store) => store.user);
  const user = viewedUser || currentUser;

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchUserProjects = async () => {
    if (!user?._id) return;
    try {
      setLoadingProjects(true);
      const targetUrl = viewedUser 
        ? `${BASE_URL}/project/user/${user._id}` 
        : `${BASE_URL}/project/my`;

      const res = await axios.get(targetUrl, { withCredentials: true });
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err.message);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchUserProjects();
  }, [user?._id]);

  if (!user) {
    return (
      <div className="w-full min-h-[85vh] flex justify-center items-center">
        <span className="loading loading-spinner text-[#0091ff] loading-lg"></span>
      </div>
    );
  }

  const isOwnProfile = !viewedUser || viewedUser._id === currentUser?._id;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 bg-[#f8fafc] min-h-screen font-sans animate-fade-in-up">
      {/* Portfolio Card Sheet */}
      <div className="bg-white border border-[#edf2f7] rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        
        {/* Profile Backdrop / Meta section */}
        <div className="flex flex-col items-center text-center p-8 sm:p-12 border-b border-slate-100 bg-slate-50/20">
          <div className="relative">
            <img
              src={user.photoUrl || "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl bg-white"
            />
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-800 tracking-tight">
            {user.firstName} {user.lastName}
          </h1>

          <span className="mt-1.5 text-xs bg-blue-50 text-[#0091ff] font-bold px-3 py-1 rounded-md tracking-wide uppercase select-none border border-blue-100/30">
            {user.gender || "Developer"}
          </span>

          <p className="text-slate-500 font-medium text-sm mt-4 max-w-md leading-relaxed">
            {user.about || "This developer hasn't published a profile biography summary yet."}
          </p>

          <div className="flex items-center gap-4 mt-5 text-xs font-bold text-slate-400 select-none">
            {user.age && <span>{user.age} Years Old</span>}
            {user.age && <span>•</span>}
            <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString([], { month: "short", year: "numeric" })}</span>
          </div>

          {isOwnProfile && (
            <Link to="/setting">
              <button className="mt-6 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer">
                <FiSettings size={13} />
                <span>Configure Profile Settings</span>
              </button>
            </Link>
          )}
        </div>

        {/* Skills Tag Cloud */}
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-xs uppercase font-black tracking-wider text-slate-400 mb-4 select-none">Core Technologies</h2>
          {user.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2 select-none">
              {user.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-400">No technology stacks listed yet.</p>
          )}
        </div>

        {/* Projects Portfolio Grid */}
        <div className="p-8">
          <h2 className="text-xs uppercase font-black tracking-wider text-slate-400 mb-6 select-none">Published Projects</h2>

          {loadingProjects ? (
            <div className="py-12 flex justify-center">
              <span className="loading loading-spinner text-blue-500 loading-md"></span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl select-none">
              <p className="text-xs font-semibold text-slate-400">No projects published in this portfolio.</p>
              {isOwnProfile && (
                <Link to="/setting">
                  <button className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition">Publish First Project</button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="border border-slate-100 rounded-3xl p-5 hover:shadow-md bg-white transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{project.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{project.description}</p>
                    
                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1 select-none">
                        {project.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-50 mt-5 select-none">
                    {project.gitHubUrl && (
                      <a
                        href={project.gitHubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5"
                      >
                        <FiGithub size={13} />
                        <span>GitHub</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1.5"
                      >
                        <FiExternalLink size={13} />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
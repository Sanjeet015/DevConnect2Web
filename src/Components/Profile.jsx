import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { Link } from "react-router-dom";
import { FiGithub, FiExternalLink, FiSettings, FiGrid, FiFolder } from "react-icons/fi";

const Profile = ({ viewedUser = null, isReadOnly = false }) => {
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
      <div className="w-full min-h-[85vh] flex justify-center items-center bg-slate-50 dark:bg-zinc-950">
        <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400 loading-lg"></span>
      </div>
    );
  }

  const isOwnProfile = !viewedUser || viewedUser._id === currentUser?._id;


  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-8 bg-slate-50 dark:bg-zinc-950 min-h-screen font-sans animate-fade-in-up transition-colors">
      
      {}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
        
        {}
        <div className="flex flex-col items-center text-center p-8 sm:p-12 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-900/10">
          <div className="relative">
            <img
              src={user.photoUrl || "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-xl bg-white dark:bg-zinc-900"
            />
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-800 dark:text-zinc-150 tracking-tight">
            {user.firstName} {user.lastName}
          </h1>

          <span className="mt-2 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 rounded-md tracking-wider uppercase select-none">
            {user.gender || "Developer"}
          </span>

          <p className="text-slate-500 dark:text-zinc-400 font-medium text-sm mt-4 max-w-md leading-relaxed">
            {user.about || "This developer hasn't published a profile biography summary yet."}
          </p>

          <div className="flex items-center gap-4 mt-5 text-xs font-bold text-slate-400 dark:text-zinc-500 select-none">
            {user.age && <span>{user.age} Years Old</span>}
            {user.age && <span>•</span>}
            <span>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString([], { month: "short", year: "numeric" })}</span>
          </div>

          {isOwnProfile && (
            <Link to="/setting" className="mt-6">
              <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                <FiSettings size={13} />
                <span>Configure Settings</span>
              </button>
            </Link>
          )}
        </div>


        {}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-zinc-800/80 mt-2">
          <h2 className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-1.5 select-none">
            <FiGrid className="text-indigo-500" />
            Core Technologies
          </h2>
          {user.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2 select-none">
              {user.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3.5 py-1.5 bg-slate-50 dark:bg-zinc-850 border border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold shadow-xs hover:border-indigo-500/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-450 dark:text-zinc-500">No technology stacks listed yet.</p>
          )}
        </div>

        {}
        <div className="p-6 md:p-8">
          <h2 className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-zinc-500 mb-6 flex items-center gap-1.5 select-none">
            <FiFolder className="text-indigo-500" />
            Portfolio Case Studies
          </h2>

          {loadingProjects ? (
            <div className="py-12 flex justify-center">
              <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400 loading-md"></span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-150 dark:border-zinc-800 rounded-[24px] select-none">
              <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">No projects published in this portfolio.</p>
              {isOwnProfile && (
                <Link to="/setting">
                  <button className="mt-4 px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-250 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer">
                    Publish First Project
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-[0_8px_35px_rgba(0,0,0,0.04)] bg-white dark:bg-zinc-900/60 transition duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 line-clamp-1">{project.title}</h3>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-3 font-medium">{project.description}</p>
                    
                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1 select-none">
                        {project.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-zinc-800/80 mt-5 select-none font-semibold">
                    {project.gitHubUrl && (
                      <a
                        href={project.gitHubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-250 text-xs flex items-center gap-1.5 transition"
                      >
                        <FiGithub size={13} />
                        <span>Repository</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs flex items-center gap-1.5 transition"
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
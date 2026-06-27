import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaHeart, FaGithub } from "react-icons/fa";
import { FiX, FiExternalLink } from "react-icons/fi";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";
import toast from "react-hot-toast";
import Profile from "./Profile"; 

function UserCard({ user }) {
  if (!user) return null;
  const dispatch = useDispatch();
  const [swipeDirection, setSwipeDirection] = useState(null); 
  const [activeTab, setActiveTab] = useState("about"); 
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  
  const fetchUserProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await axios.get(`${BASE_URL}/project/user/${user._id}`, { withCredentials: true });
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === "projects") {
      fetchUserProjects();
    }
  }, [activeTab, user._id]);

  
  useEffect(() => {
    setActiveTab("about");
    setProjects([]);
    setShowViewModal(false);
  }, [user._id]);

  
  
  const executeAction = useCallback(async (status) => {
    setSwipeDirection(status === "Interested" ? "right" : "left");
    
    
    setTimeout(async () => {
      try {
        await axios.post(
          `${BASE_URL}/request/send/${status}/${user._id}`,
          {},
          { withCredentials: true }
        );
        dispatch(removeUserFromFeed(user._id));
        setSwipeDirection(null);
      } catch (err) {
        console.error(err);
        toast.error("Action failed");
        setSwipeDirection(null);
      }
    }, 350);
  }, [user._id, dispatch]);

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (swipeDirection) return; 
      if (showViewModal) return; 
      
      
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "ArrowLeft") {
        executeAction("Ignored");
      } else if (e.key === "ArrowRight") {
        executeAction("Interested");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user._id, swipeDirection, showViewModal]);

  return (
    <div className="w-full max-w-sm md:max-w-4xl mx-auto my-4 px-4 select-none relative h-[84vh] md:h-[75vh] flex flex-col justify-between">
      {}
      <div
        onDoubleClick={() => setShowViewModal(true)}
        className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-none flex-1 flex flex-col md:flex-row transition-all duration-300 relative cursor-pointer ${
          swipeDirection === "left"
            ? "animate-swipe-left"
            : swipeDirection === "right"
            ? "animate-swipe-right"
            : "hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:border-zinc-750"
        }`}
        title="Double click to inspect developer profile"
      >
        {}
        {swipeDirection === "right" && (
          <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center z-25 transition-all duration-200">
            <span className="border-4 border-emerald-500 text-emerald-500 font-black text-2xl uppercase px-6 py-2.5 rounded-2xl tracking-widest rotate-[-12deg]">
              Interested
            </span>
          </div>
        )}
        {swipeDirection === "left" && (
          <div className="absolute inset-0 bg-rose-500/10 backdrop-blur-xs flex items-center justify-center z-25 transition-all duration-200">
            <span className="border-4 border-rose-500 text-rose-500 font-black text-2xl uppercase px-6 py-2.5 rounded-2xl tracking-widest rotate-[12deg]">
              Ignore
            </span>
          </div>
        )}

        {}
        <div className="w-full md:w-2/5 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 shrink-0">
          {}
          <div className="relative h-28 md:h-40 shrink-0 bg-slate-900 overflow-hidden">
            {}
            <img
              src={user.photoUrl}
              alt="Cover backdrop"
              className="w-full h-full object-cover blur-md opacity-40 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/20" />
          </div>

          {/* Circular Avatar Overlapping the Banner */}
          <div className="px-5 -mt-12 md:-mt-16 relative z-10 shrink-0 flex md:justify-center">
            <img
              src={user.photoUrl}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md bg-white dark:bg-zinc-900 select-none"
            />
          </div>

          {/* Developer Header Info Block */}
          <div className="px-5 pt-3 pb-4 md:pb-8 md:text-center shrink-0 flex-grow flex flex-col justify-center">
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 dark:text-zinc-100 flex items-center md:justify-center gap-2">
              <span>{user.firstName} {user.lastName}</span>
              {user.age && <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{user.age}</span>}
            </h2>
            
            <div className="flex items-center md:justify-center gap-1.5 mt-1 flex-wrap">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {user.gender || "Developer"}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-100/50 dark:border-indigo-900/30">
                Open to Collab
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details (Tab Switcher + Dynamic content) */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Segment Controller Tab Switcher */}
          <div className="mx-5 my-4 p-1 bg-slate-100/80 dark:bg-zinc-850 border border-slate-200/30 dark:border-zinc-800/20 rounded-xl flex gap-1 select-none shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("about");
              }}
              className={`flex-grow py-1.5 text-center text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "about"
                  ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              About & Skills
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("projects");
              }}
              className={`flex-grow py-1.5 text-center text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "projects"
                  ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              Portfolio Projects
            </button>
          </div>

          {/* Card Main Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0 bg-slate-50/20 dark:bg-zinc-900/10">
            {activeTab === "about" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-450 dark:text-zinc-500 mb-1.5">About Developer</h4>
                  <p className="text-xs font-medium text-slate-650 dark:text-zinc-350 leading-relaxed">
                    {user.about || "This developer hasn't written a biography description summary yet."}
                  </p>
                </div>

                {user.skills?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-455 dark:text-zinc-500 mb-2">Core Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 text-[11px] font-bold rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 hover:bg-indigo-50/10 transition-all cursor-default"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-3.5 animate-fade-in-up">
                {loadingProjects ? (
                  <div className="py-8 flex justify-center">
                    <span className="loading loading-spinner text-[#0091ff] loading-md"></span>
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 py-8 text-center">No projects published by this developer.</p>
                ) : (
                  projects.map((proj) => (
                    <div key={proj._id} className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-1">{proj.title}</h5>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 px-2 py-0.5 rounded-md">Project</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{proj.description}</p>
                      <div className="flex gap-4 text-[10px] font-bold pt-1 border-t border-slate-50 dark:border-zinc-850">
                        {proj.gitHubUrl && (
                          <a href={proj.gitHubUrl} target="_blank" rel="noreferrer" className="text-slate-650 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 flex items-center gap-1.5 transition-colors">
                            <FaGithub size={12} /> GitHub
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                            <FiExternalLink size={12} /> Live Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons with Keyboard Tooltips */}
      <div className="flex gap-4 mt-4 shrink-0 px-4">
        {/* Ignore Button */}
        <button
          onClick={() => executeAction("Ignored")}
          disabled={swipeDirection}
          className="flex-1 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-md hover:shadow-lg dark:hover:bg-zinc-850 transition-all duration-200 hover:bg-slate-50 active:scale-95 flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-50 text-slate-700 dark:text-zinc-300"
          title="Press ArrowLeft key"
        >
          <FiX size={18} className="text-rose-500 transition-transform duration-200 group-hover:scale-120 group-hover:rotate-90" />
          <span className="font-bold text-xs">Ignore</span>
          <span className="hidden sm:inline-block text-[8px] bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-md font-mono select-none">←</span>
        </button>

        {/* Interested Button */}
        <button
          onClick={() => executeAction("Interested")}
          disabled={swipeDirection}
          className="flex-1 h-12 rounded-2xl bg-slate-900 dark:bg-indigo-600 shadow-md hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:bg-indigo-500 transition-all duration-200 hover:bg-black active:scale-95 flex items-center justify-center gap-2 cursor-pointer group text-white disabled:opacity-50"
          title="Press ArrowRight key"
        >
          <FaHeart size={14} className="text-rose-500 transition-transform duration-200 group-hover:scale-125" />
          <span className="font-bold text-xs">Interested</span>
          <span className="hidden sm:inline-block text-[8px] bg-white/10 border border-white/10 dark:border-white/5 px-1.5 py-0.5 rounded-md font-mono select-none">→</span>
        </button>
      </div>

      {}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl my-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 border dark:border-zinc-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowViewModal(false);
              }}
              className="absolute top-6 right-6 text-gray-400 dark:text-zinc-500 hover:text-gray-650 dark:hover:text-zinc-300 text-3xl font-light z-10 cursor-pointer"
            >
              &times;
            </button>
            <Profile viewedUser={user} isReadOnly={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default UserCard;
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import { useEffect, useState } from "react";
import UserCard from "./UserCard";
import { FiRefreshCw, FiCompass } from "react-icons/fi";
import toast from "react-hot-toast";

const Feed = () => {
  const dispatch = useDispatch();
  const feed = useSelector((store) => store.feed);
  const [loading, setLoading] = useState(false);

  const getFeed = async (showToastAlert = false) => {
    try {
      setLoading(true);
      const res = await axios.get(BASE_URL + "/user/feed", { withCredentials: true });
      dispatch(addFeed(res?.data?.data || []));
      if (showToastAlert) toast.success("Refreshed matching queue!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load developers feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feed || feed.length === 0) {
      getFeed();
    }
  }, [feed]);

  if (loading && (!feed || feed.length === 0)) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 transition-colors">
        {}
        <div className="w-full max-w-sm md:max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/5 space-y-4">
              <div className="h-48 md:h-64 rounded-2xl skeleton-shimmer"></div>
              <div className="h-6 w-2/3 rounded-md skeleton-shimmer mx-auto"></div>
            </div>
            <div className="flex-1 space-y-4 py-2">
              <div className="h-4 w-1/3 rounded-md skeleton-shimmer"></div>
              <div className="h-3 w-full rounded-md skeleton-shimmer"></div>
              <div className="h-3 w-5/6 rounded-md skeleton-shimmer"></div>
              <div className="h-3 w-4/5 rounded-md skeleton-shimmer"></div>
              <div className="flex gap-2 pt-4">
                <div className="h-8 w-16 rounded-md skeleton-shimmer"></div>
                <div className="h-8 w-20 rounded-md skeleton-shimmer"></div>
                <div className="h-8 w-16 rounded-md skeleton-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 animate-scale-up">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FiCompass size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-150">You've Seen Everyone!</h3>
            <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1.5 leading-relaxed font-semibold max-w-xs mx-auto">
              Match requests sent successfully. Check back later for new developer profiles or refresh the feed.
            </p>
          </div>
          <button
            onClick={() => getFeed(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 transition-colors">
      <UserCard user={feed[0]} />
    </div>
  );
};

export default Feed;

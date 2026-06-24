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
      <div className="w-full min-h-[85vh] flex items-center justify-center p-4">
        {/* Shimmering Deck skeleton */}
        <div className="w-full max-w-sm md:max-w-md bg-white border rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="h-64 rounded-2xl skeleton-shimmer"></div>
          <div className="space-y-3">
            <div className="h-4 w-2/3 rounded-md skeleton-shimmer"></div>
            <div className="h-3 w-full rounded-md skeleton-shimmer"></div>
            <div className="h-3 w-5/6 rounded-md skeleton-shimmer"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-12 flex-1 rounded-xl skeleton-shimmer"></div>
            <div className="h-12 flex-1 rounded-xl skeleton-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-[32px] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 animate-scale-up">
          <div className="w-16 h-16 bg-blue-50 text-[#0091ff] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FiCompass size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">You've Seen Everyone!</h3>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-semibold max-w-xs mx-auto">
              Match requests sent successfully. Check back later for new developer profiles or refresh the feed.
            </p>
          </div>
          <button
            onClick={() => getFeed(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0091ff] hover:bg-[#007be6] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 cursor-pointer transition disabled:bg-slate-200 disabled:text-slate-400"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center p-4">
      <UserCard user={feed[0]} />
    </div>
  );
};

export default Feed;
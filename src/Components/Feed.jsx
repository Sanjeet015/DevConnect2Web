import axios from "axios";
import { FaHeart, FaTimes } from "react-icons/fa";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import { useEffect } from "react";
import UserCard from "./UserCard";

const Feed = () => {
  const dispatch = useDispatch();
  const feed = useSelector((store)=>store.feed);
  const getFeed = async ()=>{
    try {
      const res = await axios.get(BASE_URL+"/user/feed",{withCredentials:true});
      dispatch(addFeed(res?.data?.data));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(()=>{
    if(!feed || feed.length === 0){
      getFeed();
    }
  },[feed]);

  if (!feed || feed.length === 0) {
    return (
      <div className="w-full text-center py-20 bg-[#f8fafc] min-h-screen">
        <p className="text-[#62718b] font-semibold text-xl">
          You've seen everyone! Check back later for more profiles. ✨
        </p>
      </div>
    );
  }
  return(
    <div>
      <UserCard user={feed[0]}/>
    </div>
  )
};

export default Feed;
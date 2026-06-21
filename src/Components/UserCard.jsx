import axios from "axios";
import { FaHeart } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { BASE_URL } from "../utils/constants";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";

function UserCard({ user, onActionComplete }) {
  if (!user) return null;
  const dispatch = useDispatch();
  const handleReviewRequest = async (status,toUserId)=>{
    try {
      const res = await axios.post(`${BASE_URL}/request/send/${status}/${toUserId}`,{},{withCredentials:true});
      dispatch(removeUserFromFeed(user._id));
    } catch (err) {
      console.log(err.message);
    }
  }
  return (
    <div className="w-full max-w-xs md:max-w-sm lg:max-w-md mx-auto my-3 px-4">
      {/* Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
        {/* Image Section */}
        <div className="relative h-[55vh] sm:h-[60vh] md:h-[65vh]">
          <img
            src={user.photoUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {user.firstName} {user.lastName}
              {user.age && (
                <span className="ml-2 font-medium text-xl sm:text-2xl">
                  {user.age}
                </span>
              )}
            </h2>

            {user.about && (
              <p className="mt-2 text-sm sm:text-base text-white/90 line-clamp-2">
                {user.about}
              </p>
            )}

            {user.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {user.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 text-xs rounded-full bg-white/20 backdrop-blur-md border border-white/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4">
          <button className="text-blue-600 text-sm font-medium decoration-0 cursor-pointer">
            View Full Profile →
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          className="
            flex-1
            h-12 sm:h-14
            rounded-2xl
            bg-white
            border
            border-gray-200
            shadow-md
            hover:bg-gray-50
            transition
            flex
            items-center
            justify-center
            gap-2
          "
          onClick={()=>handleReviewRequest("Ignored",user._id)}
        >
          <FiX size={20} className="text-red-500" />
          <span className="font-medium">Ignore</span>
        </button>

        <button
          className="
            flex-1
            h-12 sm:h-14
            rounded-2xl
            bg-blue-500
            text-white
            shadow-md
            hover:bg-blue-600
            transition
            flex
            items-center
            justify-center
            gap-2
          "
          onClick={()=>handleReviewRequest("Interested",user._id)}
        >
          <FaHeart />
          <span className="font-medium">Interested</span>
        </button>
      </div>
    </div>
  );
}

export default UserCard;
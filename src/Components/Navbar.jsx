import { FiBell } from "react-icons/fi";
import { HiOutlineCodeBracket } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function Navbar() {
  const user = useSelector((store)=>store.user);
  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      
      {/* Logo */}
      {user ? (
        <Link to={"/"}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <HiOutlineCodeBracket size={18} />
            </div>

            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              Dev<span className="text-blue-600">Connect</span>
            </h1>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2" title="Log in to go home">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-60">
            <HiOutlineCodeBracket size={18} />
          </div>

          <h1 className="text-lg md:text-xl font-bold text-gray-800 opacity-60">
            Dev<span className="text-blue-600">Connect</span>
          </h1>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* Notifications */}
        {/* <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <FiBell size={20} className="text-gray-700" />

          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </button> */}

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          {user && (<img
            src={user.photoUrl}
            alt="Profile"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
          />)}

          {/* Hide on mobile */}
          {user && 
          (<div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">
              {user.firstName+" "+user.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {user.about}
            </p>
          </div>) }
        </div>
      </div>
    </nav>
  );
}
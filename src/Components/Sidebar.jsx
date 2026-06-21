import {
  FiHome,
  FiUserPlus,
  FiUsers,
  FiMessageSquare,
  FiUser,
  FiSettings,
} from "react-icons/fi";
import { RiGroupLine } from "react-icons/ri";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white flex-col gap-2 p-4">
        <Link to="/">
          <NavItem icon={<FiHome />} text="Feed" />
        </Link>

        <Link to="/requests">
          <NavItem icon={<FiUserPlus />} text="Requests" />
        </Link>

        <Link to="/connections">
          <NavItem icon={<FiUsers />} text="Connections" />
        </Link>

        <Link to="/messages">
          <NavItem icon={<FiMessageSquare />} text="Messages" />
        </Link>

        <Link to="/groups">
          <NavItem icon={<RiGroupLine />} text="Groups" />
        </Link>

        <Link to="/profile">
          <NavItem icon={<FiUser />} text="Profile" />
        </Link>

        <Link to="/setting">
          <NavItem icon={<FiSettings />} text="Settings" />
        </Link>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 z-50">
        <Link to="/">
          <FiHome size={22} />
        </Link>

        <Link to="/requests">
          <FiUserPlus size={22} />
        </Link>

        <Link to="/connections">
          <FiUsers size={22} />
        </Link>

        <Link to="/messages">
          <FiMessageSquare size={22} />
        </Link>

        <Link to="/messages">
          <RiGroupLine size={22} />
        </Link>

        <Link to="/profile">
          <FiUser size={22} />
        </Link>

        <Link to="/setting">
          <FiSettings size={22} />
        </Link>
      </div>
    </>
  );
}

function NavItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition cursor-pointer">
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

export default Sidebar;
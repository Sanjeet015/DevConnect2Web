import { useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from 'react-hot-toast';

import { BASE_URL } from "../utils/constants";
import { addUser, removeUser } from "../utils/userSlice";

const Setting = () => {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [about, setAbout] = useState(user?.about || "");
  const [age, setAge] = useState(user?.age || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || "");



  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState(user?.skills || []);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });


  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.patch(
        BASE_URL + "/profile/update",{
          firstName,
          lastName,
          photoUrl,
          about,
          age,
          skills,
        }
        ,
        { withCredentials: true }
      );
      dispatch(addUser(res?.data?.data));
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.patch(
        BASE_URL + "/profile/password",
        passwords,
        { withCredentials: true }
      );
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(err?.response?.data || "Something went wrong");
    }
  };

  const addSkill = (e) => {
    e?.preventDefault();

    const skill = skillInput.trim();
    if (!skill) return;

    if (skills.includes(skill)) {
      setSkillInput("");
      return;
    }

    setSkills((s) => [...s, skill]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove) => {
    setSkills((s) => s.filter((sk) => sk !== skillToRemove));
  };

  // sync local state when user loads/changes
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setAbout(user.about || "");
    setAge(user.age || "");
    setPhotoUrl(user.photoUrl || "");
    setSkills(user.skills || []);
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post(
        BASE_URL + "/logout",
        {},
        {
          withCredentials: true,
        }
      );

      dispatch(removeUser());

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Settings
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Profile Section */}
       <div className="bg-white border border-gray-200 rounded-[32px] shadow-sm p-6 md:p-10 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Edit Profile
          </h2>

          {/* Profile Preview */}
            <div className="flex flex-col items-center mb-8">
            <img
              src={
                photoUrl || user?.photoUrl ||
                "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"
              }
              alt="Profile"
              className="
                w-24
                h-24
                rounded-full
                object-cover
                border-4
                border-white
                shadow-lg
              "
            />

            <p className="text-sm text-gray-500 mt-3">
              Profile Preview
            </p>
          </div>

          <form
            onSubmit={handleProfileUpdate}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* First Name */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                First Name
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="
                  w-full
                  h-11
                  px-3
                  rounded-xl
                  border
                  border-gray-200
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Last Name
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="
                  w-full
                  h-11
                  px-3
                  rounded-xl
                  border
                  border-gray-200
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Age
              </label>

              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="
                  w-full
                  h-11
                  px-3
                  rounded-xl
                  border
                  border-gray-200
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            {/* Profile URL */}
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Profile Photo URL
              </label>

              <input
                type="text"
                value={photoUrl}
                placeholder="https://example.com/photo.jpg"
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="
                  w-full
                  h-11
                  px-3
                  rounded-xl
                  border
                  border-gray-200
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-2">
                Skills
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  placeholder="React, Node.js, MongoDB..."
                  onChange={(e) =>
                    setSkillInput(e.target.value)
                  }
                  className="
                    flex-1
                    h-11
                    px-3
                    rounded-xl
                    border
                    border-gray-200
                    shadow-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-100
                    focus:border-blue-400
                  "
                />

                <button
                  type="button"
                  onClick={addSkill}
                  className="
                    px-4
                    rounded-xl
                    bg-blue-500
                    hover:bg-blue-600
                    text-white
                    font-medium
                    transition
                  "
                >
                  Add
                </button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      className="
                        flex
                        items-center
                        gap-2
                        px-3
                        py-1.5
                        rounded-full
                        bg-blue-50
                        text-blue-700
                        border
                        border-blue-100
                        text-sm
                      "
                    >
                      <span>{skill}</span>

                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-red-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-2">
                About
              </label>

              <textarea
                rows={1}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="
                  w-full
                  p-3
                  rounded-2xl
                  border
                  border-gray-200
                  shadow-sm
                  resize-none
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            {/* Save Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="
                  px-5
                  h-11
                  bg-blue-500
                  hover:bg-blue-600
                  text-white
                  rounded-xl
                  font-medium
                  shadow-md
                  transition
                "
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white border border-gray-200 rounded-[32px] shadow-sm p-6 md:p-10 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Change Password
          </h2>

          <p className="text-gray-500 mb-8">
            Update your password to keep your account secure.
          </p>

          <form
            onSubmit={handlePasswordUpdate}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Current Password
              </label>

              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
                className="
                  w-full
                  h-10
                  px-3
                  rounded-xl
                  border
                  border-gray-200
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">
                New Password
              </label>

              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    newPassword: e.target.value,
                  })
                }
                className="
                  w-full
                  h-10
                  px-3
                  rounded-xl
                  border
                  border-gray-200
                  shadow-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-100
                  focus:border-blue-400
                  transition
                "
              />
            </div>

            

            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="
                  px-4
                  h-10
                  bg-blue-500
                  hover:bg-blue-600
                  text-white
                  rounded-2xl
                  font-medium
                  shadow-md
                  transition
                "
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Logout Section */}
        <div className="border-t border-gray-200/50 pt-6">
          <button
            onClick={handleLogout}
            className="
              group
              flex
              items-center
              justify-center
              gap-2
              px-5
              py-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              text-red-600
              hover:bg-red-100
              hover:border-red-300
              transition-all
              duration-200
              w-full
              sm:w-auto
            "
          >
            <FiLogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />

            <span className="font-medium">
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setting;
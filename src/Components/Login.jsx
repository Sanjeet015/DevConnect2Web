import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import toast from "react-hot-toast";

const Login = () => {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error,setError] = useState("");
  const [isLogin,setIsLogin] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(BASE_URL+"/login",{
        emailId,
        password,
      },{
        withCredentials:true
      })
      toast.success("Login successfull")
      dispatch(addUser(res.data.data))
      navigate("/")
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    }
  };

  const handleSignUp = async(e)=>{
    e.preventDefault();
    try {
      const res = await axios.post(BASE_URL+"/signup",{
        firstName,
        lastName,
        emailId,
        password
      },{
        withCredentials:true
      });
      toast.success("Signup successfull")
      dispatch(addUser(res.data.data));
      navigate("/setting");
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 bg-base-200 my-4">
      <div className="w-full max-w-md">
        <div className="bg-base-100 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8">
          
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">
              Dev<span className="text-blue-500">Connect</span>
            </h1>

            <p className="text-sm sm:text-base text-base-content/60 mt-2">
              Connect with developers worldwide
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5">
            {!isLogin && <>
              <div>
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm font-semibold opacity-80">
                    FirstName
                  </span>
                </label>

                <input
                  type="text"
                  value={firstName}
                  placeholder="Enter your firstName"
                  className="input p-2 input-bordered rounded-xl shadow-sm focus:outline-1 focus:border-gray-200 w-full h-11 sm:h-12"
                  onChange={(e)=>setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm font-semibold opacity-80">
                    LastName
                  </span>
                </label>

                <input
                  type="text"
                  value={lastName}
                  placeholder="Enter your lastName"
                  className="input p-2 input-bordered rounded-xl shadow-sm focus:outline-1 focus:border-gray-200 w-full h-11 sm:h-12"
                  onChange={(e)=>setLastName(e.target.value)}
                />
              </div>
            </>}

            <div>
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm font-semibold opacity-80">
                  Email
                </span>
              </label>

              <input
                type="email"
                value={emailId}
                placeholder="Enter your email"
                className="input p-2 input-bordered rounded-xl shadow-sm focus:outline-1 focus:border-gray-200 w-full h-11 sm:h-12"
                onChange={(e)=>setEmailId(e.target.value)}
              />
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text text-xs sm:text-sm font-semibold opacity-80">
                  Password
                </span>
              </label>

              <input
                type="password"
                value={password}
                placeholder="Enter your password"
                className="input p-2 input-bordered rounded-xl shadow-sm focus:outline-1 focus:border-gray-200 w-full h-11 sm:h-12"
                onChange={(e)=>setPassword(e.target.value)}
              />
            </div>
            <p className="text-red-500">{error}</p>
            <button className="btn bg-blue-500 hover:bg-blue-600 border-none rounded-xl text-white w-full h-11 sm:h-12 text-sm sm:text-base" onClick={isLogin?handleLogin:handleSignUp}>
              {isLogin?"Login":"Signup"}
            </button>
          </form>

          <p className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-base-content/70">
            <span className="opacity-70">{isLogin?"New to DevConnect?":"Already have an account?"}</span>{" "}
            <span className="text-blue-500 cursor-pointer font-medium hover:underline" onClick={()=>setIsLogin(!isLogin)}>
              {isLogin?"Sign Up":"Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from "./Components/Navbar"
import Login from "./Components/Login"
import Profile from "./Components/Profile"
import Body from "./Components/Body"
import { Provider } from "react-redux"
import appStore from "./utils/appStore"
import Feed from "./Components/Feed"
import Setting from "./Components/Setting"
import { Toaster } from 'react-hot-toast';
import Connections from "./Components/Connections"
import Requests from "./Components/Requests"
import Messages from "./Components/Messages"
import Groups from "./Components/Groups"
import GroupWorkspace from "./Components/GroupWorkspace"
import Search from "./Components/Search"

function App() {

  return (
    <>
      <Provider store={appStore}>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<Body />}>
              <Route path="/" element={<Feed/>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/profile" element={<Profile/>}/>
              <Route path="/setting" element={<Setting/>}/>
              <Route path="/connections" element={<Connections/>}/>
              <Route path="/requests" element={<Requests/>}/>
              <Route path="/messages" element={<Messages/>}/>
              <Route path="/groups" element={<Groups/>}/>
              <Route path="/group/:groupId" element={<GroupWorkspace/>}/>
              <Route path="/search" element={<Search/>}/>
            </Route>
            
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  )
}

export default App

import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import HomePage from './pages/home/HomePage'
import SignUpPage from './pages/auth/SignUpPage'
import Sidebar from './components/common/Sidebar'
import RightPanel from './components/common/RightPanel'
import NotificationPage from './pages/notification/NotificationPage'
import ProfilePage from './pages/profile/ProfilePage'
import { Toaster } from "react-hot-toast";
import { useQuery } from '@tanstack/react-query'
import { baseUrl } from './constant/url'
import LoadingSpinner from './components/common/LoadingSpinner'
import FollowPage from './pages/profile/FollowPage'
import SearchPage from './pages/search/SearchPage'
import MessagePage from './pages/messages/MessagePage'
import ConversationPage from './pages/messages/ConversationPage'


const App = () => {
  const { data: authUser, isLoading } = useQuery({
		// we use queryKey to give a unique name to our query and refer to it later
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await fetch(`${baseUrl}/api/auth/me`,{
          method: "GET",
          credentials:"include",
          headers:{
            "Content-Type":"application/json"
          }
        });
				const data = await res.json();
				if (data.error) return null;
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
			
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		retry: false,
	});

	if (isLoading) {
		return (
			<div className='h-screen flex justify-center items-center'>
				<LoadingSpinner size='lg' />
			</div>
		);
	}

  return (
    <div className='flex max-w-6xl mx-auto'>
    {authUser && <Sidebar />}
    <Routes>
      <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
				<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
				<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />} />
				<Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' />} />
				<Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
				<Route path='/users/:id/:type' element={authUser ? <FollowPage /> : <Navigate to='/login' />} />
				<Route path='/search' element={authUser ? <SearchPage /> : <Navigate to='/' />} />
				<Route path='/messages' element={authUser ? <MessagePage /> : <Navigate to='/' />} />
				<Route path='/messages/:username' element={authUser ? <ConversationPage /> : <Navigate to='/' />} />
			</Routes>
     {authUser && <RightPanel />}
    <Toaster />
    </div>
  )
}

export default App
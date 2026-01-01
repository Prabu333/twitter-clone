import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import XSvg from "../../components/svgs/x";

import { FaUser } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdPassword } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { baseUrl } from "../../constant/url";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const LoginPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	 const navigate = useNavigate(); 

	const [showPassword, setShowPassword] = useState(false);
     const queryClient =useQueryClient()

	const {mutate: login,isError,isPending, error} = useMutation({
		
		mutationFn: async ({ username, password }) => {
			try {
		
				const res = await fetch(`${baseUrl}/api/auth/login`, {
					method: "POST",
					credentials:"include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ username, password }),
				});
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			// refetch the authUser
		    queryClient.invalidateQueries({ queryKey: ["authUser"] });
			toast.success("Login Sucess")
			navigate("/");   
		},


	})

	const handleSubmit = (e) => {
		e.preventDefault();
		login(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};


	return (
		<div className='max-w-screen-xl mx-auto flex h-screen'>
			<div className='flex-1 hidden lg:flex items-center  justify-center'>
				<XSvg className='lg:w-2/3 fill-white' />
			</div>
			<div className='flex-1 flex flex-col justify-center items-center'>
				<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
					<XSvg className='w-24 lg:hidden fill-white' />
					<h1 className='text-4xl font-extrabold text-white'>{"Let's"} go.</h1>
					<label className='input input-bordered rounded flex items-center gap-2'>
						<FaUser />
						<input
							type='text'
							className='grow'
							placeholder='username'
							name='username'
							onChange={handleInputChange}
							value={formData.username}
						/>
					</label>

					<label className="input input-bordered rounded flex items-center gap-2 group">
  <MdPassword />

  <input
    type={showPassword ? "text" : "password"}
    className="grow"
    placeholder="Password"
    name="password"
    onChange={handleInputChange}
    value={formData.password}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="
      opacity-0
      group-hover:opacity-100
      group-focus-within:opacity-100
      transition-opacity
      text-gray-400
      hover:text-gray-200
    "
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</label>

					<button className='btn rounded-full btn-primary text-white' disabled={isPending}>
						{isPending ? <LoadingSpinner /> : "Login"}</button>
					{isError && <p className='text-red-500'>{error.message}</p>}
				</form>
				<div className='flex flex-col gap-2 mt-4'>
					<p className='text-white text-lg'>{"Don't"} have an account?</p>
					<Link to='/signup'>
						<button className='btn rounded-full btn-primary text-white btn-outline w-full'>Sign up</button>
					</Link>
				</div>
			</div>
		</div>
	);
};
export default LoginPage;
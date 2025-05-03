import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import { ArrowLeft, Camera } from "react-feather";
import { useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useAppStore } from "../../store";
import { colors, getColor } from "../../../lib/utils";
import { FaTrash, FaPlus } from "react-icons/fa";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { apiClient } from "../../../lib/api-client";
import { UPDATE_PROFILE_ROUTE } from "../../../utils/constants";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [image, setImage] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(userInfo.profileSetup){
      setFirstName(userInfo.firstName)
      setLastName(userInfo.lastName)
      setSelectedColor(userInfo.color)
    }
  }, [userInfo])
  

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setProfileImage(reader.result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };
  const validateProfile = () => {
    if (!firstName) {
      toast.error("First Name is required");
      return false;
    }
    if (!lastName) {
      toast.error("Last Name is required");
      return false;
    }
    return true;
  };
  const saveChanges = async () => {
    if (!validateProfile()) return;
  
    setLoading(true); // start loading
    try {
      const response = await apiClient.post(
        UPDATE_PROFILE_ROUTE,
        { firstName, lastName, color: selectedColor },
        { withCredentials: true }
      );
  
      if (response.status === 200 && response.data) {
        setUserInfo({ ...response.data });
        toast.success("Profile Updated Successfully");
        navigate("/chat");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false); // stop loading
    }
  };
  

  return (
    <>
      {/* <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <button className="text-white">
          <ArrowLeft size={24} />
        </button>

        <div className="flex justify-center">
          <div
            className="relative w-24 h-24 rounded-full bg-pink-700 flex items-center justify-center text-3xl text-pink-100 shadow-lg overflow-hidden group cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              "K"
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Input 
            type="email" 
            placeholder="asdfgh@gmail.com" 
            className="bg-[#1c1c2a] text-white placeholder:text-gray-400 border-none focus:ring-2 focus:ring-pink-700"
          />
          <Input 
            type="text" 
            placeholder="First Name" 
            className="bg-[#1c1c2a] text-white placeholder:text-gray-400 border-none focus:ring-2 focus:ring-pink-700"
          />
          <Input 
            type="text" 
            placeholder="Second Name" 
            className="bg-[#1c1c2a] text-white placeholder:text-gray-400 border-none focus:ring-2 focus:ring-pink-700"
          />
        </div>

        <div className="flex justify-center space-x-4 pt-2">
          <div className="w-6 h-6 rounded-full bg-pink-700 border-2 border-white"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-400"></div>
          <div className="w-6 h-6 rounded-full bg-green-400"></div>
          <div className="w-6 h-6 rounded-full bg-cyan-400"></div>
        </div>
      </div>
    </div> */}
      <div className="bg-[#1b1c24] h-[100vh] flex items-center justify-center flex-col gap-10">
        <div className="flex flex-col gap-10 w-[80vw] md:w-max">
          <div>
            <IoMdArrowRoundBack className="text-4xl lg:text-4xl text-white/90 cursor-pointer" />
          </div>
          <div className="grid grid-cols-2">
            <div
              className="h-full w-32 md:w-48 md:h-48 relative flex items-center justify-center "
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Avatar className="h-32 w-32 md:w-full md:h-full rounded-full overflow-hidden">
                {image ? (
                  <AvatarImage
                    src={image}
                    alt="profile"
                    className="object-cover bg-black w-full h-full"
                  />
                ) : (
                  <div
                    className={`uppercase relative h-32 md:w-full md:h-full text-5xl border-[1px] flex items-center justify-center rounded-full text-white ${getColor(
                      selectedColor
                    )}`}
                  >
                    {firstName
                      ? firstName.split("")[0]
                      : userInfo.email.split("")[0]}
                  </div>
                )}
              </Avatar>
              {hovered && (
                <div className=" absolute inset-0 top-0 w-full h-full flex items-center justify-center bg-black/50 ring-fuchsia-50 rounded-full">
                  {image ? (
                    <FaTrash className="text-white text-3xl cursor-pointer" />
                  ) : (
                    <FaPlus className="text-white text-3xl cursor-pointer" />
                  )}
                </div>
              )}
            </div>
            <div className="flex min-w-32 md:min-w-64 flex-col gap-5 text-white items-center justify-center">
              <div className="w-full">
                <Input
                  placeholder="Email"
                  type="email"
                  disabled
                  value={userInfo.email}
                  className="rounded-ld p-6 bg-[#2c2e3b] border-none "
                />
              </div>
              <div className="w-full">
                <Input
                  placeholder="First Name"
                  type="text"
                  onChange={(e) => setFirstName(e.target.value)}
                  value={firstName}
                  className="rounded-ld p-6 bg-[#2c2e3b] border-none "
                />
              </div>
              <div className="w-full">
                <Input
                  placeholder="Second Name"
                  type="text"
                  onChange={(e) => setLastName(e.target.value)}
                  value={lastName}
                  className="rounded-ld p-6 bg-[#2c2e3b] border-none "
                />
              </div>
              <div className="w-full flex gap-5">
                {colors.map((color, index) => (
                  <div
                    className={`${color} h-8 w-8 rounded-full cursor-pointer transition-all duration-300
                      ${
                        selectedColor === index
                          ? " outline-white/50 outline-1"
                          : ""
                      }
                      
                      `}
                    key={index}
                    onClick={() => setSelectedColor(index)}
                  ></div>
                ))}
              </div>

              <div className="w-full">
                <Button
                  className="h-16 w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
                  onClick={saveChanges}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

import React, { useEffect, useRef, useState } from "react";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import { ArrowLeft, Camera, User, Mail, Palette, Upload, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if(userInfo.profileSetup){
      setFirstName(userInfo.firstName)
      setLastName(userInfo.lastName)
      setSelectedColor(userInfo.color)
      setUsername(userInfo.username || "")
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
    if (username && !/^[a-z0-9_\.]{3,20}$/.test(username)) {
      setUsernameError("3-20 chars. Use letters, numbers, _ or .");
      return false;
    }
    setUsernameError("");
    return true;
  };
  const saveChanges = async () => {
    if (!validateProfile()) return;
  
    setLoading(true); // start loading
    try {
      const response = await apiClient.post(
        UPDATE_PROFILE_ROUTE,
        { firstName, lastName, color: selectedColor, username: username?.trim() || undefined },
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center mb-8 animate-fadeInUp">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/chat")}
              className="mr-4 hover:bg-white/10 dark:hover:bg-gray-800/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Complete Your Profile
            </h1>
          </div>

          {/* Main Profile Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 animate-fadeInUp">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div
                    className="w-48 h-48 relative flex items-center justify-center cursor-pointer transition-all duration-300 transform group-hover:scale-105"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    <Avatar className="w-full h-full rounded-full border-4 border-white shadow-xl">
                      {image ? (
                        <AvatarImage
                          src={image}
                          alt="profile"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div
                          className={`w-full h-full text-6xl font-bold flex items-center justify-center rounded-full text-white ${getColor(
                            selectedColor
                          )}`}
                        >
                          {firstName
                            ? firstName[0].toUpperCase()
                            : userInfo.email[0].toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    
                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                      {image ? (
                        <div className="flex flex-col items-center space-y-2">
                          <FaTrash className="text-white text-2xl" />
                          <span className="text-white text-sm">Remove</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="text-white w-8 h-8" />
                          <span className="text-white text-sm">Upload Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <Palette className="w-5 h-5" />
                    <span className="font-medium">Choose Avatar Color</span>
                  </div>
                  <div className="flex justify-center space-x-3">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(index)}
                        className={`w-10 h-10 rounded-full transition-all duration-300 transform hover:scale-110 ${color} ${
                          selectedColor === index
                            ? 'ring-4 ring-gray-300 ring-offset-2 scale-110'
                            : 'hover:ring-2 hover:ring-gray-200 hover:ring-offset-1'
                        }`}
                      >
                        {selectedColor === index && (
                          <Check className="w-5 h-5 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </label>
                    <Input
                      type="email"
                      value={userInfo.email}
                      disabled
                      className="h-12 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <span>First Name</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <span>Last Name</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <span>Username</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Choose a unique username (e.g. john_doe)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 ${usernameError ? 'border-red-500' : ''}`}
                    />
                    {usernameError && (
                      <p className="text-xs text-red-500">{usernameError}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="flex-1 h-12 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveChanges}
                    disabled={loading || !firstName.trim() || !lastName.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>Complete Profile</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* Progress Indicator */}
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      You're one step away from joining the conversation!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

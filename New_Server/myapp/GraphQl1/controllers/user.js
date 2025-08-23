import User from "../model/User.js";

export const getAllUsers = async () => {
    const users = await User.find()
    // console.log("uerser: ", users)
    return users;
}
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// store
import { useAppStore } from "../../store";

const Chat = () => {
  const { userInfo } = useAppStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!userInfo.profileSetup) {
      toast("Please setup profile to continue.");
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  return <>Chat</>;
};

export default Chat;

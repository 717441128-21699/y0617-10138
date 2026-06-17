import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Square from "@/pages/Square";
import CreatePost from "@/pages/CreatePost";
import PostDetail from "@/pages/PostDetail";
import Pets from "@/pages/Pets";
import PetDetail from "@/pages/PetDetail";
import PetForm from "@/pages/PetForm";
import QA from "@/pages/QA";
import QADetail from "@/pages/QADetail";
import AskQuestion from "@/pages/AskQuestion";
import Health from "@/pages/Health";
import Nearby from "@/pages/Nearby";
import PlaceDetail from "@/pages/PlaceDetail";
import SubmitPlace from "@/pages/SubmitPlace";
import Profile from "@/pages/Profile";
import { useAuthStore } from "@/store/auth";

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/square" element={<Square />} />
        <Route path="/post/create" element={<CreatePost />} />
        <Route path="/post/:postId" element={<PostDetail />} />
        
        <Route path="/pets" element={<Pets />} />
        <Route path="/pets/new" element={<PetForm />} />
        <Route path="/pets/:petId" element={<PetDetail />} />
        <Route path="/pets/:petId/edit" element={<PetForm />} />
        
        <Route path="/qa" element={<QA />} />
        <Route path="/qa/ask" element={<AskQuestion />} />
        <Route path="/qa/:questionId" element={<QADetail />} />
        
        <Route path="/health" element={<Health />} />
        
        <Route path="/nearby" element={<Nearby />} />
        <Route path="/nearby/submit" element={<SubmitPlace />} />
        <Route path="/nearby/:placeId" element={<PlaceDetail />} />
        
        <Route path="/profile/:userId" element={<Profile />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

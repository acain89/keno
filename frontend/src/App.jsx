import { BrowserRouter, Routes, Route } from "react-router-dom";
import KenoGame from "./KenoGame";
import Login from "./pages/Login";
import "./keno.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KenoGame />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

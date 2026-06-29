import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login";
import Shop from "./shop";
import Profile from "./profile";
import AdminInventory from "./AdminInventory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

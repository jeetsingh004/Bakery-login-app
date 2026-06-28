import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login";
import Shop from "./shop";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Shop />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

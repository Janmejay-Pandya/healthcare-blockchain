import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";  // Import Navbar
import Profile from "./pages/Profile";    // Import your pages
import Home from "./pages/Home";          
import AddDoctor from "./pages/AddDoctor"; 

const App = () => {
    return (
        <>
            <Navbar /> {/* ✅ Navbar added at the top */}
            <div className="container mx-auto p-4"> {/* Optional container for styling */}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/add-doctor" element={<AddDoctor />} />
                </Routes>
            </div>
        </>
    );
};

export default App;

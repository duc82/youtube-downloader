import { Link } from "react-router-dom";
import logo from "../assets/react.svg";

export default function Header() {
  return (
    <header className="h-16 px-4 flex items-center justify-between bg-gradient-to-r from-purple-700 to-indigo-700 text-white container mx-auto">
      <Link to="/" className="flex items-center space-x-2">
        <img src={logo} alt="React Logo" className="h-8" />
        <span className="text-lg font-medium">Youtube Downloader</span>
      </Link>
    </header>
  );
}

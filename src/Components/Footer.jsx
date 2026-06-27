import { FaGithub, FaLinkedin } from "react-icons/fa6";

function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 py-4 sm:py-5">
      <div className="flex flex-col items-center gap-3 px-4">
        <p className="text-xs sm:text-sm text-gray-500 text-center">
          Made with ❤️ by Sanjeet Soni
        </p>

        <div className="flex items-center gap-6 text-lg sm:text-xl">
          <a
            href="https://github.com/Sanjeet015"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-black transition-all duration-200 hover:scale-110"
          >
            <FaGithub />
          </a>

          <a
            href="https://www.linkedin.com/in/sanjeet-soni/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-blue-600 transition-all duration-200 hover:scale-110"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
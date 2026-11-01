import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const Home = () => {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <h1 className="mb-4 text-4xl font-bold md:text-6xl">
        Welcome to Auth System
      </h1>

      <p className="mb-8 max-w-xl text-slate-300">
        A secure authentication application built with React,
        Express.js, and MongoDB.
      </p>

      {user ? (
        <Link
          to="/dashboard"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-slate-950"
          >
            Register
          </Link>
        </div>
      )}
    </main>
  );
};

export default Home;
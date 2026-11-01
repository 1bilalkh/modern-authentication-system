import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.get(
        `/auth/verify-email?token=${encodeURIComponent(token)}`
      );

      setMessage(
        response.data.message || "Email verified successfully."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Email verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center text-slate-900 shadow-xl">
        <h1 className="mb-3 text-3xl font-bold">
          Verify Your Email
        </h1>

        <p className="mb-6 text-slate-500">
          Click the button below to verify your email address.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {message}
          </div>
        )}

        {!token ? (
          <p className="mb-6 text-sm text-red-600">
            Verification token is missing.
          </p>
        ) : (
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        )}

        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
};

export default VerifyEmail;
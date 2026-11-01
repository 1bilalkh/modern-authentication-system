import { useAuth } from "../context/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Welcome back, {user?.name || "User"}.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="rounded-2xl bg-white p-8 text-slate-900 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold">
            Account Information
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="font-semibold">
                {user?.name || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-semibold">
                {user?.email || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Role</p>
              <p className="font-semibold">
                {user?.role || "User"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Email Verification
              </p>

              <p className="font-semibold text-green-600">
                Verified
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
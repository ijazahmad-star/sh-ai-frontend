// "use client";

// import { signIn } from "next-auth/react";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function SignInPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleEmailSignIn = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setIsLoading(true);

//     try {
//       const result = await signIn("credentials", {
//         email,
//         password,
//         redirect: false,
//       });

//       if (result?.error) {
//         setError("Invalid email or password");
//         setIsLoading(false);
//         return;
//       }

//       router.push("/dashboard");
//     } catch (error) {
//       setError("Something went wrong");
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
//             Sign in to your account
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
//             SH AI Assistance
//           </p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleEmailSignIn}>
//           <div className="rounded-md shadow-sm -space-y-px">
//             <div>
//               <label htmlFor="email" className="sr-only">
//                 Email address
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm bg-white dark:bg-zinc-800"
//                 placeholder="Email address"
//               />
//             </div>
//             <div>
//               <label htmlFor="password" className="sr-only">
//                 Password
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 autoComplete="current-password"
//                 required
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm bg-white dark:bg-zinc-800"
//                 placeholder="Password"
//               />
//             </div>
//           </div>

//           {error && (
//             <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
//               <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
//             </div>
//           )}

//           <div>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? "Signing in..." : "Sign in"}
//             </button>
//           </div>
//         </form>

//         <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
//           Contact your administrator for account creation
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Footer from "@/components/Footer";

import lightLogo from "@/public/SH-Logos.png";
import darkLogo from "@/public/SH-Logos-1.png";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setError("Something went wrong");
      setIsLoading(false);
    }
  }, [email, password, router]);

  return (
    <div className="min-h-screen py-4 bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
      <div className="container min-w-screen">
        <header className="py-4">
          <h1 className="text-4xl text-center sm:text-5xl font-extrabold text-black dark:text-white">
            Smart SH AI Assistant
          </h1>
          <p className="mt-3 text-center text-base text-red-600 dark:text-red-500 font-semibold">
            Secure. Smart. Intelligent.
          </p>
        </header>

        <main className="mt-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4">

          <div className="flex flex-col items-center justify-center lg:w-1/2 max-w-md">
          <>
            <Image
              src={lightLogo}
              alt="SH Logo"
              className="rounded-full block dark:hidden"
              width={350}
              height={350}
              priority
            />
            <Image
              src={darkLogo}
              alt="SH Logo (dark)"
              className="rounded-full hidden dark:block"
              width={350}
              height={350}
              priority
            />
          </>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold text-black dark:text-white">
                SH AI Assistant
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Intelligent solutions for your daily tasks
              </p>
            </div>
          </div>

          {/* Vertical Divider - Hidden on mobile */}
          <div className="hidden lg:block h-96 w-px bg-gray-300 dark:bg-gray-700"></div>

          {/* Horizontal Divider - Visible on mobile */}
          <div className="lg:hidden w-3/4 h-px bg-gray-300 dark:bg-gray-700 my-4"></div>

          <div className="lg:w-1/2 max-w-md">
            <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-black dark:text-white text-center">
                  Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  Sign in to continue
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    placeholder="Your password"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Contact your administrator for account creation
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

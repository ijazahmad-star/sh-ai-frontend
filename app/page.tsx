"use client";

import { Search, Brain, FileText, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import lightLogo from "../public/SH-Logos.png";
import darkLogo from "../public/SH-Logos-1.png";
import Footer from "@/components/Footer";

import FeatureCard from "@/components/homepage/FeatureCard";
import ChatMessage from "@/components/homepage/ChatMessage";

export default function HomePage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/auth/signin");
  };

  const handleButtonClick = () => {
    router.push("/auth/signin");
  };
  return (
    <div className="min-h-screen py-4 bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900 font-sans">
      <div className="w-full">
        <header className="py-4 justify-center flex flex-col items-center">
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
          <div className="flex justify-center mt-6">
            <Link
              href="/auth/signin"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </header>

        <main className="mt-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center lg:w-1/2 max-w-md">
            <div className="mt-6 text-center">
              <h1 className="text-4xl text-center sm:text-5xl font-extrabold text-black dark:text-white">
                Smart SH AI Assistant
              </h1>
              <p className="mt-3 text-center text-base text-red-600 dark:text-red-500 font-semibold">
                Secure. Smart. Intelligent.
              </p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Harness the power of Retrieval-Augmented Generation to create
                intelligent, context-aware AI systems.
              </p>
            </div>
          </div>

          {/* Vertical Divider - Hidden on mobile */}
          <div className="hidden lg:block h-96 w-px bg-gray-300 dark:bg-gray-700"></div>

          {/* Horizontal Divider - Visible on mobile */}
          <div className="lg:hidden w-3/4 h-px bg-gray-300 dark:bg-gray-700 my-4"></div>

          {/* Chat UI Section */}
          <div className="lg:w-1/2 max-w-md">
            <div className="card bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-zinc-700 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  AI Assistant
                </span>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                <ChatMessage
                  isUser={true}
                  content="What are the latest developments for Strategusthub (SH)?"
                />
                <ChatMessage
                  isUser={false}
                  content="The latest developments at StrategistHub (SH) emphasize a strong commitment to innovation and growth through AI-driven digital solutions. The company is focused on streamlining workflows, enhancing decision-making, and creating new opportunities for businesses."
                  sources={[
                    "Innovation Focus",
                    "Expert Team",
                    "Client Partnerships",
                  ]}
                />
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-3 w-full"
                >
                  <div className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl px-4 py-3">
                    <input
                      type="text"
                      placeholder="Ask anything..."
                      className="w-full bg-transparent text-gray-900 dark:text-white text-sm outline-none placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>

        {/* Feature Grid */}
        <section id="features" className="py-12 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our RAG platform combines cutting-edge retrieval mechanisms with
              sophisticated generation capabilities to deliver enterprise-grade
              AI solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={Search}
              title="Semantic Search"
              description="Advanced vector search capabilities that understand context and meaning, not just keywords. Find relevant information across vast knowledge bases with unprecedented accuracy."
            />
            <FeatureCard
              icon={Brain}
              title="Contextual Generation"
              description="Generate responses that are grounded in your specific data sources. Our AI understands context and provides nuanced answers tailored to your domain knowledge."
            />
            <FeatureCard
              icon={FileText}
              title="Source Citations"
              description="Every response includes verifiable source citations, ensuring transparency and enabling users to validate information. Build trust with traceable AI-generated content."
            />
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

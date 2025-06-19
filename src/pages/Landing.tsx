
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

const features = [
  {
    emoji: "🤖",
    title: "AI Debates",
    description:
      "Sharpen your skills by debating advanced AI opponents that adapt to your arguments and rhetorics.",
  },
  {
    emoji: "🥊",
    title: "User vs User",
    description:
      "Challenge real users in live debate battles and climb up the ranks. Engage real minds.",
  },
  {
    emoji: "📊",
    title: "Performance Analytics",
    description:
      "Receive instant, actionable feedback on your structure, clarity, and persuasiveness—visualized.",
  },
  {
    emoji: "🏆",
    title: "Leaderboard",
    description:
      "Compete globally and see how you stack up against top debaters! Become a legend.",
  },
];

const gradientBg = "bg-gradient-to-br from-primary/80 via-accent/40 to-background";
const accentShape = "absolute rounded-full opacity-30 blur-2xl pointer-events-none mix-blend-lighten";

const Landing: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSignUp = () => navigate("/auth?signup=1");
  const handleSignIn = () => navigate("/auth");

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12 ${gradientBg}`}>
      {/* Animated/Decorative Background Shapes */}
      <div className={`${accentShape} w-[440px] h-[440px] bg-primary top-[-120px] left-[-120px] animate-float`}></div>
      <div className={`${accentShape} w-[320px] h-[280px] bg-gradient-to-br from-accent to-secondary right-[-100px] top-1/3 animate-float`} style={{ animationDelay: "1.2s" }}></div>
      <div className={`${accentShape} w-[200px] h-[140px] bg-muted bottom-10 left-1/2 animate-float`} style={{ animationDelay: "2.4s" }}></div>
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up w-full">
          <h1 className="text-6xl sm:text-7xl font-extrabold gradient-text tracking-tighter drop-shadow-lg mb-4 font-sans" style={{ lineHeight: "1.04" }}>
            Debatrix
          </h1>
          <p className="text-xl sm:text-2xl max-w-3xl mx-auto text-muted-foreground font-medium animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <span className="bg-card/70 px-4 py-2 rounded-xl shadow-sm inline-block">
              The immersive debate platform powered by AI.<br />
              Elevate your skills, compete, and master the art&nbsp;of&nbsp;argument.
            </span>
          </p>
        </div>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up" style={{ animationDelay: "0.22s" }}>
          <Button
            onClick={handleSignUp}
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto animate-glow drop-shadow-lg"
          >
            <UserPlus className="mr-2" size={22} />
            Sign Up
          </Button>
          <Button
            onClick={handleSignIn}
            className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto drop-shadow"
            variant={"secondary"}
          >
            <LogIn className="mr-2" size={22} />
            Sign In
          </Button>
        </div>
        {/* Features */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mb-20">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className={`card-feature p-7 pt-10 flex flex-col items-center justify-between text-center bg-card/80 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 border border-primary/20 animate-fade-in`}
              style={{ animationDelay: `${0.28 + idx * 0.08}s` }}
            >
              <div className="text-5xl mb-3 drop-shadow-xl">{feature.emoji}</div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        {/* Extra Section: Call to Action */}
        <div className="w-full max-w-2xl text-center mt-2 mb-16">
          <div className="card-modern py-8 px-6 sm:px-12 bg-background/90 border border-primary/30 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-200 animate-fade-in" style={{animationDelay: "0.6s"}}>
            <span className="text-2xl font-bold text-primary block mb-2">🚀 Ready to level up your debating?</span>
            <span className="text-muted-foreground leading-relaxed">
              Join Debatrix. Debates are smarter, faster, more insightful—thanks&nbsp;to&nbsp;AI.
            </span>
          </div>
        </div>
        {/* Footer */}
        <footer className="relative z-10 w-full text-center text-sm pt-10 pb-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()} <b>Debatrix</b> &middot; Master the art of argument
            </span>
            <span className="text-muted-foreground/70 text-xs">Built with AI, passion, and modern web tech</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;

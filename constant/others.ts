
export const authStaticData = {
   login: {
    title: "Welcome Back",
    subtitle: "Please enter your details to sign in.",
    btnText: "Sign In",
    footerText: "Don't have an account?",
    footerLinkText: "Create free account",
    footerLink: "/signup",
    forgotpasswordLink:"/forgot-password"
  },
  register: {
    title: "Create Account",
    subtitle: "Start your spiritual journey with us today.",
    btnText: "Create Account",
    footerText: "Already have an account?",
    footerLinkText: "Sign in",
    footerLink: "/login"
  },
  forgotPassword: {
    title: "Forgot Password?",
    subtitle: "No worries! Enter your email and we will send you reset instructions.",
    btnText: "Send Reset Link",
    backLinkText: "Back to Log In",
    backLink: "/login",
    successMessage: "If an account exists for that email, we have sent password reset instructions."
  },
  resetNewPassword: {
    title: "Set New Password",
    subtitle: "Your new password must be different from previously used passwords.",
    btnText: "Reset Password",
    successMessage: "Password reset successfully! You can now login."
  }
};

// constant/promos.ts

export const promoBanners = [
    {
        id: 1,
        title: "Florida to Dhaka Exclusive",
        subTitle: "Special Fares Alert",
        image: "https://flibismilla.vercel.app/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1542627088-6603b66e5c54%3Fq%3D80%26w%3D1000&w=1920&q=75",
        link: "/contact", 
        description: "Unbeatable prices for FLL to DAC. Limited seats available for upcoming season.",
        color: "from-blue-600 to-blue-400"
    },
    {
        id: 2,
        title: "Ramadan Umrah Package",
        subTitle: "Spiritual Journey",
        image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1000",
        link: "/package/ramadan-umrah",
        description: "Experience the holy month in Makkah & Madinah with 5-star hospitality.",
        color: "from-rose-600 to-rose-400"
    },
];
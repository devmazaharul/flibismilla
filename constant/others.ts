
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



export const promoBanners = [
    {
        id: 1,
        title: "Florida to Dhaka",
        description: "Best price guaranteed from FLL/MCO to DAC. 2 Bags allowed.",
        image: "/asset/offer/florida.jpg",  //florida iamge
        whatsappMessage: "Hi, I am interested in the Florida to Dhaka flight offer.",
        isLarge: false, 
    },
    {
        id: 2,
        title: "Dallas to Dhaka",
        description: "Cheap flights from DFW to Dhaka. Limited time offer.",
        image: "/asset/offer/Dallas.jpg", 
        whatsappMessage: "Hi, I want to book a flight from Dallas to Dhaka.",
        isLarge: false,
    },
    {
        id: 3,
        title: "Buffalo to Dhaka",
        description: "Special discount from BUF to Dhaka. Book now!",
       image: "/asset/offer/Buffalo.jpg",
        whatsappMessage: "Hi, tell me the price for Buffalo to Dhaka flight.",
        isLarge: false,
    },
    {
        id: 4,
        title: "Rome to Dhaka",
        description: "Direct & connecting flights from FCO to DAC.",
       image: "/asset/offer/Rome.jpg",
        whatsappMessage: "Hi, I am looking for a ticket from Rome to Dhaka.",
        isLarge: true,
    },
    {
        id: 5,
        title: "Chicago to Dhaka",
        description: "Unbeatable fares from O'Hare (ORD) to Dhaka.",
        image: "/asset/offer/Chicago.jpg",
        whatsappMessage: "Hi, what is the best price for Chicago to Dhaka?",
        isLarge: false, 
    },
    {
        id: 6,
        title: "Memphis to Dhaka",
        description: "Affordable tickets from MEM to Dhaka with flexible dates.",
       image: "/asset/offer/Memphis.jpg",
        whatsappMessage: "Hi, I want to fly from Memphis to Dhaka.",
        isLarge: false,
    },
    {
        id: 7,
        title: "Miami to Dhaka",
        description: "Fly from sunny Miami (MIA) to Dhaka at low cost.",
        image: "/asset/offer/Miami.jpg",
        whatsappMessage: "Hi, interested in Miami to Dhaka flight.",
        isLarge: true,
    },
    {
        id: 8,
        title: "Dhaka to Atlanta",
        description: "Return tickets or one-way from DAC to ATL special deal.",
       image: "/asset/offer/atlanta1.jpg",
        whatsappMessage: "Hi, do you have tickets from Dhaka to Atlanta?",
        isLarge: false,
    }
];
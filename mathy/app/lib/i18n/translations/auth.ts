export const auth = {
  en: {
    // Sign in page
    signInTitle: "Sign in",
    signInSubtitle: "Welcome back to Mathy",
    
    // Sign up page
    signUpTitle: "Sign up",
    signUpSubtitle: "Join thousands of learners worldwide",
    
    // Form fields
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    username: "Username",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    
    // Buttons
    signInWithApple: "Sign in with Apple",
    signInWithGoogle: "Sign in with Google",
    signUpWithApple: "Sign up with Apple",
    signUpWithGoogle: "Sign up with Google",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    
    // Legal
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    agreeToTerms: "By logging in, you agree to our",
    and: "and",
    
    // Validation messages
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    passwordRequired: "Password is required",
    passwordTooShort: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    firstNameRequired: "First name is required",
    lastNameRequired: "Last name is required",
    usernameRequired: "Username is required",
    usernameTaken: "Username is already taken",
    
    // Success messages
    signInSuccess: "Welcome back!",
    signUpSuccess: "Account created successfully!",
    passwordResetSent: "Password reset email sent!",
    passwordResetSuccess: "Password reset successfully!",
    
    // Error messages
    signInError: "Invalid email or password",
    signUpError: "Failed to create account",
    networkError: "Network error. Please try again.",
    serverError: "Server error. Please try again later.",
    accountLocked: "Account is locked. Please contact support.",
    emailNotVerified: "Please verify your email address",
    
    // Password reset
    resetPasswordTitle: "Reset Password",
    resetPasswordSubtitle: "Enter your email to receive reset instructions",
    resetPasswordButton: "Send Reset Email",
    backToSignIn: "Back to Sign In",
    
    // Email verification
    verifyEmailTitle: "Verify Your Email",
    verifyEmailSubtitle: "We've sent a verification link to your email",
    verifyEmailButton: "Resend Verification Email",
    emailVerified: "Email verified successfully!",
    
    // Profile
    profileTitle: "Profile",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    deleteAccount: "Delete Account",
    accountSettings: "Account Settings",
    
    // Security
    twoFactorAuth: "Two-Factor Authentication",
    enable2FA: "Enable 2FA",
    disable2FA: "Disable 2FA",
    backupCodes: "Backup Codes",
    securitySettings: "Security Settings",
  },
  
  "zh-TW": {
    // Sign in page
    signInTitle: "登入",
    signInSubtitle: "歡迎回到 Mathy",
    
    // Sign up page
    signUpTitle: "註冊",
    signUpSubtitle: "加入全球數千名學習者",
    
    // Form fields
    email: "電子郵件",
    password: "密碼",
    confirmPassword: "確認密碼",
    firstName: "名字",
    lastName: "姓氏",
    username: "使用者名稱",
    rememberMe: "記住我",
    forgotPassword: "忘記密碼？",
    
    // Buttons
    signInWithApple: "使用 Apple 登入",
    signInWithGoogle: "使用 Google 登入",
    signUpWithApple: "使用 Apple 註冊",
    signUpWithGoogle: "使用 Google 註冊",
    createAccount: "建立帳戶",
    alreadyHaveAccount: "已經有帳戶了？",
    dontHaveAccount: "沒有帳戶？",
    
    // Legal
    termsOfService: "服務條款",
    privacyPolicy: "隱私政策",
    agreeToTerms: "登入即表示您同意我們的",
    and: "和",
    
    // Validation messages
    emailRequired: "電子郵件為必填項目",
    emailInvalid: "請輸入有效的電子郵件地址",
    passwordRequired: "密碼為必填項目",
    passwordTooShort: "密碼至少需要 8 個字元",
    passwordMismatch: "密碼不匹配",
    firstNameRequired: "名字為必填項目",
    lastNameRequired: "姓氏為必填項目",
    usernameRequired: "使用者名稱為必填項目",
    usernameTaken: "使用者名稱已被使用",
    
    // Success messages
    signInSuccess: "歡迎回來！",
    signUpSuccess: "帳戶建立成功！",
    passwordResetSent: "密碼重設郵件已發送！",
    passwordResetSuccess: "密碼重設成功！",
    
    // Error messages
    signInError: "電子郵件或密碼無效",
    signUpError: "建立帳戶失敗",
    networkError: "網路錯誤。請重試。",
    serverError: "伺服器錯誤。請稍後重試。",
    accountLocked: "帳戶已鎖定。請聯絡支援。",
    emailNotVerified: "請驗證您的電子郵件地址",
    
    // Password reset
    resetPasswordTitle: "重設密碼",
    resetPasswordSubtitle: "輸入您的電子郵件以接收重設指示",
    resetPasswordButton: "發送重設郵件",
    backToSignIn: "返回登入",
    
    // Email verification
    verifyEmailTitle: "驗證您的電子郵件",
    verifyEmailSubtitle: "我們已向您的電子郵件發送驗證連結",
    verifyEmailButton: "重新發送驗證郵件",
    emailVerified: "電子郵件驗證成功！",
    
    // Profile
    profileTitle: "個人資料",
    editProfile: "編輯個人資料",
    changePassword: "更改密碼",
    deleteAccount: "刪除帳戶",
    accountSettings: "帳戶設定",
    
    // Security
    twoFactorAuth: "雙重驗證",
    enable2FA: "啟用雙重驗證",
    disable2FA: "停用雙重驗證",
    backupCodes: "備用代碼",
    securitySettings: "安全設定",
  }
} as const;

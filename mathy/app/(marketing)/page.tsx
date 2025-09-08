import Link from "next/link";

export default function LandingPage() {
  return (
    //Landing Page Background Color Settings and Window 
    <div className="min-h-screen bg-white pt-20">
        {/* Responsive Margin for Content: 
        這個 mx-6 非常重要因為他讓所有的內容全部都有一樣的 responsive margins, 在調整 window 大小
        的時候可以確保我所有的內容的 margin 都是一樣的並且如果 text-left 的話也可以讓我的文字全部靠內容對齊*/}
        <div className="mx-6">
            <div className="relative mx-auto flex justify-center max-w-5xl">
                <div className="w-full">
                    {/* Hero Section */}
                    <div className="relative z-10 mt-10 pb-16">
                        {/* Hero Section Rounded Button for Latest News/Versions/Updates */}
                        <div className="text-left mb-4">
                            <button className="bg-neutral-200 border-2 border-neutral-400 
                            text-white px-4 py-2 rounded-full font-semibold hover:bg-grey-300/50 
                            transition-colors"> 
                            <button className="rounded-full text-left 
                            bg-blue-700/60 px-3">2025.9.20</button>
                            <span className="text-neutral-900/70
                            px-2">Beta version releasing</span>
                            </button>
                        </div>
                        {/* Hero Section Slogan */}
                        <div className="text-left">
                            <h1 className="max-w-3xl text-5xl 
                            leading-13 font-medium tracking-tight text-neutral-900">
                                Learn all levels of math.
                            </h1>
                            <h2 className="mt-1 text-2xl font-medium text-neutral-500">
                                with an addictive learning experience.
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div> 
  );
}
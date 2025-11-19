import Editor from '@/components/Editor';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
            <div className="w-full max-w-4xl mt-8">
                <Editor />
            </div>
        </main>
    );
}

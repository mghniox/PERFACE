import Nav from "./components/Nav";
import Camera from "./components/Camera";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="py-16 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8 px-4">
        <Nav />
        <Camera />
        <Footer />
      </div>
    </main>
  );
}

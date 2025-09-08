import NavigationBar from "../components/marketing components/navigationbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationBar />
      <main>{children}</main>
    </>
  );
}

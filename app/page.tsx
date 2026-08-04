import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "موج — تلویزیون زنده",
  description: "تلویزیون زنده، سبک و سازگار با ریموت تلویزیون سامسونگ",
};

export default function Home() {
  return (
    <main className="launch-page" dir="rtl">
      <meta httpEquiv="refresh" content="0; url=./tv/" />
      <div className="launch-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <h1>موج</h1>
      <p>تلویزیون زنده در حال باز شدن است…</p>
      <a href="./tv/">ورود به تلویزیون</a>
    </main>
  );
}

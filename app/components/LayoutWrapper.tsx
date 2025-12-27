"use client";

import ProfileWarningBanner from "./ProfileWarningBanner";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProfileWarningBanner />
      {children}
    </>
  );
}

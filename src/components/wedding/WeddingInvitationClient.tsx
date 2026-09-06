"use client";

import dynamic from "next/dynamic";
import type { WeddingInvitationProps } from "./WeddingInvitation";

const WeddingInvitation = dynamic(
  () => import("./WeddingInvitation").then((module) => module.WeddingInvitation),
  { ssr: false }
);

export function WeddingInvitationClient(props: WeddingInvitationProps) {
  return <WeddingInvitation {...props} />;
}

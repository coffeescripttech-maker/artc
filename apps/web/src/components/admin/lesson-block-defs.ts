import type { ElementType } from "react";
import {
  Type,
  Heading,
  Image as ImageIcon,
  Video,
  BookOpen,
  Sigma,
  Info,
  Paperclip,
  Minus,
  HelpCircle,
  ClipboardList,
} from "lucide-react";
import type { BlockType } from "@aratc/shared";

export interface BlockDef {
  key: string;
  label: string;
  icon: ElementType;
  type?: BlockType;
  soon?: boolean;
}

export interface BlockGroup {
  title: string;
  items: BlockDef[];
}

/** Single source of truth for the block library + add-content picker. */
export const BLOCK_GROUPS: BlockGroup[] = [
  {
    title: "Basic",
    items: [
      { key: "paragraph", label: "Text", icon: Type, type: "paragraph" },
      { key: "heading", label: "Heading", icon: Heading, type: "heading" },
      { key: "image", label: "Image", icon: ImageIcon, type: "image" },
      { key: "video", label: "Video", icon: Video, type: "video" },
    ],
  },
  {
    title: "Learning",
    items: [
      { key: "example", label: "Example", icon: BookOpen, type: "example" },
      { key: "formula", label: "Formula", icon: Sigma, type: "formula" },
      { key: "callout", label: "Callout", icon: Info, type: "callout" },
    ],
  },
  {
    title: "Resources",
    items: [
      { key: "resource", label: "Resource", icon: Paperclip, type: "resource" },
      { key: "divider", label: "Divider", icon: Minus, type: "divider" },
    ],
  },
  {
    title: "Interactive",
    items: [
      { key: "question", label: "Question", icon: HelpCircle, soon: true },
      { key: "practice", label: "Practice", icon: ClipboardList, soon: true },
    ],
  },
];
